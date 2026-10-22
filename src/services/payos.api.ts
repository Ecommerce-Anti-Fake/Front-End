import { authFetch } from "../ultil/auth";
import type { PaymentReference, PayOSCheckoutState } from "../components/payment/payosCheckoutState";
export type PayOSPayment = {
  orderId?: string; orderCode?: string | number; topUpId?: string; id?: string;
  paymentLinkId: string; checkoutUrl: string | null; qrCode?: string | null; amount: string | number;
  currency?: string; expiresAt?: string | null; serverTime?: string; status: string;
  canResume?: boolean; canRetry?: boolean; message?: string;
};
const basePath = (ref: PaymentReference) => ref.flow === "ORDER"
  ? "/orders/" + encodeURIComponent(ref.reference) + "/payos-payment"
  : (ref.flow === "SHOP_WALLET_TOP_UP" ? "/shops/" + encodeURIComponent(ref.shopId!) + "/wallet" : "/wallet/me") + "/top-ups/" + encodeURIComponent(ref.reference);
export async function requestPayOSPayment(ref: PaymentReference, action: "resume" | "cancel" | "retry" = "resume"): Promise<PayOSPayment> {
  const order = ref.flow === "ORDER";
  const path = order && action === "retry" ? "/orders/" + encodeURIComponent(ref.reference) + "/retry-payos-payment" : basePath(ref) + (action === "cancel" ? "/cancel" : order ? "" : "/resume");
  const response = await authFetch(import.meta.env.VITE_API_BASE_URL + "/api" + path, {
    method: order && action === "resume" ? "GET" : "POST",
    headers: { Accept: "application/json" },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || "Không thể xác nhận trạng thái PayOS. Vui lòng thử lại.");
  return body.data ?? body;
}
export const paymentCheckout = (ref: PaymentReference, result: PayOSPayment): PayOSCheckoutState => {
  const common = { ...result, checkoutUrl: result.checkoutUrl ?? "", qrCode: result.qrCode ?? undefined, flow: ref.flow };
  if (ref.flow === "ORDER") return { ...common, flow: "ORDER", orderId: ref.reference, orderCode: result.orderCode ?? ref.reference };
  if (ref.flow === "SHOP_WALLET_TOP_UP") return { ...common, flow: "SHOP_WALLET_TOP_UP", shopId: ref.shopId!, topUpId: result.topUpId ?? result.id ?? ref.reference, currency: result.currency ?? "VND" };
  return { ...common, flow: "USER_WALLET_TOP_UP", topUpId: result.topUpId ?? result.id ?? ref.reference, currency: result.currency ?? "VND" };
};
export async function fetchWalletTopUps(shopId?: string): Promise<PayOSPayment[]> {
  const path = shopId ? "/shops/" + encodeURIComponent(shopId) + "/wallet" : "/wallet/me";
  const response = await authFetch(import.meta.env.VITE_API_BASE_URL + "/api" + path + "/top-ups", { headers: { Accept: "application/json" } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || "Không thể tải yêu cầu nạp tiền");
  const data = body.data ?? body;
  return Array.isArray(data) ? data : data.items ?? [];
}
