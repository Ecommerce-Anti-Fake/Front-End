import { authFetch } from "../ultil/auth";
import type {
  BuyNowCheckoutRequest,
  BuyNowPreview,
  BuyNowSelection,
  CartCheckoutResponse,
  ShippingOption,
} from "../type/checkout";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;


interface SearchParams {
  q?: string;
  shopId?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}

export type CreateOfferPayload = {
  categoryId: string;
  brandId: string;
  title: string;
  description: string;
  productImages: string[];
  currency: "VND";
  itemCondition: "new" | "used";
  gtin: string;
  model: string;
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  optionGroups?: {
    displayName: string;
    values: {
      text: string;
      mediaAssetId?: string | null;
      image?: string | null;
      sortOrder?: number;
    }[];
  }[];
};

export type UpdateOfferPayload = {
  title: string;
  description: string;
  price: number;
  availableQuantity: number;
  parcelWeightGrams: number;
  parcelLengthCm: number;
  parcelWidthCm: number;
  parcelHeightCm: number;
  offerStatus: "active" | "inactive" | "draft";
};

export type OfferDetail = {
  id: string;
  title: string;
  description?: string | null;
  price?: number;
  currency?: string;
  itemCondition?: string;
  availableQuantity?: number;
  parcelWeightGrams?: number;
  parcelLengthCm?: number;
  parcelWidthCm?: number;
  parcelHeightCm?: number;
  soldQuantity?: number;
  verificationLevel?: string;
  offerStatus?: string;
  moderationStatus?: string;
  moderationReason?: string | null;
  categoryId?: string;
  brandId?: string;
  gtin?: number | string;
  verificationPolicy?: string;
  distributionNodeId?: string;
  distributionNetworkId?: string;
  categoryName?: string;
  productModelName?: string;
  thumbnailUrl?: string | null;
  imageUrls?: string[];
  optionGroups?: Array<{
    id: string;
    displayName: string;
    values: Array<{
      id: string;
      text: string;
      mediaAsset: {
        id: string;
        secureUrl: string;
      } | null;
    }>;
  }>;
  variants?: Array<{
    id: string;
    sku: string | null;
    price?: number | null;
    priceOverride?: number | null;
    availableQuantity: number;
    isActive: boolean;
    optionValueIds?: string[];
    optionValues?: Array<{
      id: string;
      text: string;
      optionGroup?: {
        id: string;
        displayName: string;
      };
    }>;
    mediaAsset: {
      id: string;
      secureUrl: string;
    } | null;
  }>;
  createdAt?: string;
};

export type OfferVariant = NonNullable<OfferDetail["variants"]>[number];

export type OfferMediaUploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  publicId: string;
  uploadResourceType: "image" | "video";
  signature: string;
};

export type OfferMedia = {
  id: string;
  offerId: string;
  mediaType: string;
  fileUrl: string;
  publicId?: string | null;
};

export type UpdateOfferVariantPayload = {
  priceOverride?: number | null;
  availableQuantity?: number;
  isActive?: boolean;
  image?: string | null;
  mediaAssetId?: string | null;
};

export const createOffer = async (payload: CreateOfferPayload) => {
  const response = await authFetch(`${BASE_URL}/api/offers`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Khong the tao san pham moi");
  }

  return data?.data ?? data;
};

export const fetchOffers = async (page: number, pageSize: number) => {
  const response = await fetch(
    `${BASE_URL}/api/offers?page=${page}&pageSize=${pageSize}`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

export const fetchOfferDetail = async (id: string): Promise<OfferDetail> => {
  const response = await fetch(
    `${BASE_URL}/api/offers/${id}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Không thể lấy chi tiết sản phẩm");
  }

  const data = await response.json();
  return data?.data ?? data;
};

export const fetchBuyNowPreview = async ({
  offerId,
  variantId,
  quantity,
}: BuyNowSelection): Promise<BuyNowPreview> => {
  const query = new URLSearchParams({
    offerId,
    quantity: String(quantity),
  });
  if (variantId) query.set("variantId", variantId);

  const response = await authFetch(
    `${BASE_URL}/api/offers/buy-now?${query.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Không thể tải thông tin mua ngay");
  }

  const payload = data?.data ?? data;
  if (!payload?.offerId || !payload?.shopId) {
    throw new Error("Dữ liệu mua ngay không hợp lệ");
  }

  const previewQuantity = Number(payload.quantity);
  const previewPrice = Number(payload.price);
  if (
    !Number.isInteger(previewQuantity) ||
    previewQuantity <= 0 ||
    !Number.isFinite(previewPrice) ||
    previewPrice < 0
  ) {
    throw new Error("Số lượng hoặc giá mua ngay không hợp lệ");
  }

  const shippingOptions: ShippingOption[] = Array.isArray(payload.shippingOptions)
    ? payload.shippingOptions
        .map((option: unknown): ShippingOption | null => {
          if (!option || typeof option !== "object") return null;
          const record = option as Record<string, unknown>;
          if (
            typeof record.optionCode !== "string" ||
            typeof record.providerCode !== "string" ||
            typeof record.providerName !== "string" ||
            typeof record.methodName !== "string"
          ) {
            return null;
          }

          return {
            optionCode: record.optionCode,
            providerCode: record.providerCode,
            providerName: record.providerName,
            methodName: record.methodName,
            shippingFee: Number(record.shippingFee ?? 0),
            estimatedDelivery: String(record.estimatedDelivery ?? ""),
          };
        })
        .filter((option: ShippingOption | null): option is ShippingOption =>
          option !== null,
        )
    : [];

  return {
    shopId: String(payload.shopId),
    shopName: String(payload.shopName ?? "Shop"),
    offerId: String(payload.offerId),
    modelName: String(payload.modelName ?? "Sản phẩm"),
    variantId:
      typeof payload.variantId === "string" ? payload.variantId : undefined,
    sku: typeof payload.sku === "string" ? payload.sku : undefined,
    quantity: previewQuantity,
    price: previewPrice,
    thumbnailUrl:
      typeof payload.thumbnailUrl === "string" ? payload.thumbnailUrl : undefined,
    shippingOptions,
  };
};

export const checkoutBuyNow = async (
  payload: BuyNowCheckoutRequest,
): Promise<CartCheckoutResponse> => {
  const response = await authFetch(`${BASE_URL}/api/offers/buy-now/checkout`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Không thể tạo thanh toán mua ngay");
  }

  const result = data?.data ?? data;
  const checkout = {
    ...result,
    orderId: result?.orderId ?? result?.id,
    orderCode:
      result?.orderCode ?? result?.payOSOrderCode ?? result?.code,
    checkoutUrl:
      result?.checkoutUrl ??
      result?.payOSCheckoutUrl ??
      result?.paymentUrl,
    paymentLinkId: result?.paymentLinkId ?? result?.payOSPaymentLinkId,
  };

  if (
    payload.paymentMethod === "PAYOS" &&
    (!checkout.orderId ||
      checkout.orderCode == null ||
      !checkout.checkoutUrl ||
      !checkout.paymentLinkId)
  ) {
    throw new Error("API mua ngay PAYOS thiếu thông tin liên kết thanh toán");
  }

  return checkout;
};

export const quoteBuyNowCheckout = async (payload: BuyNowCheckoutRequest): Promise<{ discountAmount: number; buyerPayableAmount: number }> => {
  const response = await authFetch(`${BASE_URL}/api/offers/buy-now/quote`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      offerId: payload.offerId,
      variantId: payload.variantId,
      quantity: payload.quantity,
      shippingOptionCode: payload.shippingOptionCode,
      systemVoucherCode: payload.systemVoucherCode,
      shopVoucherCode: payload.shopVoucherCode,
      shippingVoucherCode: payload.shippingVoucherCode,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Không thể tính báo giá mua ngay");
  return data?.data ?? data;
};

export const updateOffer = async (
  offerId: string,
  payload: UpdateOfferPayload,
): Promise<OfferDetail> => {
  const response = await authFetch(`${BASE_URL}/api/offers/${offerId}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Khong the cap nhat san pham");
  }

  return data?.data ?? data;
};

const parseApiPayload = async (response: Response, fallback: string) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || fallback);
  return data?.data ?? data;
};

const uploadOfferImages = async (
  offerId: string,
  files: File[],
  firstAsThumbnail = false,
) => {
  if (files.length === 0) return [];

  const signatureResponse = await authFetch(
    `${BASE_URL}/api/offers/${offerId}/media/upload-signatures`,
    {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ items: files.map(() => ({ assetType: "IMAGE" })) }),
    },
  );
  const signatures = (await parseApiPayload(
    signatureResponse,
    "Khong the tao chu ky upload anh",
  )) as OfferMediaUploadSignature[];

  const uploadedItems = await Promise.all(
    files.map(async (file, index) => {
      const signature = signatures[index];
      if (!signature) throw new Error("Cloudinary upload signature khong hop le");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signature.apiKey);
      formData.append("timestamp", String(signature.timestamp));
      formData.append("folder", signature.folder);
      formData.append("public_id", signature.publicId);
      formData.append("signature", signature.signature);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.uploadResourceType}/upload`,
        { method: "POST", body: formData },
      );
      const uploadData = await uploadResponse.json().catch(() => ({}));
      if (!uploadResponse.ok || !uploadData.secure_url || !uploadData.public_id) {
        throw new Error("Upload anh len Cloudinary that bai");
      }

      return {
        assetType: "IMAGE" as const,
        mimeType: file.type,
        fileUrl: uploadData.secure_url as string,
        publicId: uploadData.public_id as string,
        mediaType: firstAsThumbnail && index === 0 ? "thumbnail" : "gallery",
        bytes: file.size,
      };
    }),
  );

  return uploadedItems;
};

export const fetchOfferMedia = async (offerId: string): Promise<OfferMedia[]> => {
  const response = await authFetch(`${BASE_URL}/api/offers/${offerId}/media`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const payload = await parseApiPayload(response, "Khong the lay danh sach anh");
  return Array.isArray(payload) ? payload : [];
};

export const addOfferImages = async (
  offerId: string,
  files: File[],
  firstAsThumbnail = false,
): Promise<OfferMedia[]> => {
  const uploadedItems = await uploadOfferImages(offerId, files, firstAsThumbnail);
  if (uploadedItems.length === 0) return [];

  const response = await authFetch(
    `${BASE_URL}/api/offers/${offerId}/media`,
    {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ items: uploadedItems }),
    },
  );
  const payload = await parseApiPayload(response, "Khong the luu anh san pham");
  return Array.isArray(payload) ? payload : [];
};

export const deleteOfferImage = async (offerId: string, mediaId: string) => {
  const response = await authFetch(
    `${BASE_URL}/api/offers/${offerId}/media/${mediaId}`,
    { method: "DELETE", headers: { Accept: "application/json" } },
  );
  return parseApiPayload(response, "Khong the xoa anh san pham");
};

export const setOfferPrimaryImage = async (offerId: string, mediaId: string) => {
  const response = await authFetch(
    `${BASE_URL}/api/offers/${offerId}/media/${mediaId}/primary`,
    { method: "PATCH", headers: { Accept: "application/json" } },
  );
  return parseApiPayload(response, "Khong the dat anh dai dien");
};

export const replaceOfferImages = async (
  offerId: string,
  files: File[],
): Promise<OfferMedia[]> => {
  const uploadedItems = await uploadOfferImages(offerId, files);
  if (uploadedItems.length === 0) return [];

  const response = await authFetch(
    `${BASE_URL}/api/offers/${offerId}/media/replace`,
    {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ items: uploadedItems }),
    },
  );
  const payload = await parseApiPayload(response, "Khong the luu anh san pham");
  return Array.isArray(payload) ? payload : [];
};

export const fetchOfferVariants = async (
  offerId: string,
  isActive?: boolean,
): Promise<OfferVariant[]> => {
  const query = new URLSearchParams();
  if (typeof isActive === "boolean") query.set("isActive", String(isActive));

  const response = await authFetch(
    `${BASE_URL}/api/offers/${offerId}/variants${
      query.toString() ? `?${query.toString()}` : ""
    }`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Khong the lay danh sach variant");
  }

  const payload = data?.data ?? data;
  return Array.isArray(payload) ? payload : payload?.items ?? [];
};

export const updateOfferVariant = async (
  offerId: string,
  variantId: string,
  payload: UpdateOfferVariantPayload,
): Promise<OfferVariant> => {
  const response = await authFetch(
    `${BASE_URL}/api/offers/${offerId}/variants/${variantId}`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Khong the cap nhat variant");
  }

  return data?.data ?? data;
};

export const deleteOfferVariant = async (
  offerId: string,
  variantId: string,
): Promise<void> => {
  const response = await authFetch(
    `${BASE_URL}/api/offers/${offerId}/variants/${variantId}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || "Khong the xoa variant");
  }
};

export const searchOffers = async ({
  q,
  shopId,
  categoryId,
  minPrice,
  maxPrice,
  page = 1,
  pageSize = 20,
}: SearchParams = {}) => {
  const params = new URLSearchParams();

  if (q) params.append("q", q);
  if (shopId) params.append("shopId", shopId);
  if (categoryId) params.append("categoryId", categoryId);
  if (minPrice !== undefined)
    params.append("minPrice", String(minPrice));
  if (maxPrice !== undefined)
    params.append("maxPrice", String(maxPrice));

  params.append("page", String(page));
  params.append("pageSize", String(pageSize));

  const response = await fetch(
    `${BASE_URL}/api/offers?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Không thể tải danh sách sản phẩm");
  }
  const data = response.json()
  return data;
};
