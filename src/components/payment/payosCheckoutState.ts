export type PayOSCheckoutFlow =
  | "ORDER"
  | "USER_WALLET_TOP_UP"
  | "SHOP_WALLET_TOP_UP";

type PayOSCheckoutBase = {
  flow: PayOSCheckoutFlow;
  checkoutUrl: string;
  paymentLinkId: string;
  amount: number | string;
};

export type OrderPayOSCheckoutState = PayOSCheckoutBase & {
  flow: "ORDER";
  orderId: string;
  orderCode: string | number;
};

export type UserWalletPayOSCheckoutState = PayOSCheckoutBase & {
  flow: "USER_WALLET_TOP_UP";
  topUpId: string;
  currency: string;
};

export type ShopWalletPayOSCheckoutState = PayOSCheckoutBase & {
  flow: "SHOP_WALLET_TOP_UP";
  topUpId: string;
  shopId: string;
  currency: string;
};

export type PayOSCheckoutState =
  | OrderPayOSCheckoutState
  | UserWalletPayOSCheckoutState
  | ShopWalletPayOSCheckoutState;

export type PayOSCheckoutEvent = "SUCCESS" | "CANCEL" | "EXIT";

export type PayOSReturnState = {
  code: string | null;
  paymentLinkId: string | null;
  cancelled: boolean;
  status: string | null;
  orderCode: string | null;
};

const payOSReturnFailureStatuses = new Set([
  "CANCELLED",
  "CANCELED",
  "FAILED",
  "EXPIRED",
]);

export const parsePayOSReturnQuery = (
  search: string,
): PayOSReturnState | null => {
  const params = new URLSearchParams(search);
  const code = params.get("code")?.trim() || null;
  const paymentLinkId = params.get("id")?.trim() || null;
  const status = params.get("status")?.trim() || null;
  const orderCode = params.get("orderCode")?.trim() || null;
  const cancelled =
    params.get("cancel")?.trim().toLowerCase() === "true" ||
    payOSReturnFailureStatuses.has(status?.toUpperCase() ?? "") ||
    (code !== null && code !== "00");

  if (!code && !paymentLinkId && !status && !orderCode && !cancelled) {
    return null;
  }

  return {
    code,
    paymentLinkId,
    cancelled,
    status,
    orderCode,
  };
};

const PAYOS_CHECKOUT_HOSTS = new Set([
  "pay.payos.vn",
  "next.pay.payos.vn",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isReferenceCode = (value: unknown): value is string | number =>
  (typeof value === "number" && Number.isFinite(value)) ||
  isNonEmptyString(value);

const isPositiveAmount = (value: unknown): value is string | number => {
  if (typeof value !== "string" && typeof value !== "number") return false;
  if (typeof value === "string" && !value.trim()) return false;

  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
};

export const parsePayOSCheckoutMessage = (
  value: unknown,
): PayOSCheckoutEvent | null => {
  let message = value;

  if (typeof message === "string") {
    try {
      message = JSON.parse(message);
    } catch {
      return null;
    }
  }

  if (!isRecord(message) || !isRecord(message.data)) return null;

  if (message.type === "status" || message.type === "error") {
    return "EXIT";
  }

  if (message.type !== "payment_response") return null;

  if (message.data.status === "PAID") return "SUCCESS";
  if (message.data.status === "CANCELLED") return "CANCEL";

  return null;
};

const getPaymentLinkIdFromUrl = (value: string) => {
  try {
    const url = new URL(value);
    const match = url.pathname.match(/^\/web\/([^/]+)\/?$/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
};

export const isAllowedPayOSCheckoutUrl = (value: unknown): value is string => {
  if (!isNonEmptyString(value)) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      PAYOS_CHECKOUT_HOSTS.has(url.hostname) &&
      !url.port &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      getPaymentLinkIdFromUrl(value) !== null
    );
  } catch {
    return false;
  }
};

export const parsePayOSCheckoutState = (
  value: unknown,
): PayOSCheckoutState | null => {
  if (!isRecord(value)) return null;

  const { flow, checkoutUrl, paymentLinkId, amount } = value;
  if (
    !isAllowedPayOSCheckoutUrl(checkoutUrl) ||
    !isNonEmptyString(paymentLinkId) ||
    getPaymentLinkIdFromUrl(checkoutUrl) !== paymentLinkId ||
    !isPositiveAmount(amount)
  ) {
    return null;
  }

  if (
    flow === "ORDER" &&
    isNonEmptyString(value.orderId) &&
    isReferenceCode(value.orderCode)
  ) {
    return {
      flow,
      orderId: value.orderId,
      orderCode: value.orderCode,
      checkoutUrl,
      paymentLinkId,
      amount,
    };
  }

  if (
    flow === "USER_WALLET_TOP_UP" &&
    isNonEmptyString(value.topUpId) &&
    isNonEmptyString(value.currency)
  ) {
    return {
      flow,
      topUpId: value.topUpId,
      checkoutUrl,
      paymentLinkId,
      amount,
      currency: value.currency,
    };
  }

  if (
    flow === "SHOP_WALLET_TOP_UP" &&
    isNonEmptyString(value.topUpId) &&
    isNonEmptyString(value.shopId) &&
    isNonEmptyString(value.currency)
  ) {
    return {
      flow,
      topUpId: value.topUpId,
      shopId: value.shopId,
      checkoutUrl,
      paymentLinkId,
      amount,
      currency: value.currency,
    };
  }

  return null;
};

export const getPayOSCheckoutRoutes = (flow: PayOSCheckoutFlow) => {
  if (flow === "USER_WALLET_TOP_UP") {
    return {
      backPath: "/profile/wallet",
      successPath: "/profile/wallet?topUp=returned",
      cancelPath: "/profile/wallet?topUp=cancelled",
    };
  }

  if (flow === "SHOP_WALLET_TOP_UP") {
    return {
      backPath: "/seller/wallet",
      successPath: "/seller/wallet?topUp=returned",
      cancelPath: "/seller/wallet?topUp=cancelled",
    };
  }

  return {
    backPath: "/checkout",
    successPath: "/payment-success",
    cancelPath: "/payment-failed",
  };
};
