import imageCompression from "browser-image-compression";

export const SUPPORTED_AI_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const listingImageCompressionOptions = {
  maxSizeMB: 0.45,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
  initialQuality: 0.82,
  preserveExif: false
} as const;

type GenerateListingImageUploadUrl = (args: Record<string, never>) => Promise<string>;

export type ListingImageUploadResult = {
  storageId: string;
  compressedSize: number;
  contentType: string;
};

export function formatImageBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isSupportedAiImage(file: File) {
  return SUPPORTED_AI_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_AI_IMAGE_TYPES)[number]);
}

export async function compressListingImage(file: File) {
  return await imageCompression(file, listingImageCompressionOptions);
}

export async function uploadListingImageToConvexStorage({
  file,
  generateUploadUrl,
  prepareErrorMessage = "Nismo uspjeli pripremiti upload slika. Provjeri prijavu i pokušaj ponovno.",
  uploadErrorMessage = "Upload slike nije uspio."
}: {
  file: File;
  generateUploadUrl: GenerateListingImageUploadUrl;
  prepareErrorMessage?: string;
  uploadErrorMessage?: string;
}): Promise<ListingImageUploadResult> {
  const compressed = await compressListingImage(file);
  let uploadUrl: string;

  try {
    uploadUrl = await generateUploadUrl({});
  } catch {
    throw new Error(prepareErrorMessage);
  }

  const contentType = compressed.type || file.type || "image/jpeg";
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: compressed
  });

  if (!response.ok) {
    throw new Error(uploadErrorMessage);
  }

  const result = (await response.json()) as { storageId?: unknown };

  if (typeof result.storageId !== "string") {
    throw new Error(uploadErrorMessage);
  }

  return {
    storageId: result.storageId,
    compressedSize: compressed.size,
    contentType
  };
}
