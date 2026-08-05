import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  fetchAdminPayoutAccounts,
  fetchPlatformWallets,
  fetchWalletReconciliation,
  rejectPayoutAccount,
  revealPayoutAccount,
  verifyPayoutAccount,
  type PayoutAccount,
  type PlatformWalletSnapshot,
  type WalletReconciliationReport,
} from "../../../services/wallet.api";
import { formatVnd } from "../../../ultil/currency";
import "../../../css/pages/adminWallet.css";
import "../../../css/pages/sellerWallet.css";

type AccountAction = { id: string; type: "reveal" | "verify" | "reject" };

const summaryLabels: Record<string, string> = {
  totalTopUp: "Tổng nạp ví",
  totalPayment: "Tổng thanh toán",
  totalEscrowHeld: "Escrow đang giữ",
  totalReleasedToShops: "Đã trả shop",
  totalPlatformFee: "Phí nền tảng",
  totalRefund: "Tổng hoàn tiền",
  totalWithdrawal: "Tổng rút tiền",
  difference: "Chênh lệch sổ cái",
};

const getErrorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export default function AdminWalletPage() {
  const [wallets, setWallets] = useState<PlatformWalletSnapshot[]>([]);
  const [walletError, setWalletError] = useState("");
  const [reconciliation, setReconciliation] = useState<WalletReconciliationReport | null>(null);
  const [reconciliationError, setReconciliationError] = useState("");
  const [payoutAccounts, setPayoutAccounts] = useState<PayoutAccount[]>([]);
  const [payoutError, setPayoutError] = useState("");
  const [payoutStatus, setPayoutStatus] = useState("PENDING");
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [action, setAction] = useState<AccountAction | null>(null);
  const [actionValue, setActionValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [reconciliationLoading, setReconciliationLoading] = useState(true);
  const [payoutLoading, setPayoutLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setWalletError("");
    setReconciliationError("");
    setPayoutError("");
    setReconciliationLoading(true);
    setPayoutLoading(true);

    const [walletResult, reconciliationResult, payoutResult] = await Promise.allSettled([
      fetchPlatformWallets(),
      fetchWalletReconciliation(),
      fetchAdminPayoutAccounts(payoutStatus),
    ]);

    if (walletResult.status === "fulfilled") {
      setWallets(walletResult.value);
    } else {
      setWalletError(getErrorMessage(walletResult.reason, "Không thể tải số dư ví hệ thống"));
    }

    if (reconciliationResult.status === "fulfilled") {
      setReconciliation(reconciliationResult.value);
    } else {
      setReconciliationError(getErrorMessage(reconciliationResult.reason, "Không thể tải báo cáo đối soát ví"));
    }

    if (payoutResult.status === "fulfilled") {
      setPayoutAccounts(payoutResult.value);
    } else {
      setPayoutError(getErrorMessage(payoutResult.reason, "Không thể tải tài khoản nhận tiền"));
    }

    setReconciliationLoading(false);
    setPayoutLoading(false);
    setLoading(false);
  }, [payoutStatus]);

  useEffect(() => {
    // This effect synchronizes the dashboard with the selected payout status.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const submitAction = async () => {
    if (!action || !actionValue.trim()) return;
    try {
      setLoading(true);
      if (action.type === "reveal") {
        const account = await revealPayoutAccount(action.id, actionValue.trim());
        setRevealed((current) => ({ ...current, [action.id]: account.accountNumber }));
        toast.success("Đã ghi audit cho thao tác xem số tài khoản");
      } else if (action.type === "verify") {
        await verifyPayoutAccount(action.id, actionValue.trim());
        toast.success("Đã xác minh tên người thụ hưởng");
      } else {
        await rejectPayoutAccount(action.id, actionValue.trim());
        toast.success("Đã từ chối tài khoản nhận tiền");
      }
      setAction(null);
      setActionValue("");
      if (action.type !== "reveal") await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể xử lý tài khoản nhận tiền"));
    } finally {
      setLoading(false);
    }
  };

  const openAction = (id: string, type: AccountAction["type"]) => {
    setAction({ id, type });
    setActionValue("");
  };

  return <section className="admin-wallet-page">
    <div className="admin-wallet-heading">
      <div><p className="eyebrow">TÀI CHÍNH HỆ THỐNG</p><h1>Ví platform</h1><p>Theo dõi doanh thu, escrow và ledger của hệ thống.</p></div>
      <button type="button" onClick={load} disabled={loading}>Làm mới</button>
    </div>

    {walletError ? <div className="admin-wallet-error" role="alert"><strong>Không thể tải số dư ví.</strong><span>{walletError}</span></div> : null}
    <div className="admin-wallet-grid">
      {wallets.map(({ wallet }) => <article className="admin-platform-card" key={wallet.walletCode}><span>{wallet.platformCode || wallet.walletCode}</span><strong>{formatVnd(wallet.availableBalance, wallet.currency)}</strong><dl><div><dt>Chờ xử lý</dt><dd>{formatVnd(wallet.pendingBalance, wallet.currency)}</dd></div><div><dt>Đang khóa</dt><dd>{formatVnd(wallet.lockedBalance, wallet.currency)}</dd></div></dl></article>)}
      {!loading && !walletError && wallets.length === 0 ? <div className="admin-wallet-empty">Chưa có ví platform để hiển thị.</div> : null}
    </div>

    <article className="admin-reconcile-card">
      <div className="admin-wallet-section-heading"><div><p className="eyebrow">ĐỐI SOÁT SỔ CÁI</p><h2>Đối soát wallet</h2><p>Kiểm tra chênh lệch giữa giao dịch và các bút toán trong hệ thống.</p></div><button type="button" onClick={load} disabled={loading}>Tải lại</button></div>
      {reconciliationLoading ? <p className="admin-wallet-muted">Đang tải báo cáo đối soát...</p> : null}
      {!reconciliationLoading && reconciliationError ? <div className="admin-wallet-inline-error" role="alert"><strong>Báo cáo đối soát đang tạm thời không khả dụng.</strong><span>{reconciliationError}</span><button type="button" onClick={load} disabled={loading}>Thử lại</button></div> : null}
      {!reconciliationLoading && !reconciliationError && reconciliation?.summary ? <div className="admin-reconcile-grid">{Object.entries(reconciliation.summary).map(([key, value]) => <div key={key}><span>{summaryLabels[key] ?? key}</span><strong>{String(value)}{key === "difference" ? " VND" : ""}</strong></div>)}</div> : null}
      {!reconciliationLoading && !reconciliationError && !reconciliation?.summary ? <p className="admin-wallet-muted">Chưa có dữ liệu đối soát.</p> : null}
      <p className="admin-wallet-note">Duyệt yêu cầu rút tiền không làm tiền rời ví. Chỉ thao tác hoàn tất kèm mã chuyển khoản mới trừ số dư khóa.</p>
    </article>

    <article className="admin-reconcile-card admin-payout-review">
      <div className="admin-wallet-section-heading"><div><p className="eyebrow">ĐỐI CHIẾU NGÂN HÀNG</p><h2>Tài khoản nhận tiền</h2><p>Kiểm tra tên người thụ hưởng trong ứng dụng ngân hàng. Không chấp nhận tài khoản bên thứ ba.</p></div><label className="admin-payout-filter"><span>Trạng thái</span><select value={payoutStatus} onChange={(event) => setPayoutStatus(event.target.value)}><option value="PENDING">Chờ xác minh</option><option value="VERIFIED">Đã xác minh</option><option value="REJECTED">Đã từ chối</option><option value="">Tất cả</option></select></label></div>
      {payoutLoading ? <p className="admin-wallet-muted">Đang tải tài khoản nhận tiền...</p> : null}
      {!payoutLoading && payoutError ? <div className="admin-wallet-inline-error" role="alert"><strong>Không thể tải tài khoản nhận tiền.</strong><span>{payoutError}</span><button type="button" onClick={load} disabled={loading}>Thử lại</button></div> : null}
      {!payoutLoading && !payoutError && payoutAccounts.length === 0 ? <p className="admin-wallet-muted">Không có tài khoản ở trạng thái này.</p> : null}
      {!payoutLoading && !payoutError && payoutAccounts.length > 0 ? <div className="admin-payout-list">{payoutAccounts.map((item) => <div key={item.id} className="admin-payout-row"><div><strong>{item.bankName} ({item.bankCode})</strong><span>{revealed[item.id] ?? item.accountNumberMasked}</span><small>Khai báo: {item.accountHolder}</small></div><div><span className={`admin-payout-status ${item.verificationStatus.toLowerCase()}`}>{item.verificationStatus}</span>{item.rejectionReason ? <small>{item.rejectionReason}</small> : null}</div><div className="admin-table-actions"><button type="button" onClick={() => openAction(item.id, "reveal")}>Xem số TK</button>{item.verificationStatus === "PENDING" ? <><button type="button" onClick={() => openAction(item.id, "verify")}>Xác minh</button><button type="button" onClick={() => openAction(item.id, "reject")}>Từ chối</button></> : null}</div></div>)}</div> : null}
    </article>

    {action ? <div className="wallet-modal-backdrop" role="presentation"><section className="wallet-modal admin-wallet-action-modal" role="dialog" aria-modal="true" aria-labelledby="payout-action-title"><header><div><p>KIỂM SOÁT DỮ LIỆU NGÂN HÀNG</p><h2 id="payout-action-title">{action.type === "verify" ? "Tên người thụ hưởng từ ngân hàng" : action.type === "reject" ? "Lý do từ chối" : "Lý do xem đầy đủ số tài khoản"}</h2></div></header><div className="wallet-modal-body"><label>{action.type === "verify" ? "Tên hiển thị trong ứng dụng ngân hàng" : "Lý do"}<input value={actionValue} onChange={(event) => setActionValue(event.target.value)} autoFocus /></label><p className="wallet-security-note">{action.type === "verify" ? "Tên này phải trùng KYC chủ shop hoặc tên pháp nhân đã xác minh. shopName không phải bằng chứng." : "Thao tác được ghi vào audit log."}</p></div><footer><button type="button" className="secondary" onClick={() => setAction(null)} disabled={loading}>Hủy</button><button type="button" onClick={submitAction} disabled={loading || !actionValue.trim()}>{loading ? "Đang xử lý..." : "Xác nhận"}</button></footer></section></div> : null}
  </section>;
}
