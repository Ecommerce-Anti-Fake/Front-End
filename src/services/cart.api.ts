import { authFetch } from "../ultil/auth";
import type {
  CartCheckoutRequest,
  CartCheckoutResponse,
  CartCheckoutQuote,
  CartResponse,
  ShippingOptionsRequest,
  ShippingOptionsResponse,
} from "../type/checkout";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;

const pickCheckoutValue = (
  data: unknown,
  key: "orderId" | "orderCode" | "checkoutUrl" | "paymentLinkId",
) => {
  const aliases = {
    orderId: ["orderId", "id"],
    orderCode: ["orderCode", "payOSOrderCode", "code"],
    checkoutUrl: ["checkoutUrl", "payOSCheckoutUrl", "paymentUrl"],
    paymentLinkId: ["paymentLinkId", "payOSPaymentLinkId"],
  } as const;
  const root = asRecord(data);
  const nestedData = asRecord(root?.data);
  const rootOrders = Array.isArray(root?.orders) ? root.orders : [];
  const nestedOrders = Array.isArray(nestedData?.orders)
    ? nestedData.orders
    : [];
  const containers = [
    root,
    nestedData,
    asRecord(root?.order),
    asRecord(nestedData?.order),
    asRecord(rootOrders[0]),
    asRecord(nestedOrders[0]),
  ];

  for (const container of containers) {
    for (const alias of aliases[key]) {
      const value = container?.[alias];
      if (value !== undefined && value !== null) return value;
    }
  }

  return undefined;
};

const getApiErrorMessage = async (response: Response, fallback: string) => {
  const text = await response.text();
  if (!text) return fallback;

  try {
    const data = JSON.parse(text);
    return data?.message ?? data?.error ?? fallback;
  } catch {
    return text;
  }
};

export const addToCart = async (
  offerId: string,
  quantity: number,
  variantId?: string,
  sourceLiveSessionId?: string,
) => {
  const response = await authFetch(`${BASE_URL}/api/cart/items`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      offerId,
      quantity,
      ...(variantId ? { variantId } : {}),
      ...(sourceLiveSessionId ? { sourceLiveSessionId } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "Không thể thêm vào giỏ hàng"),
    );
  }

  return response.json();
};

export const fetchCart = async (): Promise<CartResponse> => {
  const response = await authFetch(`${BASE_URL}/api/cart`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, `HTTP Error: ${response.status}`),
    );
  }

  const data = await response.json();
  return data?.data ?? data;
};

export const fetchShippingOptions = async (
  payload: ShippingOptionsRequest,
): Promise<ShippingOptionsResponse> => {
  const response = await authFetch(`${BASE_URL}/api/cart/shipping-options`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Không thể lấy phương thức vận chuyển");
  }

  return {
    options: Array.isArray(data.options) ? data.options : [],
  };
};

export const checkoutCart = async (
  payload: CartCheckoutRequest,
): Promise<CartCheckoutResponse> => {
  const response = await authFetch(`${BASE_URL}/api/cart/checkout`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Không thể tạo thanh toán");
  }

  const checkout = {
    ...data,
    orderId: pickCheckoutValue(data, "orderId"),
    orderCode: pickCheckoutValue(data, "orderCode"),
    checkoutUrl: pickCheckoutValue(data, "checkoutUrl"),
    paymentLinkId: pickCheckoutValue(data, "paymentLinkId"),
  };

  if (
    payload.paymentMethod === "PAYOS" &&
    (!checkout.orderId ||
      checkout.orderCode == null ||
      !checkout.checkoutUrl ||
      !checkout.paymentLinkId)
  ) {
    throw new Error("API checkout PAYOS thiếu thông tin liên kết thanh toán");
  }

  return checkout;
};

export const quoteCartCheckout = async (payload: Omit<CartCheckoutRequest, "paymentMethod" | "affiliateCode">): Promise<CartCheckoutQuote> => {
  const response = await authFetch(`${BASE_URL}/api/cart/checkout/quote`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Không thể tính báo giá checkout");
  return data?.data ?? data;
};

export const updateCartItemQuantity = async (
  cartItemId: string,
  quantity: number,
) => {
  const response = await authFetch(`${BASE_URL}/api/cart/items/${cartItemId}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      quantity,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Cập nhật số lượng thất bại");
  }

  return data;
};

export const deleteCartItem = async (cartItemId: string) => {
  const response = await authFetch(`${BASE_URL}/api/cart/items/${cartItemId}`, {
    method: "DELETE",
    headers: {
      Accept: "*/*",
    },
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "Xóa sản phẩm thất bại"),
    );
  }

  return true;
};
