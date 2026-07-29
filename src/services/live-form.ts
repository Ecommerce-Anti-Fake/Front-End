export const LIVE_COVER_MAX_BYTES = 5 * 1024 * 1024;

const LIVE_COVER_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type CreateLiveSessionFormInput = {
  clientId: string;
  shopId: string;
  title: string;
  description?: string;
  startAt: string;
  offerIds: string[];
  voucherIds?: string[];
  coverImage?: File;
};

export function validateLiveCoverFile(file: File): string | null {
  if (!LIVE_COVER_MIME_TYPES.has(file.type)) {
    return "Ảnh bìa phải là JPG, PNG hoặc WebP";
  }
  if (file.size === 0) return "Ảnh bìa không được để trống";
  if (file.size > LIVE_COVER_MAX_BYTES) {
    return "Ảnh bìa không được vượt quá 5 MB";
  }
  return null;
}

export function createLiveCoverPreview(
  file: File,
  createObjectUrl: (file: File) => string = (value) =>
    URL.createObjectURL(value),
  revokeObjectUrl: (url: string) => void = (url) =>
    URL.revokeObjectURL(url),
) {
  const url = createObjectUrl(file);
  let revoked = false;
  return {
    url,
    revoke() {
      if (revoked) return;
      revoked = true;
      revokeObjectUrl(url);
    },
  };
}

export function buildLiveSessionFormData(
  input: CreateLiveSessionFormInput,
): FormData {
  const formData = new FormData();
  formData.set("clientId", input.clientId);
  formData.set("shopId", input.shopId);
  formData.set("title", input.title);
  if (input.description) formData.set("description", input.description);
  formData.set("startAt", input.startAt);
  input.offerIds.forEach((offerId) => formData.append("offerIds", offerId));
  input.voucherIds?.forEach((voucherId) =>
    formData.append("voucherIds", voucherId),
  );
  if (input.coverImage) formData.set("coverImage", input.coverImage);
  return formData;
}
