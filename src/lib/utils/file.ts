export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Re-encodes a photo as JPEG with its longest side capped at `maxSide`.
 * Phone photos are often 4–8MB; Zia reads a 1600px image just as well, and a
 * smaller upload keeps analysis inside the backend's 30s request budget.
 * Falls back to the original if the browser can't decode it (e.g. some HEIC).
 */
export async function downscaleImageDataUrl(dataUrl: string, maxSide = 1600, quality = 0.85): Promise<string> {
  try {
    const image = new Image();
    image.src = dataUrl;
    await image.decode();
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    if (scale === 1 && dataUrl.startsWith("data:image/jpeg") && dataUrl.length < 2_500_000) return dataUrl;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) return dataUrl;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return dataUrl;
  }
}
