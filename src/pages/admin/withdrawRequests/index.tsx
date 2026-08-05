import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  approveWalletWithdrawal,
  completeWalletWithdrawal,
  fetchAdminWalletWithdrawals,
  rejectWalletWithdrawal,
  revealWalletWithdrawal,
  type WalletWithdrawal,
} from "../../../services/wallet.api";
import { formatVnd } from "../../../ultil/currency";
import "../../../css/pages/sellerWallet.css";
import "../../../css/pages/adminWithdrawals.css";

const statusLabels: Record<string, string> = {
  PENDING: "Đang chờ duyệt",
  APPROVED: "Đã duyệt, chờ chuyển khoản",
  PROCESSING: "Đang xử lý",
  COMPLETED: "Đã hoàn tất",
  REJECTED: "Đã từ chối",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
};

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
    eyebrow: "HOÀN TẤT RÚT TIỀN",
    title: "Nhập mã giao dịch ngân hàng",
    label: "Mã tham chiếu chuyển khoản",
    placeholder: "Ví dụ: FT260805001",
    note: "Chỉ xác nhận sau khi đã chuyển khoản thực tế. Khi hoàn tất, tiền mới bị trừ khỏi số dư khóa.",
    confirm: "Xác nhận đã chuyển",
  },
  reveal: {
    eyebrow: "DỮ LIỆU NGÂN HÀNG NHẠY CẢM",
    title: "Nhập lý do xem số tài khoản",
    label: "Lý do truy cập",
    placeholder: "Ví dụ: Đối chiếu lệnh chuyển khoản",
    note: "Số tài khoản chỉ hiển thị trong phiên hiện tại và thao tác này được ghi audit.",
    confirm: "Xem số tài khoản",
  },
  reject: {
    eyebrow: "TỪ CHỐI RÚT TIỀN",
    title: "Nhập lý do từ chối",
    label: "Lý do từ chối",
    placeholder: "Nêu rõ lý do để seller có thể kiểm tra lại",
    note: "Từ chối sẽ hoàn lại số tiền đang khóa về số dư khả dụng.",
    confirm: "Từ chối yêu cầu",
  },
} as const;

type ActionType = keyof typeof actionCopy;

export default function AdminWithdrawRequestsPage() {
  const [items, setItems] = useState<WalletWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<{ id: string; type: ActionType } | null>(null);
  const [actionValue, setActionValue] = useState("");
  const [revealed, setRevealed] = useState<Record<string, string>>({});
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
    const approved = items.filter((item) => item.status === "APPROVED");
    const pendingAmount = [...pending, ...approved].reduce((total, item) => total + Number(item.amount || 0), 0);
    return {
      pending: pending.length,
      approved: approved.length,
      pendingAmount,
      total: pagination.total,
    };
  }, [items, pagination.total]);

  const approve = async (id: string) => {
    try {
      setProcessingId(id);
      await approveWalletWithdrawal(id);
      toast.success("Đã duyệt yêu cầu. Tiền vẫn được giữ ở số dư khóa.");
      await loadWithdrawals();
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : "Không thể duyệt yêu cầu");
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
        toast.success("Đã ghi mã chuyển khoản và hoàn tất yêu cầu");
      } else if (action.type === "reveal") {
        const detail = await revealWalletWithdrawal(action.id, actionValue.trim());
        setRevealed((current) => ({ ...current, [action.id]: detail.accountNumber }));
        toast.success("Đã ghi audit cho thao tác xem số tài khoản");
      } else {
        await rejectWalletWithdrawal(action.id, actionValue.trim());
        toast.success("Đã từ chối và hoàn lại số dư khả dụng");
      }
      setAction(null);
      setActionValue("");
      if (action.type !== "reveal") await loadWithdrawals();
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
        <button type="button" disabled={isProcessing} onClick={() => openAction(item.id, "reveal")}>Xem số TK</button>
        <button type="button" className="primary" disabled={isProcessing} onClick={() => approve(item.id)}>Duyệt</button>
        <button type="button" disabled={isProcessing} onClick={() => openAction(item.id, "reject")}>Từ chối</button>
      </div>;
    }
    if (item.status === "APPROVED") {
      return <div className="admin-withdrawal-actions">
        <button type="button" disabled={isProcessing} onClick={() => openAction(item.id, "reveal")}>Xem số TK</button>
        <button type="button" className="primary" disabled={isProcessing} onClick={() => openAction(item.id, "complete")}>Ghi nhận đã chuyển</button>
        <button type="button" disabled={isProcessing} onClick={() => openAction(item.id, "reject")}>Từ chối</button>
      </div>;
    }
    return <span className="admin-withdrawal-terminal">{item.transferReference || formatDate(item.processedAt)}</span>;
  };

  return (
    <div className="admin-page admin-withdrawals-page">
      <div className="admin-page-heading admin-withdrawals-heading">
        <div>
          <h1>Quản lý yêu cầu rút tiền</h1>
          <p>Duyệt, đối chiếu chuyển khoản và chỉ hoàn tất sau khi có mã giao dịch ngân hàng.</p>
        </div>
        <label className="admin-withdrawals-filter">
          <span>Lọc trạng thái</span>
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Đang chờ</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="COMPLETED">Hoàn tất</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </label>
      </div>

      <div className="admin-withdrawal-summary" aria-label="Tổng quan yêu cầu rút tiền">
        <article className="admin-withdrawal-summary-card pending"><span>Chờ duyệt</span><strong>{summary.pending}</strong><small>trong trang hiện tại</small></article>
        <article className="admin-withdrawal-summary-card"><span>Chờ chuyển khoản</span><strong>{summary.approved}</strong><small>đã được duyệt</small></article>
        <article className="admin-withdrawal-summary-card amount"><span>Tiền cần xử lý</span><strong>{formatVnd(summary.pendingAmount)}</strong><small>chờ duyệt hoặc chuyển</small></article>
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
            <td data-label="Tài khoản"><div className="admin-withdrawal-account"><strong>{item.accountHolder}</strong><span>{revealed[item.id] ?? item.accountNumberMasked ?? "--"}</span><small>Chỉ hiển thị đầy đủ khi cần đối chiếu</small></div></td>
            <td data-label="Trạng thái"><div className="admin-withdrawal-status"><span className={`admin-withdrawal-status-badge ${statusClass(item.status)}`}>{statusLabels[item.status] ?? item.status}</span>{item.rejectionReason ? <small>{item.rejectionReason}</small> : null}</div></td>
            <td data-label="Ngày tạo">{formatDate(item.createdAt)}</td>
            <td data-label="Thao tác">{renderActions(item)}</td>
          </tr>)}
        </tbody></table></div> : null}
        {!loading && !error && pagination.totalPages > 1 ? <div className="admin-pagination"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trước</button><span>Trang {page}/{pagination.totalPages}</span><button disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Sau</button></div> : null}
      </div>

      {action ? <div className="wallet-modal-backdrop" role="presentation"><section className="wallet-modal admin-withdrawal-modal" role="dialog" aria-modal="true" aria-labelledby="withdrawal-action-title">
        <header><div><p>{actionCopy[action.type].eyebrow}</p><h2 id="withdrawal-action-title">{actionCopy[action.type].title}</h2></div></header>
        <div className="wallet-modal-body"><label>{actionCopy[action.type].label}<input value={actionValue} onChange={(event) => setActionValue(event.target.value)} placeholder={actionCopy[action.type].placeholder} autoFocus maxLength={action.type === "complete" ? 150 : 500} /></label><p className="wallet-security-note">{actionCopy[action.type].note}</p></div>
        <footer><button type="button" className="secondary" onClick={() => setAction(null)} disabled={Boolean(processingId)}>Hủy</button><button type="button" onClick={submitAction} disabled={!actionValue.trim() || Boolean(processingId)}>{processingId ? "Đang xử lý..." : actionCopy[action.type].confirm}</button></footer>
      </section></div> : null}
    </div>
  );
}
