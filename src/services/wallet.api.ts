import { authFetch } from "../ultil/auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type Wallet = {
  id?: string;
  walletCode?: string;
  ownerType?: "USER" | "SHOP" | "PLATFORM" | string;
  currency: string;
  availableBalance: string;
  pendingBalance: string;
  lockedBalance: string;
  status: string;
  codAmountDue?: string;
  requiredTopUpAmount?: string;
  hasCodDebt?: boolean;
  hasOverdueCodDebt?: boolean;
  nextCodDebtDueAt?: string | null;
};

export type WalletTransaction = {
  transactionCode: string;
  transactionType: string;
  status: string;
  direction: "CREDIT" | "DEBIT" | string;
  balanceType: "AVAILABLE" | "PENDING" | "LOCKED" | string;
  amount: string;
  balanceBefore?: string;
  balanceAfter?: string;
  description: string | null;
  createdAt: string;
};

export type WalletTransactionsResponse = {
  data: WalletTransaction[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
};

export type WithdrawalStatus =
  | "PENDING" | "APPROVED" | "PROCESSING" | "COMPLETED" | "REJECTED" | "FAILED" | "CANCELLED" | string;

export type WalletWithdrawal = {
  id: string;
  walletId?: string;
  payoutAccountId: string | null;
  amount: string;
  fee: string;
  bankName: string;
  accountNumberMasked: string | null;
  accountHolder: string;
  status: WithdrawalStatus;
  transferReference?: string | null;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  processedAt: string | null;
};

export type PayoutAccountStatus = "PENDING" | "VERIFIED" | "REJECTED" | "DISABLED";
export type PayoutAccount = {
  id: string;
  ownerType: "USER" | "SHOP";
  bankBin: string;
  bankCode: string;
  bankName: string;
  accountNumberMasked: string;
  accountHolder: string;
  resolvedAccountHolder: string | null;
  verificationStatus: PayoutAccountStatus;
  verificationMethod: string | null;
  availableAfter: string;
  verifiedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
};

export type SupportedBank = {
  bin: string;
  code: string;
  name: string;
  shortName: string;
  logo: string | null;
  lookupSupported: boolean;
};

export type BankAccountVerification = {
  verificationId: string;
  bank: Pick<SupportedBank, "bin" | "code" | "name" | "shortName" | "logo">;
  accountNumberMasked: string;
  accountHolder: string;
  expiresAt: string;
};

export type WithdrawalAuthorizationOperation = "CREATE_PAYOUT_ACCOUNT" | "DELETE_PAYOUT_ACCOUNT" | "CREATE_WITHDRAWAL";
export type WithdrawalAuthorizationChannel = "PHONE" | "EMAIL";
export type WithdrawalChallengePayload = {
  shopId?: string;
  payoutAccountId?: string;
  bankAccountVerificationId?: string;
  amount?: string;
  operation: WithdrawalAuthorizationOperation;
  channel: WithdrawalAuthorizationChannel;
};

export type CreateWithdrawalPayload = {
  amount: string;
  payoutAccountId: string;
  idempotencyKey: string;
  authorizationToken: string;
};

export type WalletTopUp = {
  topUpId: string;
  paymentLinkId: string;
  checkoutUrl: string;
  amount: string;
  currency: string;
  status: string;
};

export type CodShopSettlement = {
  id: string;
  orderId?: string;
  orderShopGroupId?: string;
  platformFeeAmount?: string;
  affiliateAmount?: string;
  obligationAmount?: string;
  settledAmount?: string;
  status: "PENDING" | "OUTSTANDING" | "SETTLED" | "REVERSED" | string;
  dueAt: string | null;
  settledAt: string | null;
  createdAt?: string;
};

export type PlatformWalletSnapshot = {
  wallet: {
    walletCode: string;
    platformCode: string | null;
    currency: string;
    availableBalance: string;
    pendingBalance: string;
    lockedBalance: string;
    status: string;
  };
  ledger: WalletTransactionsResponse;
};

export type WalletListPagination = { page: number; limit: number; total: number; totalPages: number };

const unwrap = async <T>(response: Response, fallback: string): Promise<T> => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || fallback);
  return data?.data ?? data;
};

const normalizeTransactions = (payload: any, page: number, limit: number): WalletTransactionsResponse => {
  const items = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
  const pagination = payload?.pagination ?? payload;
  return {
    data: items,
    pagination: {
      page: Number(pagination?.page ?? page),
      pageSize: Number(pagination?.pageSize ?? pagination?.limit ?? limit),
      totalItems: Number(pagination?.totalItems ?? items.length),
      totalPages: Number(pagination?.totalPages ?? 1),
    },
  };
};

const jsonHeaders = { Accept: "application/json", "Content-Type": "application/json" };

export const fetchMyWallet = async (): Promise<Wallet> => unwrap(await authFetch(`${BASE_URL}/api/wallet/me`, {
  method: "GET", headers: { Accept: "application/json" },
}), "Không thể tải thông tin ví");

export const fetchMyWalletTransactions = async (page = 1, limit = 20): Promise<WalletTransactionsResponse> => {
  const response = await authFetch(`${BASE_URL}/api/wallet/me/transactions?page=${page}&limit=${limit}`, {
    method: "GET", headers: { Accept: "application/json" },
  });
  return normalizeTransactions(await unwrap(response, "Không thể tải lịch sử giao dịch"), page, limit);
};

export const createWalletTopUp = async (amount: string, idempotencyKey: string): Promise<WalletTopUp> =>
  unwrap(await authFetch(`${BASE_URL}/api/wallet/me/top-ups`, {
    method: "POST", headers: jsonHeaders, body: JSON.stringify({ amount, idempotencyKey }),
  }), "Không thể tạo yêu cầu nạp tiền");

export type WalletTopUpReconciliation = {
  success: boolean;
  reconciled: boolean;
  status: string;
  message: string;
};

export const reconcileMyWalletTopUp = async (
  paymentLinkId: string,
): Promise<WalletTopUpReconciliation> =>
  unwrap(await authFetch(
    `${BASE_URL}/api/wallet/me/top-ups/${encodeURIComponent(paymentLinkId)}/reconcile`,
    { method: "POST", headers: { Accept: "application/json" } },
  ), "Không thể đối soát giao dịch nạp ví");

export const fetchSupportedBanks = async (): Promise<SupportedBank[]> =>
  unwrap(await authFetch(`${BASE_URL}/api/wallet/banks`, {
    method: "GET", headers: { Accept: "application/json" },
  }), "Không thể tải danh sách ngân hàng");

export const verifyMyBankAccount = async (
  bankBin: string,
  accountNumber: string,
): Promise<BankAccountVerification> => unwrap(await authFetch(
  `${BASE_URL}/api/wallet/me/payout-account-verifications`,
  { method: "POST", headers: jsonHeaders, body: JSON.stringify({ bankBin, accountNumber }) },
), "Không thể kiểm tra tài khoản ngân hàng");

export const fetchMyPayoutAccounts = async (): Promise<PayoutAccount[]> =>
  unwrap(await authFetch(`${BASE_URL}/api/wallet/me/payout-accounts`, {
    method: "GET", headers: { Accept: "application/json" },
  }), "Không thể tải tài khoản nhận tiền");

export const createMyPayoutAccount = async (
  verificationId: string,
  authorizationToken: string,
): Promise<PayoutAccount> => unwrap(await authFetch(`${BASE_URL}/api/wallet/me/payout-accounts`, {
  method: "POST",
  headers: jsonHeaders,
  body: JSON.stringify({ verificationId, authorizationToken }),
}), "Không thể thêm tài khoản nhận tiền");

export const createMyWithdrawal = async (payload: CreateWithdrawalPayload): Promise<WalletWithdrawal> =>
  unwrap(await authFetch(`${BASE_URL}/api/wallet/me/withdrawals`, {
    method: "POST", headers: jsonHeaders, body: JSON.stringify(payload),
  }), "Không thể tạo yêu cầu rút tiền");

export const fetchMyWithdrawals = async (): Promise<WalletWithdrawal[]> => {
  const payload: any = await unwrap(await authFetch(`${BASE_URL}/api/wallet/me/withdrawals`, {
    method: "GET", headers: { Accept: "application/json" },
  }), "Không thể tải danh sách rút tiền");
  return Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
};

export const cancelMyWithdrawal = async (id: string) => unwrap(await authFetch(
  `${BASE_URL}/api/wallet/me/withdrawals/${id}/cancel`,
  { method: "POST", headers: { Accept: "application/json" } },
), "Không thể hủy yêu cầu rút tiền");

export const fetchShopWallet = async (shopId: string): Promise<Wallet> => unwrap(await authFetch(
  `${BASE_URL}/api/shops/${shopId}/wallet`, { method: "GET", headers: { Accept: "application/json" } },
), "Không thể tải ví shop");

export const createShopWalletTopUp = async (
  shopId: string,
  amount: string,
  idempotencyKey: string,
): Promise<WalletTopUp> => unwrap(await authFetch(`${BASE_URL}/api/shops/${shopId}/wallet/top-ups`, {
  method: "POST", headers: jsonHeaders, body: JSON.stringify({ amount, idempotencyKey }),
}), "Không thể tạo yêu cầu nạp tiền cho shop");

export const fetchShopCodSettlements = async (shopId: string): Promise<CodShopSettlement[]> => {
  const payload: any = await unwrap(await authFetch(
    `${BASE_URL}/api/shops/${shopId}/wallet/cod-settlements`,
    { method: "GET", headers: { Accept: "application/json" } },
  ), "Không thể tải nghĩa vụ COD");
  return Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
};

export const fetchShopWalletTransactions = async (shopId: string, page = 1, limit = 20): Promise<WalletTransactionsResponse> => {
  const response = await authFetch(`${BASE_URL}/api/shops/${shopId}/wallet/transactions?page=${page}&limit=${limit}`, {
    method: "GET", headers: { Accept: "application/json" },
  });
  return normalizeTransactions(await unwrap(response, "Không thể tải lịch sử giao dịch shop"), page, limit);
};

export const createShopWithdrawal = async (shopId: string, payload: CreateWithdrawalPayload): Promise<WalletWithdrawal> =>
  unwrap(await authFetch(`${BASE_URL}/api/shops/${shopId}/wallet/withdrawals`, {
    method: "POST", headers: jsonHeaders, body: JSON.stringify(payload),
  }), "Không thể tạo yêu cầu rút tiền");

export const fetchShopWithdrawals = async (shopId: string): Promise<WalletWithdrawal[]> => {
  const payload: any = await unwrap(await authFetch(`${BASE_URL}/api/shops/${shopId}/wallet/withdrawals`, {
    method: "GET", headers: { Accept: "application/json" },
  }), "Không thể tải danh sách rút tiền");
  return Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [];
};

export const cancelShopWithdrawal = async (shopId: string, id: string) => unwrap(await authFetch(
  `${BASE_URL}/api/shops/${shopId}/wallet/withdrawals/${id}/cancel`,
  { method: "POST", headers: { Accept: "application/json" } },
), "Không thể hủy yêu cầu rút tiền");

export const fetchShopPayoutAccounts = async (shopId: string): Promise<PayoutAccount[]> =>
  unwrap(await authFetch(`${BASE_URL}/api/shops/${shopId}/wallet/payout-accounts`, {
    method: "GET", headers: { Accept: "application/json" },
  }), "Không thể tải tài khoản nhận tiền");

export const createShopPayoutAccount = async (
  shopId: string, payload: { verificationId: string; authorizationToken: string },
): Promise<PayoutAccount> => unwrap(await authFetch(`${BASE_URL}/api/shops/${shopId}/wallet/payout-accounts`, {
  method: "POST", headers: jsonHeaders, body: JSON.stringify(payload),
}), "Không thể thêm tài khoản nhận tiền");

export const verifyShopBankAccount = async (
  shopId: string,
  bankBin: string,
  accountNumber: string,
): Promise<BankAccountVerification> => unwrap(await authFetch(
  `${BASE_URL}/api/shops/${shopId}/wallet/payout-account-verifications`,
  { method: "POST", headers: jsonHeaders, body: JSON.stringify({ bankBin, accountNumber }) },
), "Không thể kiểm tra tài khoản ngân hàng");

export const disableShopPayoutAccount = async (shopId: string, payoutAccountId: string, authorizationToken: string) =>
  unwrap(await authFetch(`${BASE_URL}/api/shops/${shopId}/wallet/payout-accounts/${payoutAccountId}`, {
    method: "DELETE", headers: jsonHeaders, body: JSON.stringify({ authorizationToken }),
  }), "Không thể vô hiệu hóa tài khoản nhận tiền");

export const createWithdrawalAuthorizationChallenge = async (payload: WithdrawalChallengePayload): Promise<{
  challengeId: string; channel: WithdrawalAuthorizationChannel; expiresAt: string; verificationProvider: string;
}> => unwrap(await authFetch(`${BASE_URL}/api/wallet/withdrawal-authorizations/challenges`, {
  method: "POST", headers: jsonHeaders, body: JSON.stringify(payload),
}), "Không thể tạo yêu cầu xác thực");

export const verifyWithdrawalAuthorizationChallenge = async (
  challengeId: string, firebaseIdToken: string,
): Promise<{ authorizationToken: string; expiresAt: string }> => unwrap(await authFetch(
  `${BASE_URL}/api/wallet/withdrawal-authorizations/challenges/${challengeId}/verify`, {
    method: "POST", headers: jsonHeaders, body: JSON.stringify({ firebaseIdToken }),
  },
), "Không thể xác thực thao tác");

export const fetchAdminWalletWithdrawals = async (page = 1, limit = 20, status = ""): Promise<{
  items: WalletWithdrawal[]; pagination: WalletListPagination;
}> => {
  const query = new URLSearchParams({ page: String(page), limit: String(limit), ...(status ? { status } : {}) });
  const payload: any = await unwrap(await authFetch(`${BASE_URL}/api/admin/wallet-withdrawals?${query}`, {
    method: "GET", headers: { Accept: "application/json" },
  }), "Không thể tải yêu cầu rút tiền");
  return {
    items: Array.isArray(payload?.items) ? payload.items : Array.isArray(payload) ? payload : [],
    pagination: payload?.pagination ?? { page, limit, total: 0, totalPages: 0 },
  };
};

export const approveWalletWithdrawal = async (id: string) => unwrap(await authFetch(
  `${BASE_URL}/api/admin/wallet-withdrawals/${id}/approve`, { method: "POST", headers: { Accept: "application/json" } },
), "Không thể duyệt yêu cầu rút tiền");

export const completeWalletWithdrawal = async (id: string, transferReference: string) => unwrap(await authFetch(
  `${BASE_URL}/api/admin/wallet-withdrawals/${id}/complete`, {
    method: "POST", headers: jsonHeaders, body: JSON.stringify({ transferReference }),
  },
), "Không thể hoàn tất yêu cầu rút tiền");

export const rejectWalletWithdrawal = async (id: string, reason: string) => unwrap(await authFetch(
  `${BASE_URL}/api/admin/wallet-withdrawals/${id}/reject`, {
    method: "POST", headers: jsonHeaders, body: JSON.stringify({ reason }),
  },
), "Không thể từ chối yêu cầu rút tiền");

export const revealWalletWithdrawal = async (id: string, reason: string): Promise<{
  id: string; bankName: string; accountHolder: string; accountNumber: string;
}> => unwrap(await authFetch(`${BASE_URL}/api/admin/wallet-withdrawals/${id}/reveal`, {
  method: "POST", headers: jsonHeaders, body: JSON.stringify({ reason }),
}), "Không thể xem số tài khoản của yêu cầu rút tiền");

export const fetchAdminPayoutAccounts = async (status = "PENDING"): Promise<PayoutAccount[]> => {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return unwrap(await authFetch(`${BASE_URL}/api/admin/wallet/payout-accounts${query}`, {
    method: "GET", headers: { Accept: "application/json" },
  }), "Không thể tải tài khoản nhận tiền");
};

export const verifyPayoutAccount = async (id: string, resolvedAccountHolder: string): Promise<PayoutAccount> =>
  unwrap(await authFetch(`${BASE_URL}/api/admin/wallet/payout-accounts/${id}/verify`, {
    method: "POST", headers: jsonHeaders, body: JSON.stringify({ resolvedAccountHolder }),
  }), "Không thể xác minh tài khoản nhận tiền");

export const rejectPayoutAccount = async (id: string, reason: string): Promise<PayoutAccount> =>
  unwrap(await authFetch(`${BASE_URL}/api/admin/wallet/payout-accounts/${id}/reject`, {
    method: "POST", headers: jsonHeaders, body: JSON.stringify({ reason }),
  }), "Không thể từ chối tài khoản nhận tiền");

export const revealPayoutAccount = async (id: string, reason: string): Promise<PayoutAccount & { accountNumber: string }> =>
  unwrap(await authFetch(`${BASE_URL}/api/admin/wallet/payout-accounts/${id}/reveal`, {
    method: "POST", headers: jsonHeaders, body: JSON.stringify({ reason }),
  }), "Không thể xem số tài khoản");

export const fetchPlatformWallets = async (): Promise<PlatformWalletSnapshot[]> => {
  const payload: any = await unwrap(await authFetch(`${BASE_URL}/api/admin/wallets/platform`, {
    method: "GET", headers: { Accept: "application/json" },
  }), "Không thể tải ví hệ thống");
  return Array.isArray(payload) ? payload : payload?.items ?? [];
};

export const fetchWalletReconciliation = async (params: Record<string, string> = {}) => {
  const query = new URLSearchParams(params).toString();
  return unwrap(await authFetch(`${BASE_URL}/api/admin/wallets/reconciliation${query ? `?${query}` : ""}`, {
    method: "GET", headers: { Accept: "application/json" },
  }), "Không thể tải báo cáo đối soát ví");
};
