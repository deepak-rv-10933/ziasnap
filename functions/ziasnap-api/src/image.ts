/** Decodes the base64 photo the browser sends. Photos are never stored — only forwarded to Zia. */
export function decodeImageDataUrl(dataUrl: unknown): { buffer: Buffer; mimeType: string } {
  const match = typeof dataUrl === "string" ? /^data:(image\/[\w.+-]+);base64,(.+)$/.exec(dataUrl) : null;
  if (!match) throw new Error("imageDataUrl must be a base64 image data URL");
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > 10 * 1024 * 1024) throw new Error("Photo is larger than 10MB");
  return { mimeType: match[1], buffer };
}
