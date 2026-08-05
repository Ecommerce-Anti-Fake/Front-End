import type {
  VoucherCreatePayload,
  VoucherDiscountType,
  VoucherScopeType,
} from "../../../type/voucher";

export type { VoucherCreatePayload, VoucherDiscountType, VoucherScopeType } from "../../../type/voucher";

export type VoucherFormState = {
  code: string;
  name: string;
  discountType: VoucherDiscountType;
  percentage: string;
  fixedAmount: string;
  maxDiscountAmount: string;
  minOrderAmount: string;
  scopeType: VoucherScopeType;
  scopeIds: string;
  totalUsageLimit: string;
  userUsageLimit: string;
  startsAt: string;
  endsAt: string;
};

export type VoucherFormErrors = Partial<Record<keyof VoucherFormState, string>>;

export function createInitialVoucherForm(): VoucherFormState {
  return {
    code: "",
    name: "",
    discountType: "PERCENTAGE",
    percentage: "10",
    fixedAmount: "",
    maxDiscountAmount: "",
    minOrderAmount: "0",
    scopeType: "ALL",
    scopeIds: "",
    totalUsageLimit: "",
    userUsageLimit: "",
    startsAt: "",
    endsAt: "",
  };
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return Number(trimmed);
}

function listScopeIds(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function validateVoucherForm(form: VoucherFormState): VoucherFormErrors {
  const errors: VoucherFormErrors = {};
  const percentage = optionalNumber(form.percentage);
  const fixedAmount = optionalNumber(form.fixedAmount);
  const maxDiscountAmount = optionalNumber(form.maxDiscountAmount);
  const minOrderAmount = optionalNumber(form.minOrderAmount);
  const totalUsageLimit = optionalNumber(form.totalUsageLimit);
  const userUsageLimit = optionalNumber(form.userUsageLimit);

  if (!form.code.trim()) errors.code = "Nhập mã voucher.";
  if (!form.name.trim()) errors.name = "Nhập tên voucher.";

  if (form.discountType === "PERCENTAGE" &&
      (percentage === null || !Number.isFinite(percentage) || percentage <= 0 || percentage > 100)) {
    errors.percentage = "Phần trăm giảm phải lớn hơn 0 và tối đa 100%.";
  }

  if (form.discountType === "FIXED_AMOUNT" &&
      (fixedAmount === null || !Number.isFinite(fixedAmount) || fixedAmount <= 0)) {
    errors.fixedAmount = "Số tiền giảm phải lớn hơn 0.";
  }

  if (form.discountType !== "FIXED_AMOUNT" && maxDiscountAmount !== null &&
      (!Number.isFinite(maxDiscountAmount) || maxDiscountAmount <= 0)) {
    errors.maxDiscountAmount = "Giới hạn giảm phải lớn hơn 0.";
  }

  if (minOrderAmount === null || !Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
    errors.minOrderAmount = "Đơn tối thiểu không được âm.";
  }

  if (totalUsageLimit !== null &&
      (!Number.isInteger(totalUsageLimit) || totalUsageLimit < 1)) {
    errors.totalUsageLimit = "Giới hạn tổng phải là số nguyên từ 1.";
  }

  if (userUsageLimit !== null &&
      (!Number.isInteger(userUsageLimit) || userUsageLimit < 1)) {
    errors.userUsageLimit = "Giới hạn mỗi người phải là số nguyên từ 1.";
  }

  const startsAt = new Date(form.startsAt);
  const endsAt = new Date(form.endsAt);
  if (!form.startsAt || Number.isNaN(startsAt.getTime())) {
    errors.startsAt = "Chọn thời gian bắt đầu.";
  }
  if (!form.endsAt || Number.isNaN(endsAt.getTime())) {
    errors.endsAt = "Chọn thời gian kết thúc.";
  } else if (!errors.startsAt && endsAt <= startsAt) {
    errors.endsAt = "Thời gian kết thúc phải sau thời gian bắt đầu.";
  }

  if (form.scopeType !== "ALL" && listScopeIds(form.scopeIds).length === 0) {
    errors.scopeIds = "Nhập ít nhất một mã đối tượng áp dụng.";
  }

  return errors;
}

export function buildVoucherPayload(form: VoucherFormState): VoucherCreatePayload {
  return {
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    discountType: form.discountType,
    percentage: form.discountType === "PERCENTAGE" ? optionalNumber(form.percentage) : null,
    fixedAmount: form.discountType === "FIXED_AMOUNT" ? optionalNumber(form.fixedAmount) : null,
    maxDiscountAmount: form.discountType === "FIXED_AMOUNT" ? null : optionalNumber(form.maxDiscountAmount),
    minOrderAmount: optionalNumber(form.minOrderAmount) ?? 0,
    scopeType: form.scopeType,
    scopeIds: form.scopeType === "ALL" ? [] : listScopeIds(form.scopeIds),
    totalUsageLimit: optionalNumber(form.totalUsageLimit),
    userUsageLimit: optionalNumber(form.userUsageLimit),
    startsAt: new Date(form.startsAt).toISOString(),
    endsAt: new Date(form.endsAt).toISOString(),
  };
}

export function formatVoucherAmount(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}
