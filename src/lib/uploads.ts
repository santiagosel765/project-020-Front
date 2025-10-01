export const MAX_UPLOAD = 2 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg"] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];
