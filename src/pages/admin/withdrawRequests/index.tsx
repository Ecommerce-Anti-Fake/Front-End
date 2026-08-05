import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import {
  approveWalletWithdrawal,
  completeWalletWithdrawal,
  fetchAdminWalletWithdrawals,
  rejectWalletWithdrawal,
  revealWalletWithdrawal,
  type WalletWithdrawal,
  type WalletWithdrawalTransferDetails,
} from "../../../services/wallet.api";
import { formatVnd } from "../../../ultil/currency";
import { buildVietQrPayload } from "../../../ultil/vietQr";
import "../../../css/pages/sellerWallet.css";
import "../../../css/pages/adminWithdrawals.css";

const statusLabels: Record<string, string> = {
  PENDING: "Có yêu cầu",
  PROCESSING: "Đang xử lý",
  COMPLETED: "Đã hoàn tất",
  REJECTED: "Đã từ chối",
  CANCELLED: "Đã hủy",
};
const transferActionLabel = "Chuyển tiền";

const formatDate = (value?: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
};

const statusClass = (status: string) => status.toLowerCase().replace(/[^a-z]/g, "-");

const actionCopy = {
  complete: {
    eyebrow: "XÁC NHẬN CHUYỂN KHOẢN",
    title: "Bạn đã chuyển tiền xong?",
    label: "Mã giao dịch ngân hàng",
    placeholder: "Ví dụ: FT260805001",
    note: "Nhập mã giao dịch hiển thị trong ứng dụng ngân hàng. Đây là bằng chứng để hệ thống hoàn tất và trừ tiền đang khóa.",
    confirm: "Xác nhận hoàn tất",
  },
  reject: {
    eyebrow: "TỪ CHỐI YÊU CẦU",
    title: "Nhập lý do từ chối",
    label: "Lý do từ chối",
    placeholder: "Nêu rõ lý do để seller có thể kiểm tra lại",
    note: "Từ chối sẽ hoàn lại số tiền đang khóa về số dư khả dụng.",
    confirm: "Từ chối yêu cầu",
  },
} as const;

type ActionType = keyof typeof actionCopy;
type TransferView = WalletWithdrawalTransferDetails & { qrPayload: string };

export default function AdminWithdrawRequestsPage() {
  const [items, setItems] = useState<WalletWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<{ id: string; type: ActionType } | null>(null);
  const [actionValue, setActionValue] = useState("");
  const [transfer, setTransfer] = useState<TransferView | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const loadWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await fetchAdminWalletWithdrawals(page, 20, statusFilter);
      setItems(result.items);
      setPagination(result.pagination);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Không thể tải yêu cầu rút tiền";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    // This effect synchronizes the table with the selected filter and page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadWithdrawals();
  }, [loadWithdrawals]);

  const summary = useMemo(() => {
    const pending = items.filter((item) => item.status === "PENDING");
    const processing = items.filter((item) => item.status === "PROCESSING");
    const pendingAmount = [...pending, ...processing].reduce((total, item) => total + Number(item.amount || 0), 0);
    return { pending: pending.length, processing: processing.length, pendingAmount, total: pagination.total };
  }, [items, pagination.total]);

  const approveRequest = async (id: string) => {
    try {
      setProcessingId(id);
      await approveWalletWithdrawal(id);
      toast.success("Đã duyệt yêu cầu. Yêu cầu chuyển sang bước chuyển tiền.");
      await loadWithdrawals();
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Không thể duyệt yêu cầu rút tiền");
    } finally {
      setProcessingId("");
    }
  };

  const openTransfer = async (item: WalletWithdrawal) => {
    try {
      setProcessingId(item.id);
      const detail = await revealWalletWithdrawal(item.id, "ADMIN_TRANSFER_QR");
      const qrPayload = buildVietQrPayload(detail);
      setTransfer({ ...detail, qrPayload });
      toast.success("Đã tạo QR chuyển khoản cho yêu cầu này");
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Không thể tạo QR chuyển khoản");
    } finally {
      setProcessingId("");
    }
  };

  const submitAction = async () => {
    if (!action || !actionValue.trim()) return;
    try {
      setProcessingId(action.id);
      if (action.type === "complete") {
        await completeWalletWithdrawal(action.id, actionValue.trim());
        toast.success("Đã xác nhận chuyển tiền và hoàn tất yêu cầu");
        setTransfer(null);
      } else {
        await rejectWalletWithdrawal(action.id, actionValue.trim());
        toast.success("Đã từ chối và hoàn lại số dư khả dụng");
      }
      setAction(null);
      setActionValue("");
      await loadWithdrawals();
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Xử lý yêu cầu thất bại");
    } finally {
      setProcessingId("");
    }
  };

  const openAction = (id: string, type: ActionType) => {
    setAction({ id, type });
    setActionValue("");
  };

  const renderActions = (item: WalletWithdrawal) => {
    const isProcessing = processingId === item.id;
    if (item.status === "PENDING") {
      return <div className="admin-withdrawal-actions">
        <button type="button" className="primary" disabled={isProcessing} onClick={() => void approveRequest(item.id)}>Duyệt</button>
        <button type="button" disabled={isProcessing} onClick={() => openAction(item.id, "reject")}>Từ chối</button>
      </div>;
    }
    if (item.status === "PROCESSING") {
      return <div className="admin-withdrawal-actions">
        <button type="button" className="primary" disabled={isProcessing} onClick={() => openTransfer(item)}>{transferActionLabel}</button>
      </div>;
    }
    return <span className="admin-withdrawal-terminal">{item.transferReference || formatDate(item.processedAt)}</span>;
  };

  return (
    <div className="admin-page admin-withdrawals-page">
      <div className="admin-page-heading admin-withdrawals-heading">
        <div>
          <h1>Quản lý yêu cầu rút tiền</h1>
          <p>Duyệt yêu cầu, sau đó chọn Chuyển tiền để mở QR đúng số tài khoản, nội dung và số tiền.</p>
        </div>
        <label className="admin-withdrawals-filter">
          <span>Lọc trạng thái</span>
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Có yêu cầu</option>
            <option value="PROCESSING">Đang xử lý</option>
            <option value="COMPLETED">Hoàn tất</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </label>
      </div>

      <div className="admin-withdrawal-summary" aria-label="Tổng quan yêu cầu rút tiền">
        <article className="admin-withdrawal-summary-card pending"><span>Có yêu cầu</span><strong>{summary.pending}</strong><small>chưa chuyển tiền</small></article>
        <article className="admin-withdrawal-summary-card"><span>Đang xử lý</span><strong>{summary.processing}</strong><small>chờ chuyển tiền</small></article>
        <article className="admin-withdrawal-summary-card amount"><span>Tiền cần xử lý</span><strong>{formatVnd(summary.pendingAmount)}</strong><small>chờ chuyển hoặc từ chối</small></article>
        <article className="admin-withdrawal-summary-card"><span>Tổng yêu cầu</span><strong>{summary.total}</strong><small>theo bộ lọc hiện tại</small></article>
      </div>

      <div className="admin-table-card admin-withdrawal-table-card">
        {loading ? <div className="admin-table-state">Đang tải yêu cầu...</div> : null}
        {!loading && error ? <div className="admin-table-state error">{error}</div> : null}
        {!loading && !error && items.length === 0 ? <div className="admin-table-state">Chưa có yêu cầu rút tiền.</div> : null}
        {!loading && !error && items.length > 0 ? <div className="admin-withdrawal-table-wrap"><table className="admin-table admin-withdrawal-table"><thead><tr><th>Mã yêu cầu</th><th>Số tiền</th><th>Ngân hàng</th><th>Tài khoản</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead><tbody>
          {items.map((item) => <tr key={item.id}>
            <td data-label="Mã yêu cầu"><span className="admin-withdrawal-id">{item.id}</span></td>
            <td data-label="Số tiền"><strong>{formatVnd(item.amount)}</strong></td>
            <td data-label="Ngân hàng">{item.bankName}</td>
            <td data-label="Tài khoản"><div className="admin-withdrawal-account"><strong>{item.accountHolder}</strong><span>{item.accountNumberMasked ?? "--"}</span><small>Số đầy đủ chỉ hiện trong QR chuyển tiền</small></div></td>
            <td data-label="Trạng thái"><div className="admin-withdrawal-status"><span className={`admin-withdrawal-status-badge ${statusClass(item.status)}`}>{statusLabels[item.status] ?? item.status}</span>{item.rejectionReason ? <small>{item.rejectionReason}</small> : null}</div></td>
            <td data-label="Ngày tạo">{formatDate(item.createdAt)}</td>
            <td data-label="Thao tác">{renderActions(item)}</td>
          </tr>)}
        </tbody></table></div> : null}
        {!loading && !error && pagination.totalPages > 1 ? <div className="admin-pagination"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trước</button><span>Trang {page}/{pagination.totalPages}</span><button disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Sau</button></div> : null}
      </div>

      {transfer && !action ? <div className="wallet-modal-backdrop" role="presentation"><section className="wallet-modal admin-transfer-modal" role="dialog" aria-modal="true" aria-labelledby="transfer-modal-title">
        <header><div><p>CHUYỂN KHOẢN THỦ CÔNG</p><h2 id="transfer-modal-title">Quét QR để chuyển tiền</h2><span className="admin-transfer-subtitle">Nội dung đã được tạo riêng cho yêu cầu này</span></div></header>
        <div className="wallet-modal-body"><div className="admin-transfer-layout"><div className="admin-transfer-qr"><QRCode value={transfer.qrPayload} size={220} bgColor="#ffffff" fgColor="#281f1f" /><span>Quét bằng ứng dụng ngân hàng</span></div><dl className="admin-transfer-details"><div><dt>Ngân hàng</dt><dd>{transfer.bankName}{transfer.bankCode ? ` (${transfer.bankCode})` : ""}</dd></div><div><dt>Người nhận</dt><dd>{transfer.accountHolder}</dd></div><div><dt>Số tài khoản</dt><dd>{transfer.accountNumber}</dd></div><div><dt>Số tiền</dt><dd className="amount">{formatVnd(transfer.amount, transfer.currency)}</dd></div><div><dt>Nội dung</dt><dd className="content">{transfer.transferContent}</dd></div></dl></div><p className="wallet-security-note">Kiểm tra đúng người nhận, số tài khoản, số tiền và nội dung trước khi chuyển. Hệ thống chưa tự xác minh giao dịch ngân hàng.</p></div>
        <footer><button type="button" className="secondary" onClick={() => setTransfer(null)}>Đóng</button><button type="button" onClick={() => { setAction({ id: transfer.id, type: "complete" }); setActionValue(""); }}>Đã chuyển tiền xong</button></footer>
      </section></div> : null}

      {action ? <div className="wallet-modal-backdrop" role="presentation"><section className="wallet-modal admin-withdrawal-modal" role="dialog" aria-modal="true" aria-labelledby="withdrawal-action-title">
        <header><div><p>{actionCopy[action.type].eyebrow}</p><h2 id="withdrawal-action-title">{actionCopy[action.type].title}</h2></div></header>
        <div className="wallet-modal-body">{action.type === "complete" && transfer ? <div className="admin-confirm-transfer"><span>Đang xác nhận cho</span><strong>{formatVnd(transfer.amount, transfer.currency)} · {transfer.accountNumber}</strong><small>{transfer.transferContent}</small></div> : null}<label>{actionCopy[action.type].label}<input value={actionValue} onChange={(event) => setActionValue(event.target.value)} placeholder={actionCopy[action.type].placeholder} autoFocus maxLength={action.type === "complete" ? 150 : 500} /></label><p className="wallet-security-note">{actionCopy[action.type].note}</p></div>
        <footer><button type="button" className="secondary" onClick={() => setAction(null)} disabled={Boolean(processingId)}>Hủy</button><button type="button" onClick={submitAction} disabled={!actionValue.trim() || Boolean(processingId)}>{processingId ? "Đang xử lý..." : actionCopy[action.type].confirm}</button></footer>
      </section></div> : null}
    </div>
  );
}
