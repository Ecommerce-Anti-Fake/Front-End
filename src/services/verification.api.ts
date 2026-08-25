const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type VerificationStatus = "VERIFIED" | "SUSPICIOUS" | "INACTIVE" | "NOT_FOUND";

export type VerificationResult = {
  status: VerificationStatus;
  labelType: string | null;
  issuedAt: string | null;
  brandName: string | null;
  productName: string | null;
  modelName: string | null;
  batchNumber: string | null;
  countryOfOrigin: string | null;
  sourceType: string | null;
  provenance: Array<{
    eventType: string;
    channel: string;
    occurredAt: string;
  }>;
};

export async function verifyProduct(code: string, signal?: AbortSignal) {
  const response = await fetch(
    `${typeof BASE_URL === "string" ? BASE_URL : ""}/api/verifications?code=${encodeURIComponent(code)}`,
    {
      headers: { Accept: "application/json" },
      signal,
    },
  );
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
  }

  if (!isVerificationResult(payload)) {
    throw new Error("Phản hồi xác thực không hợp lệ");
  }

  return payload;
}

function isVerificationResult(value: unknown): value is VerificationResult {
  if (!isRecord(value) || !isVerificationStatus(value.status)) return false;
  return (
    (value.labelType === null || typeof value.labelType === "string") &&
    (value.issuedAt === null || typeof value.issuedAt === "string") &&
    (value.brandName === null || typeof value.brandName === "string") &&
    (value.productName === null || typeof value.productName === "string") &&
    (value.modelName === null || typeof value.modelName === "string") &&
    (value.batchNumber === null || typeof value.batchNumber === "string") &&
    (value.countryOfOrigin === null || typeof value.countryOfOrigin === "string") &&
    (value.sourceType === null || typeof value.sourceType === "string") &&
    Array.isArray(value.provenance) &&
    value.provenance.every(
      (event) =>
        isRecord(event) &&
        typeof event.eventType === "string" &&
        typeof event.channel === "string" &&
        typeof event.occurredAt === "string",
    )
  );
}

function isVerificationStatus(value: unknown): value is VerificationStatus {
  return value === "VERIFIED" || value === "SUSPICIOUS" || value === "INACTIVE" || value === "NOT_FOUND";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(value: unknown) {
  if (isRecord(value) && typeof value.message === "string") return value.message;
  return "Không thể kiểm tra sản phẩm lúc này";
}
