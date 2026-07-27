import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Building2, CircleDollarSign, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import PayoutAccountModal from "../../../../components/wallet/payoutAccountModal";
import TransactionTable from "../../../../components/wallet/transactionTable";
import WalletBalance from "../../../../components/wallet/walletBalance";
import { useSellerShop } from "../../../../contexts/sellerShopContext";
import { completeEmailStepUpFromLink } from "../../../../services/withdrawal-step-up";
import {
  cancelShopWithdrawal,
  createShopWalletTopUp,
  fetchShopCodSettlements,
  fetchShopPayoutAccounts,
  fetchShopWallet,
  fetchShopWalletTransactions,
  fetchShopWithdrawals,
  type CodShopSettlement,
  type PayoutAccount,
  type Wallet,
  type WalletTransaction,
  type WalletWithdrawal,
} from "../../../../services/wallet.api";
import { formatVnd } from "../../../../ultil/currency";
import "../../../../css/pages/sellerWallet.css";

const payoutStatus: Record<string, string> = {
  PENDING: "Chờ admin xác minh",
  VERIFIED: "Đã xác minh",
  REJECTED: "Bị từ chối",
  DISABLED: "Đã vô hiệu hóa",
};

const withdrawalStatus: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt, chờ chuyển khoản",
  PROCESSING: "Đang xử lý",
  COMPLETED: "Đã chuyển khoản",
  REJECTED: "Đã từ chối",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
};

export default function SellerWallet() {
  const { shopId } = useSellerShop();
  const [searchParams] = useSearchParams();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [payoutAccounts, setPayoutAccounts] = useState<PayoutAccount[]>([]);
  const [withdrawals, setWithdrawals] = useState<WalletWithdrawal[]>([]);
  const [codSettlements, setCodSettlements] = useState<CodShopSettlement[]>([]);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [toppingUp, setToppingUp] = useState(false);
  const [modalMode, setModalMode] = useState<
    "add-account" | "withdraw" | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadedAt, setLoadedAt] = useState(0);

  const loadWallet = useCallback(async () => {
    const [walletData, transactionData, accountData, withdrawalData, codData] =
      await Promise.all([
        fetchShopWallet(shopId),
        fetchShopWalletTransactions(shopId, 1, 20),
        fetchShopPayoutAccounts(shopId),
        fetchShopWithdrawals(shopId),
        fetchShopCodSettlements(shopId),
      ]);
    setWallet(walletData);
    setTransactions(transactionData.data);
    setPayoutAccounts(accountData);
    setWithdrawals(withdrawalData);
    setCodSettlements(codData);
    if (Number(walletData.requiredTopUpAmount ?? 0) > 0) {
      setTopUpAmount(String(Math.ceil(Number(walletData.requiredTopUpAmount))));
    }
    setLoadedAt(Date.now());
  }, [shopId]);

  useEffect(() => {
    completeEmailStepUpFromLink()
      .then(
        (completed) =>
          completed &&
          toast.success(
            "Email đã được xác thực. Hãy quay lại tab rút tiền ban đầu.",
          ),
      )
      .catch((requestError) =>
        toast.error(
          requestError instanceof Error
            ? requestError.message
            : "Không thể xác thực liên kết email",
        ),
      );
  }, []);

  useEffect(() => {
    if (searchParams.get("topUp") === "returned") {
      toast.info("Đã quay lại từ PayOS. Hãy làm mới nếu webhook chưa kịp cập nhật số dư.");
    }
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        await loadWallet();
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Không thể tải ví shop";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [loadWallet]);

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      await loadWallet();
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Không thể tải ví shop";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const cancelWithdrawal = async (id: string) => {
    try {
      setLoading(true);
      await cancelShopWithdrawal(shopId, id);
      toast.success("Đã hủy yêu cầu và hoàn lại số dư khả dụng");
      await loadWallet();
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Không thể hủy yêu cầu rút tiền",
      );
    } finally {
      setLoading(false);
    }
  };

  const topUpShopWallet = async (event: React.FormEvent) => {
    event.preventDefault();
    const numericAmount = Number(topUpAmount);
    if (!Number.isSafeInteger(numericAmount) || numericAmount <= 0) {
      toast.error("Nhập số tiền nguyên VND lớn hơn 0");
      return;
    }
    try {
      setToppingUp(true);
      const topUp = await createShopWalletTopUp(
        shopId,
        String(numericAmount),
        crypto.randomUUID(),
      );
      window.location.assign(topUp.checkoutUrl);
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tạo link nạp tiền cho shop",
      );
    } finally {
      setToppingUp(false);
    }
  };

  if (loading && !wallet) {
    return (
      <main className="seller-wallet-page">
        <div className="seller-wallet-state" aria-busy="true">
          <span className="seller-wallet-state-spinner" aria-hidden="true" />
          <h1>Đang tải ví shop</h1>
          <p>Hệ thống đang đồng bộ số dư và lịch sử giao dịch.</p>
        </div>
      </main>
    );
  }

  if (error && !wallet) {
    return (
      <main className="seller-wallet-page">
        <div className="seller-wallet-state" role="alert">
          <h1>Không thể tải ví shop</h1>
          <p>{error}</p>
          <button type="button" onClick={() => void refresh()}>
            <RefreshCw size={16} />
            Thử lại
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="seller-wallet-page">
      {error ? (
        <div className="seller-wallet-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void refresh()} disabled={loading}>
            Thử lại
          </button>
        </div>
      ) : null}

      <div className="seller-wallet-top">
        <WalletBalance
          wallet={wallet}
          disabled={loading || Boolean(error) || Boolean(wallet?.hasCodDebt)}
          onWithdraw={() => setModalMode("withdraw")}
        />
      </div>

      <section
        className={`seller-cod-section ${wallet?.hasOverdueCodDebt ? "overdue" : ""}`}
        aria-labelledby="seller-cod-title"
      >
        <div className="seller-cod-summary">
          <div className="seller-cod-heading">
            {wallet?.hasCodDebt ? <AlertTriangle size={21} /> : <CircleDollarSign size={21} />}
            <div>
              <p>ĐỐI SOÁT COD</p>
              <h2 id="seller-cod-title">
                {wallet?.hasCodDebt ? "Shop cần thanh toán cho hệ thống" : "Không có nghĩa vụ COD"}
              </h2>
            </div>
            <button type="button" onClick={() => void refresh()} disabled={loading} aria-label="Làm mới ví shop">
              <RefreshCw size={16} /> Làm mới
            </button>
          </div>
          {wallet?.hasCodDebt ? (
            <>
              <strong>{formatVnd(wallet.codAmountDue, wallet.currency)}</strong>
              <span>
                {wallet.hasOverdueCodDebt
                  ? "Đã quá hạn: shop tạm thời không thể nhận đơn mới."
                  : `Hạn thanh toán: ${wallet.nextCodDebtDueAt ? new Date(wallet.nextCodDebtDueAt).toLocaleString("vi-VN") : "đang cập nhật"}.`}
              </span>
              <small>
                Ví đủ tiền sẽ tự động bị trừ. Khi nạp tiền, hệ thống thu nghĩa vụ cũ nhất trước
                và tự mở nhận đơn lại sau khi hết nợ.
              </small>
            </>
          ) : (
            <span>Phí hệ thống của đơn COD sẽ được tự trừ khi giao hàng thành công.</span>
          )}
        </div>
        <form className="seller-cod-topup" onSubmit={topUpShopWallet}>
          <label>
            Nạp tiền vào ví shop (VND)
            <input
              inputMode="numeric"
              value={topUpAmount}
              onChange={(event) => setTopUpAmount(event.target.value.replace(/\D/g, ""))}
              placeholder="Ví dụ: 100000"
            />
          </label>
          <button type="submit" disabled={toppingUp}>
            {toppingUp ? "Đang tạo link..." : "Nạp qua PayOS"}
          </button>
        </form>
        {codSettlements.length ? (
          <div className="seller-cod-list">
            {codSettlements.slice(0, 5).map((item) => (
              <div key={item.id}>
                <span>Đơn {item.orderId?.slice(0, 8) ?? "—"}</span>
                <strong>{formatVnd(item.obligationAmount, wallet?.currency)}</strong>
                <span className={`seller-cod-status ${item.status.toLowerCase()}`}>
                  {item.status === "OUTSTANDING" ? "Chưa thanh toán" : item.status === "SETTLED" ? "Đã thu" : item.status}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="seller-payout-section">
        <div className="seller-wallet-section-heading">
          <div>
            <p>TÀI KHOẢN NHẬN TIỀN</p>
            <h2>Ngân hàng đã liên kết</h2>
            <span>
              Chọn ngân hàng, nhập số tài khoản và kiểm tra tên chủ tài khoản trực tiếp.
            </span>
          </div>
          <button
            type="button"
            disabled={loading || Boolean(error)}
            onClick={() => setModalMode("add-account")}
          >
            <Plus size={16} /> Thêm tài khoản
          </button>
        </div>
        {payoutAccounts.length === 0 ? (
          <div className="seller-wallet-empty">
            Chưa có tài khoản nhận tiền.
          </div>
        ) : (
          <div className="seller-payout-grid">
            {payoutAccounts.map((item) => {
              const coolingDown =
                item.verificationStatus === "VERIFIED" &&
                new Date(item.availableAfter).getTime() > loadedAt;
              return (
                <article key={item.id} className="seller-payout-card">
                  <div className="seller-payout-icon">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <strong>
                      {item.bankName} ({item.bankCode})
                    </strong>
                    <span>{item.accountNumberMasked}</span>
                    <small>{item.accountHolder}</small>
                  </div>
                  <span
                    className={`seller-payout-status ${item.verificationStatus.toLowerCase()}`}
                  >
                    <ShieldCheck size={14} />{" "}
                    {coolingDown
                      ? "Chờ bảo mật 24 giờ"
                      : payoutStatus[item.verificationStatus] ??
                        item.verificationStatus}
                  </span>
                  {item.rejectionReason ? (
                    <p className="seller-payout-reason">
                      {item.rejectionReason}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="seller-payout-section">
        <div className="seller-wallet-section-heading">
          <div>
            <p>LỊCH SỬ RÚT TIỀN</p>
            <h2>Yêu cầu gần đây</h2>
          </div>
        </div>
        {withdrawals.length === 0 ? (
          <div className="seller-wallet-empty">Chưa có yêu cầu rút tiền.</div>
        ) : (
          <div className="seller-withdrawal-list">
            {withdrawals.map((item) => (
              <article key={item.id}>
                <div>
                  <strong>{formatVnd(item.amount)}</strong>
                  <span>
                    {item.bankName} · {item.accountNumberMasked}
                  </span>
                </div>
                <div>
                  <span
                    className={`seller-withdrawal-status ${item.status.toLowerCase()}`}
                  >
                    {withdrawalStatus[item.status] ?? item.status}
                  </span>
                  <small>
                    {new Date(item.createdAt).toLocaleString("vi-VN")}
                  </small>
                  {item.status === "PENDING" ? (
                    <button
                      className="seller-cancel-withdrawal"
                      type="button"
                      disabled={loading}
                      onClick={() => void cancelWithdrawal(item.id)}
                    >
                      Hủy yêu cầu
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <TransactionTable transactions={transactions} loading={loading} />

      <PayoutAccountModal
        open={Boolean(modalMode)}
        mode={modalMode ?? "withdraw"}
        shopId={shopId}
        payoutAccounts={payoutAccounts}
        onClose={() => setModalMode(null)}
        onSuccess={refresh}
      />
    </div>
  );
}
