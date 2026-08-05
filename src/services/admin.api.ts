import { authFetch } from "../ultil/auth";
import type { VoucherCreatePayload, VoucherDiscountType, VoucherScopeType } from "../type/voucher";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type Voucher = {
  id: string;
  code: string;
  name: string;
  ownerType: 'SYSTEM' | 'SHOP';
  discountType: VoucherDiscountType;
  percentage?: number | null;
  fixedAmount?: number | null;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;
  scopeType?: VoucherScopeType | string;
  scopeIds?: string[];
  totalUsageLimit?: number | null;
  userUsageLimit?: number | null;
  status: VoucherStatus;
  startsAt: string;
  endsAt: string;
  createdAt?: string;
};

export type VoucherStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED';

function optionalNumber(value: unknown) {
  return value === null || value === undefined ? null : Number(value);
}

function normaliseAdminVoucher(item: Voucher): Voucher {
  return {
    ...item,
    percentage: optionalNumber(item.percentage),
    fixedAmount: optionalNumber(item.fixedAmount),
    maxDiscountAmount: optionalNumber(item.maxDiscountAmount),
    minOrderAmount: Number(item.minOrderAmount ?? 0),
    scopeType: item.scopeType ?? 'ALL',
    scopeIds: item.scopeIds ?? [],
    totalUsageLimit: optionalNumber(item.totalUsageLimit),
    userUsageLimit: optionalNumber(item.userUsageLimit),
  };
}

export const fetchAdminVouchers = async (): Promise<Voucher[]> => {
  const response = await authFetch(`${BASE_URL}/api/admin/vouchers?page=1&pageSize=100`, { headers: { Accept: 'application/json' } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Khong the tai voucher');
  return (data?.items ?? data?.data?.items ?? []).map(normaliseAdminVoucher);
};

export const createAdminVoucher = async (payload: VoucherCreatePayload) => {
  const response = await authFetch(`${BASE_URL}/api/admin/vouchers`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Khong the tao voucher');
  return data?.data ?? data;
};

export const updateAdminVoucherStatus = async (voucherId: string, status: VoucherStatus) => {
  const response = await authFetch(`${BASE_URL}/api/admin/vouchers/${voucherId}/status`, {
    method: 'PATCH',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Khong the cap nhat trang thai voucher');
  return data?.data ?? data;
};

export type AdminUser = {
  id: string;
  email: string;
  phone?: string | null;
  displayName?: string | null;
  address?: string | null;
  defaultAddress?: string | null;
  role?: string;
  accountStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  avatar?: string | null;
  avatarUrl?: string | null;
  shopName?: string | null;
  shop?: {
    shopName?: string | null;
  } | null;
  shops?: Array<{
    shopName?: string | null;
  }>;
};

export type FetchAdminUsersParams = {
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export type AdminUsersResponse = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  totalUser: number;
  totalShop: number;
  activeUser: number;
  bannedUser: number;
  items: AdminUser[];
};

export type AdminUserDetail = {
  user: AdminUser & {
    emailVerified?: boolean;
    phoneVerified?: boolean;
    sellerVerified?: boolean;
    joinedAt?: string;
    statistics?: {
      orders?: number;
      posts?: number;
      reports?: number;
      positiveRate?: number;
    };
  };
  shop?: {
    id: string;
    shopName: string;
    logo?: unknown;
    banner?: unknown;
    shopStatus?: string;
    verificationStatus?: string;
    createdAt?: string;
    category?: string;
    address?: string;
    rating?: number;
    reviewCount?: number;
    productCount?: number;
    totalSold?: number;
    revenue?: number;
  } | null;
};

export type AdminShopRegistrationOwner = {
  id: string;
  displayName?: string | null;
  email?: string | null;
};

export type AdminShopRegistration = {
  id: string;
  shopName: string;
  owner?: AdminShopRegistrationOwner | null;
  businessType?: string | null;
  registrationType?: string | null;
  avatar?: string | null;
  createdAt?: string;
  shopStatus?: string;
};

export type AdminShopVerificationDetail = {
  shop: {
    id: string;
    shopName: string;
    registrationType?: string | null;
    businessType?: string | null;
    verifiedLegalName?: string | null;
    taxCode?: string | null;
    status?: string | null;
    shopStatus?: string | null;
    createdAt?: string;
    physicalAddress?: string | null;
    address?: string | null;
  };
  owner: {
    id: string;
    displayName?: string | null;
    email?: string | null;
    phone?: string | null;
    avatar?: string | null;
    avatarUrl?: string | null;
  };
  categories: Array<{
    id: string;
    name: string;
  }>;
  kyc?: {
    type?: string | null;
    frontImage?: string | null;
    backImage?: string | null;
    status?: string | null;
  } | null;
  documents: Array<{
    id: string;
    code?: string | null;
    name: string;
    required?: boolean;
    status?: string | null;
    files?: string[];
  }>;
};

export type AdminShopReviewStatus = "approved" | "rejected";

export type ReviewAdminShopDocumentsPayload = {
  reviewStatus: AdminShopReviewStatus;
  reviewNote: string;
  verifiedLegalName?: string;
};

export type FetchAdminShopRegistrationsParams = {
  shopStatus?: string;
  registrationType?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type AdminShopRegistrationsResponse = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: AdminShopRegistration[];
};

export type AdminOffer = {
  id: string;
  title: string;
  thumbnail?: string | null;
  price?: number;
  currency?: string;
  shop?: {
    id?: string;
    name?: string;
  } | null;
  category?: {
    id?: string;
    name?: string;
  } | null;
  verificationLevel?: string;
  offerStatus?: string;
  moderationStatus?: string;
  createdAt?: string;
};

export type AdminOfferModerationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "banned";

export type UpdateAdminOfferModerationPayload = {
  moderationStatus: AdminOfferModerationStatus;
  moderationReason?: string;
};

export type FetchAdminOffersParams = {
  offerStatus?: string;
  moderationStatus?: string;
  page?: number;
  pageSize?: number;
};

export type AdminOffersResponse = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: AdminOffer[];
};

export const fetchAdminUsers = async (
  params: FetchAdminUsersParams = {},
): Promise<AdminUsersResponse> => {
  const queryParams = new URLSearchParams();
  if (params.role) queryParams.set("role", params.role);
  if (params.status) queryParams.set("status", params.status);
  queryParams.set("page", String(params.page ?? 1));
  queryParams.set("pageSize", String(params.pageSize ?? 10));

  const query = queryParams.toString();
  const response = await authFetch(
    `${BASE_URL}/api/admin/users${query ? `?${query}` : ""}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Không thể lấy danh sách người dùng");
  }

  const payload = data?.data ?? data;
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];

  return {
    page: Number(payload?.page ?? params.page ?? 1),
    pageSize: Number(payload?.pageSize ?? params.pageSize ?? 10),
    totalItems: Number(payload?.totalItems ?? items.length),
    totalPages: Number(payload?.totalPages ?? 1),
    totalUser: Number(payload?.totalUser ?? payload?.totalItems ?? items.length),
    totalShop: Number(payload?.totalShop ?? 0),
    activeUser: Number(payload?.activeUser ?? 0),
    bannedUser: Number(payload?.bannedUser ?? 0),
    items,
  };
};

export const banAdminUser = async (id: string): Promise<AdminUser> => {
  const response = await authFetch(`${BASE_URL}/api/admin/users/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Khong the khoa nguoi dung");
  }

  return data?.data ?? data;
};

export const fetchAdminUserDetail = async (
  id: string,
): Promise<AdminUserDetail> => {
  const response = await authFetch(`${BASE_URL}/api/admin/users/${id}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Khong the lay chi tiet nguoi dung");
  }

  return data?.data ?? data;
};

export const fetchAdminShopRegistrations = async (
  params: FetchAdminShopRegistrationsParams = {},
): Promise<AdminShopRegistrationsResponse> => {
  const query = new URLSearchParams();
  if (params.shopStatus) query.set("shopStatus", params.shopStatus);
  if (params.registrationType) {
    query.set("registrationType", params.registrationType);
  }
  if (params.search) query.set("search", params.search);
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 10));

  const response = await authFetch(
    `${BASE_URL}/api/shops/admin/list-shop?${query.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Khong the lay danh sach shop");
  }

  const payload = data?.data ?? data;
  return {
    page: Number(payload?.page ?? params.page ?? 1),
    pageSize: Number(payload?.pageSize ?? params.pageSize ?? 10),
    totalItems: Number(payload?.totalItems ?? 0),
    totalPages: Number(payload?.totalPages ?? 1),
    items: Array.isArray(payload?.items) ? payload.items : [],
  };
};

export const fetchAdminShopVerificationDetail = async (
  shopId: string,
): Promise<AdminShopVerificationDetail> => {
  const response = await authFetch(
    `${BASE_URL}/api/shops/admin/${shopId}/verification-detail`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Khong the lay ho so phap ly cua shop");
  }

  return data?.data ?? data;
};

export const reviewAdminShopDocuments = async (
  shopId: string,
  payload: ReviewAdminShopDocumentsPayload,
) => {
  const response = await authFetch(
    `${BASE_URL}/api/shops/admin/${shopId}/documents/review`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Khong the duyet ho so shop");
  }

  return data?.data ?? data;
};

export const fetchAdminOffers = async (
  params: FetchAdminOffersParams = {},
): Promise<AdminOffersResponse> => {
  const query = new URLSearchParams();
  if (params.offerStatus) query.set("offerStatus", params.offerStatus);
  if (params.moderationStatus) {
    query.set("moderationStatus", params.moderationStatus);
  }
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 10));

  const response = await authFetch(
    `${BASE_URL}/api/offers/admin/list-offer?${query.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Khong the lay danh sach san pham");
  }

  const payload = data?.data ?? data;
  return {
    page: Number(payload?.page ?? params.page ?? 1),
    pageSize: Number(payload?.pageSize ?? params.pageSize ?? 10),
    totalItems: Number(payload?.totalItems ?? 0),
    totalPages: Number(payload?.totalPages ?? 1),
    items: Array.isArray(payload?.items) ? payload.items : [],
  };
};

export const updateAdminOfferModerationStatus = async (
  offerId: string,
  payload: UpdateAdminOfferModerationPayload,
): Promise<AdminOffer> => {
  const response = await authFetch(
    `${BASE_URL}/api/offers/admin/${offerId}/moderation-status`,
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
    throw new Error(data.message || "Khong the cap nhat trang thai san pham");
  }

  return data?.data ?? data;
};
