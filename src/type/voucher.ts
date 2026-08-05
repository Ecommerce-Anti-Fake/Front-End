export type VoucherDiscountType =
  | "PERCENTAGE"
  | "FIXED_AMOUNT"
  | "FREE_SHIPPING";

export type VoucherScopeType = "ALL" | "SHOP" | "OFFER" | "VARIANT";

export type VoucherCreatePayload = {
  code: string;
  name: string;
  discountType: VoucherDiscountType;
  percentage: number | null;
  fixedAmount: number | null;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  scopeType: VoucherScopeType;
  scopeIds: string[];
  totalUsageLimit: number | null;
  userUsageLimit: number | null;
  startsAt: string;
  endsAt: string;
};
