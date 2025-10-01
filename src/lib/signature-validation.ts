const DEFAULT_VALIDATION_OPTIONS = {
  maxBytes: 2 * 1024 * 1024,
  maxWidth: 800,
  maxHeight: 400,
  minAspect: 2.0,
  maxAspect: 8.0,
  minInk: 0.003,
  maxInk: 0.2,
} as const;

export type SignatureValidationOptions = typeof DEFAULT_VALIDATION_OPTIONS;

export type SignatureValidationResult = {
  blob: Blob;
  width: number;
  height: number;
  aspect: number;
  inkRatio: number;
};

export type SignatureValidationErrorCode =
  | 'invalid-type'
  | 'file-too-large'
  | 'invalid-dimensions'
  | 'invalid-aspect'
  | 'invalid-ink'
  | 'empty-image';

export class SignatureValidationError extends Error {
  readonly code: SignatureValidationErrorCode;

  constructor(code: SignatureValidationErrorCode, message: string) {
    super(message);
    this.name = 'SignatureValidationError';
    this.code = code;
  }
}

function ensureBrowser(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('La validación de firmas solo está disponible en el navegador.');
  }
}

function mergeOptions(
  options?: Partial<SignatureValidationOptions>,
): SignatureValidationOptions {
  return {
    ...DEFAULT_VALIDATION_OPTIONS,
    ...options,
  };
}

function isAllowedType(file: File | Blob): boolean {
  if ('type' in file && file.type) {
    return /image\/png|image\/jpe?g/i.test(file.type);
  }
  return false;
}

async function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  ensureBrowser();
  const url = URL.createObjectURL(file);
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = (event) => {
      URL.revokeObjectURL(url);
      reject(event);
    };
    image.src = url;
  });
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function luminance(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function isInkPixel(r: number, g: number, b: number, a: number): boolean {
  const alpha = a / 255;
  if (alpha < 0.05) return false;
  const lum = luminance(r, g, b);
  return lum < 0.85 || (r < 220 && g < 220 && b < 220);
}

function isVisiblePixel(r: number, g: number, b: number, a: number): boolean {
  const alpha = a / 255;
  if (alpha < 0.02) return false;
  const lum = luminance(r, g, b);
  return lum < 0.99;
}

function computeInkMetrics(
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  let inkPixels = 0;
  let top = height;
  let bottom = -1;
  let left = width;
  let right = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      if (isInkPixel(r, g, b, a)) {
        inkPixels += 1;
      }

      if (isVisiblePixel(r, g, b, a)) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }

  if (bottom === -1 || right === -1) {
    return { inkRatio: inkPixels / (width * height), bounds: null } as const;
  }

  return {
    inkRatio: inkPixels / (width * height),
    bounds: { top, bottom, left, right },
  } as const;
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((result) => resolve(result), 'image/png', 1.0),
  );
  if (!blob) {
    throw new Error('No se pudo generar la imagen de la firma.');
  }
  return blob;
}

export async function validateAndSanitizeSignature(
  file: File | Blob,
  opts?: Partial<SignatureValidationOptions>,
): Promise<SignatureValidationResult> {
  const options = mergeOptions(opts);

  if (!isAllowedType(file)) {
    throw new SignatureValidationError(
      'invalid-type',
      'Formato no permitido (solo PNG/JPG).',
    );
  }

  if ('size' in file && file.size > options.maxBytes) {
    throw new SignatureValidationError(
      'file-too-large',
      'Archivo demasiado grande (máximo 2 MB).',
    );
  }

  const image = await loadImage(file);
  const { naturalWidth: width, naturalHeight: height } = image;

  if (!width || !height) {
    throw new SignatureValidationError(
      'invalid-dimensions',
      'Dimensiones no válidas (máximo 800×400 px).',
    );
  }

  const sourceCanvas = createCanvas(width, height);
  const ctx = sourceCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo preparar el lienzo para validar la firma.');
  }
  ctx.drawImage(image, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const { inkRatio, bounds } = computeInkMetrics(imageData.data, width, height);

  if (!bounds) {
    throw new SignatureValidationError(
      'empty-image',
      'La imagen no parece una firma (demasiado vacía o demasiada tinta).',
    );
  }

  if (inkRatio < options.minInk || inkRatio > options.maxInk) {
    throw new SignatureValidationError(
      'invalid-ink',
      'La imagen no parece una firma (demasiado vacía o demasiada tinta).',
    );
  }

  const cropWidth = bounds.right - bounds.left + 1;
  const cropHeight = bounds.bottom - bounds.top + 1;

  if (cropWidth <= 0 || cropHeight <= 0) {
    throw new SignatureValidationError(
      'empty-image',
      'La imagen no parece una firma (demasiado vacía o demasiada tinta).',
    );
  }

  const trimmedCanvas = createCanvas(cropWidth, cropHeight);
  const trimmedCtx = trimmedCanvas.getContext('2d');
  if (!trimmedCtx) {
    throw new Error('No se pudo procesar la firma.');
  }
  trimmedCtx.putImageData(
    ctx.getImageData(bounds.left, bounds.top, cropWidth, cropHeight),
    0,
    0,
  );

  let targetWidth = cropWidth;
  let targetHeight = cropHeight;

  const aspect = targetWidth / targetHeight;
  if (aspect < options.minAspect || aspect > options.maxAspect) {
    throw new SignatureValidationError(
      'invalid-aspect',
      'Relación de aspecto no válida (entre 2:1 y 8:1).',
    );
  }

  const widthRatio = options.maxWidth / targetWidth;
  const heightRatio = options.maxHeight / targetHeight;
  const scale = Math.min(1, widthRatio, heightRatio);

  if (scale < 1) {
    targetWidth = Math.max(1, Math.round(targetWidth * scale));
    targetHeight = Math.max(1, Math.round(targetHeight * scale));
  }

  const resultCanvas = createCanvas(targetWidth, targetHeight);
  const resultCtx = resultCanvas.getContext('2d');
  if (!resultCtx) {
    throw new Error('No se pudo generar la firma final.');
  }
  resultCtx.drawImage(trimmedCanvas, 0, 0, targetWidth, targetHeight);

  const blob = await canvasToBlob(resultCanvas);

  return {
    blob,
    width: targetWidth,
    height: targetHeight,
    aspect,
    inkRatio,
  };
}

export const SIGNATURE_VALIDATION_DEFAULTS = DEFAULT_VALIDATION_OPTIONS;
