import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowDownToLine,
  Building2,
  Plus,
  RefreshCw,
  Wallet as WalletIcon,
} from "lucide-react";
import PayoutAccountModal from "../../components/wallet/payoutAccountModal";
import {
  cancelMyWithdrawal,
  createWalletTopUp,
  fetchMyPayoutAccounts,
  fetchMyWallet,
  fetchMyWalletTransactions,
  fetchMyWithdrawals,
  type PayoutAccount,
  type Wallet,
  type WalletTransaction,
  type WalletWithdrawal,
} from "../../services/wallet.api";
import { completeEmailStepUpFromLink } from "../../services/withdrawal-step-up";
import { formatVnd } from "../../ultil/currency";
import "../../css/pages/profile/walletPage.css";

const transactionLabels: Record<string, string> = {
  TOP_UP: "Nạp tiền",
  PAYMENT: "Thanh toán",
  REFUND: "Hoàn tiền",
  WITHDRAWAL: "Rút tiền",
  ESCROW_RELEASE: "Đối soát",
};

const withdrawalLabels: Record<string, string> = {
  PENDING: "Đang chờ",
  APPROVED: "Đã duyệt",
  PROCESSING: "Đang chuyển",
  COMPLETED: "Hoàn tất",
  REJECTED: "Từ chối",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
};

export default function WalletPage() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [payoutAccounts, setPayoutAccounts] = useState<PayoutAccount[]>([]);
  const [withdrawals, setWithdrawals] = useState<WalletWithdrawal[]>([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState<"add-account" | "withdraw" | null>(null);
  const [searchParams] = useSearchParams();

  const load = async () => {
    setLoading(true);
    try {
      const [walletData, transactionData, accountData, withdrawalData] = await Promise.all([
        fetchMyWallet(),
        fetchMyWalletTransactions(1, 20),
        fetchMyPayoutAccounts(),
        fetchMyWithdrawals(),
      ]);
      setWallet(walletData);
      setTransactions(transactionData.data);
      setPayoutAccounts(accountData);
      setWithdrawals(withdrawalData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải ví người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void completeEmailStepUpFromLink()
      .then((completed) => {
        if (completed) {
          toast.success("Email đã được xác thực. Hãy quay lại tab rút tiền ban đầu.");
        }
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Không thể xác thực liên kết email");
      })
      .finally(load);
  }, []);

  useEffect(() => {
    if (searchParams.get("topUp") === "returned") {
      toast.info("Đã quay lại từ PayOS. Số dư sẽ cập nhật sau khi webhook xác nhận.");
    } else if (searchParams.get("topUp") === "cancelled") {
      toast.info("Bạn đã hủy yêu cầu nạp tiền.");
    }
  }, [searchParams]);

  const submitTopUp = async (event: React.FormEvent) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isSafeInteger(numericAmount) || numericAmount <= 0) {
      toast.error("Nhập số tiền nguyên VND lớn hơn 0");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createWalletTopUp(String(numericAmount), crypto.randomUUID());
      navigate("/payment", {
        state: {
          checkout: {
            flow: "USER_WALLET_TOP_UP",
            topUpId: result.topUpId,
            paymentLinkId: result.paymentLinkId,
            checkoutUrl: result.checkoutUrl,
            amount: result.amount,
            currency: result.currency,
          },
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo link nạp tiền");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelWithdrawal = async (id: string) => {
    try {
      await cancelMyWithdrawal(id);
      toast.success("Đã hủy yêu cầu rút tiền");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể hủy yêu cầu");
    }
  };

  return (
    <section className="wallet-page">
      <div className="wallet-page-heading">
        <div>
          <p className="eyebrow">TÀI CHÍNH CÁ NHÂN</p>
          <h1>Ví AntiFake</h1>
          <p>Nạp tiền, rút tiền và quản lý tài khoản nhận tiền của bạn.</p>
        </div>
        <button className="wallet-refresh" onClick={load} disabled={loading}>
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      <div className="wallet-page-grid">
        <div className="wallet-user-card">
          <WalletIcon size={22} />
          <span>Số dư khả dụng</span>
          <strong>
            {loading ? "Đang tải..." : formatVnd(wallet?.availableBalance, wallet?.currency)}
          </strong>
          <div>
            <span>Chờ xử lý: {formatVnd(wallet?.pendingBalance, wallet?.currency)}</span>
            <span>Đang khóa: {formatVnd(wallet?.lockedBalance, wallet?.currency)}</span>
          </div>
          <button type="button" onClick={() => setModalMode("withdraw")}>
            Rút tiền
          </button>
        </div>

        <form className="wallet-topup-card" onSubmit={submitTopUp}>
          <div className="wallet-card-title">
            <ArrowDownToLine size={20} />
            <h2>Nạp tiền qua PayOS</h2>
          </div>
          <label>
            Số tiền (VND)
            <input
              inputMode="numeric"
              min="1"
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Ví dụ: 100000"
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? "Đang tạo link..." : "Nạp tiền"}
          </button>
          <small>Tiền chỉ được cộng sau webhook PayOS xác nhận thành công.</small>
        </form>
      </div>

      <section className="wallet-management-card">
        <div className="wallet-section-heading">
          <div>
            <Building2 size={20} />
            <div>
              <h2>Tài khoản nhận tiền</h2>
              <p>Tên chủ tài khoản được kiểm tra trực tiếp qua ngân hàng.</p>
            </div>
          </div>
          <button type="button" onClick={() => setModalMode("add-account")}>
            <Plus size={16} /> Thêm tài khoản
          </button>
        </div>
        {payoutAccounts.length ? (
          <div className="wallet-account-list">
            {payoutAccounts.map((item) => (
              <article key={item.id}>
                <div>
                  <strong>{item.bankName}</strong>
                  <span>{item.accountNumberMasked} · {item.accountHolder}</span>
                </div>
                <span className={`wallet-badge ${item.verificationStatus.toLowerCase()}`}>
                  {item.verificationStatus === "VERIFIED" ? "Đã xác minh" : item.verificationStatus}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <p className="wallet-empty">Chưa có tài khoản nhận tiền.</p>
        )}
      </section>

      <section className="wallet-management-card">
        <div className="wallet-section-heading">
          <div>
            <ArrowDownToLine size={20} />
            <div>
              <h2>Yêu cầu rút tiền</h2>
              <p>Yêu cầu đã duyệt vẫn cần admin chuyển khoản và xác nhận hoàn tất.</p>
            </div>
          </div>
        </div>
        {withdrawals.length ? (
          <div className="wallet-withdrawal-list">
            {withdrawals.map((item) => (
              <article key={item.id}>
                <div>
                  <strong>{formatVnd(item.amount, wallet?.currency)}</strong>
                  <span>{item.bankName} · {item.accountNumberMasked}</span>
                  <small>{new Date(item.createdAt).toLocaleString("vi-VN")}</small>
                </div>
                <div>
                  <span className={`wallet-badge ${item.status.toLowerCase()}`}>
                    {withdrawalLabels[item.status] ?? item.status}
                  </span>
                  {item.status === "PENDING" ? (
                    <button type="button" onClick={() => cancelWithdrawal(item.id)}>Hủy</button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="wallet-empty">Chưa có yêu cầu rút tiền.</p>
        )}
      </section>

      <div className="wallet-history-card">
        <h2>Lịch sử giao dịch</h2>
        {transactions.length === 0 && !loading ? (
          <p className="wallet-empty">Chưa có giao dịch ví.</p>
        ) : (
          <div className="wallet-history-list">
            {transactions.map((item) => (
              <div className="wallet-history-row" key={`${item.transactionCode}-${item.createdAt}`}>
                <div>
                  <strong>{transactionLabels[item.transactionType] ?? item.transactionType}</strong>
                  <small>{item.description ?? item.transactionCode}</small>
                </div>
                <span className={item.direction === "CREDIT" ? "credit" : "debit"}>
                  {item.direction === "CREDIT" ? "+" : "-"}
                  {formatVnd(item.amount, wallet?.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <PayoutAccountModal
        open={modalMode !== null}
        mode={modalMode ?? "withdraw"}
        payoutAccounts={payoutAccounts}
        onClose={() => setModalMode(null)}
        onSuccess={load}
      />
    </section>
  );
}
