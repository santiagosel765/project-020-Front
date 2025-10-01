export type SignatureValidationOptions = {
  maxBytes: number;
  maxWidth: number;
  maxHeight: number;
  minAspect: number;
  maxAspect: number;
  minInk: number;
  maxInk: number;
};

const DEFAULT_OPTIONS: SignatureValidationOptions = {
  maxBytes: 2 * 1024 * 1024,
  maxWidth: 800,
  maxHeight: 400,
  minAspect: 2,
  maxAspect: 8,
  minInk: 0.003,
  maxInk: 0.2,
};

export type SignatureValidationErrorCode =
  | 'invalid-type'
  | 'file-too-large'
  | 'invalid-dimensions'
  | 'invalid-aspect'
  | 'invalid-ink'
  | 'empty-image';

export class SignatureValidationError extends Error {
  code: SignatureValidationErrorCode;

  constructor(code: SignatureValidationErrorCode, message?: string) {
    super(message);
    this.name = 'SignatureValidationError';
    this.code = code;
  }
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg'];

const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const loadImage = (blob: Blob) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    image.src = url;
  });

const isInkPixel = (r: number, g: number, b: number, a: number) => {
  if (a <= 13) return false; // ~0.05 alpha threshold
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance < 0.85) return true;
  return r < 220 && g < 220 && b < 220;
};

const trimWhitespace = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas context not available');

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  let top = height;
  let bottom = -1;
  let left = width;
  let right = -1;
  let inkPixels = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      if (!isInkPixel(r, g, b, a)) continue;

      inkPixels++;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }

  if (inkPixels === 0 || left > right || top > bottom) {
    throw new SignatureValidationError('empty-image', 'No se encontraron trazos.');
  }

  const trimmedWidth = right - left + 1;
  const trimmedHeight = bottom - top + 1;

  const trimmedCanvas = createCanvas(trimmedWidth, trimmedHeight);
  const trimmedCtx = trimmedCanvas.getContext('2d');
  if (!trimmedCtx) throw new Error('Canvas context not available');

  trimmedCtx.drawImage(
    canvas,
    left,
    top,
    trimmedWidth,
    trimmedHeight,
    0,
    0,
    trimmedWidth,
    trimmedHeight,
  );

  return trimmedCanvas;
};

const calculateInkRatio = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas context not available');

  const { width, height } = canvas;
  if (width === 0 || height === 0) {
    throw new SignatureValidationError('invalid-dimensions', 'Dimensiones inválidas.');
  }
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const totalPixels = width * height;
  const maxSamples = 400 * 400;
  const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / maxSamples)));

  let inkCount = 0;
  let samples = 0;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      if (isInkPixel(r, g, b, a)) {
        inkCount++;
      }
      samples++;
    }
  }

  if (samples === 0) {
    throw new SignatureValidationError('invalid-dimensions', 'Dimensiones inválidas.');
  }

  return inkCount / samples;
};

const resizeCanvasIfNeeded = (
  canvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number,
) => {
  const { width, height } = canvas;
  if (width <= maxWidth && height <= maxHeight) {
    return canvas;
  }

  const scale = Math.min(maxWidth / width, maxHeight / height);
  const nextWidth = Math.max(1, Math.round(width * scale));
  const nextHeight = Math.max(1, Math.round(height * scale));

  const resizedCanvas = createCanvas(nextWidth, nextHeight);
  const resizedCtx = resizedCanvas.getContext('2d');
  if (!resizedCtx) throw new Error('Canvas context not available');

  resizedCtx.drawImage(canvas, 0, 0, nextWidth, nextHeight);
  return resizedCanvas;
};

const canvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('No se pudo generar la imagen.'));
      }
    }, 'image/png', 1);
  });

export async function validateAndSanitizeSignature(
  file: File | Blob,
  options: Partial<SignatureValidationOptions> = {},
): Promise<{
  blob: Blob;
  width: number;
  height: number;
  aspect: number;
  inkRatio: number;
}> {
  const opts: SignatureValidationOptions = { ...DEFAULT_OPTIONS, ...options };

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new SignatureValidationError('invalid-type', 'Formato no permitido.');
  }

  if (file.size > opts.maxBytes) {
    throw new SignatureValidationError('file-too-large', 'Archivo demasiado grande.');
  }

  const image = await loadImage(file);
  const baseCanvas = createCanvas(image.width, image.height);
  const baseCtx = baseCanvas.getContext('2d');
  if (!baseCtx) throw new Error('Canvas context not available');
  baseCtx.drawImage(image, 0, 0);

  let workingCanvas = trimWhitespace(baseCanvas);
  const aspect = workingCanvas.width / workingCanvas.height;

  if (aspect < opts.minAspect || aspect > opts.maxAspect) {
    throw new SignatureValidationError('invalid-aspect', 'Relación de aspecto no válida.');
  }

  workingCanvas = resizeCanvasIfNeeded(workingCanvas, opts.maxWidth, opts.maxHeight);

  const inkRatio = calculateInkRatio(workingCanvas);
  if (inkRatio < opts.minInk || inkRatio > opts.maxInk) {
    throw new SignatureValidationError('invalid-ink', 'Proporción de tinta no válida.');
  }

  const blob = await canvasToBlob(workingCanvas);

  return {
    blob,
    width: workingCanvas.width,
    height: workingCanvas.height,
    aspect,
    inkRatio,
  };
}
