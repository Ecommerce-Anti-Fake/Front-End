import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileClock, PauseCircle, Search, Ticket } from "lucide-react";
import { toast } from "sonner";
import {
  createAdminVoucher,
  fetchAdminVouchers,
  updateAdminVoucherStatus,
  type Voucher,
  type VoucherStatus,
} from "../../../services/admin.api";
import "../../../css/pages/adminStyles/vouchers.css";
import VoucherForm from "./voucherForm";
import VoucherList from "./voucherList";

type StatusFilter = "ALL" | VoucherStatus;

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "DRAFT", label: "Bản nháp" },
  { value: "PAUSED", label: "Tạm dừng" },
  { value: "EXPIRED", label: "Đã hết hạn" },
];

export default function AdminVouchersPage() {
  const [items, setItems] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [changingVoucherId, setChangingVoucherId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setItems(await fetchAdminVouchers());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải voucher");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((voucher) => {
      const matchesStatus = statusFilter === "ALL" || voucher.status === statusFilter;
      const matchesSearch = !query || `${voucher.code} ${voucher.name}`.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [items, search, statusFilter]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((voucher) => voucher.status === "ACTIVE").length,
    draft: items.filter((voucher) => voucher.status === "DRAFT").length,
    paused: items.filter((voucher) => voucher.status === "PAUSED").length,
  }), [items]);

  const create = async (payload: Parameters<typeof createAdminVoucher>[0]) => {
    try {
      await createAdminVoucher(payload);
      toast.success("Tạo voucher thành công");
      await load();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo voucher");
      return false;
    }
  };

  const changeStatus = async (voucher: Voucher) => {
    const nextStatus: VoucherStatus = voucher.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setChangingVoucherId(voucher.id);
    try {
      await updateAdminVoucherStatus(voucher.id, nextStatus);
      toast.success(nextStatus === "ACTIVE" ? "Đã kích hoạt voucher" : "Đã tạm dừng voucher");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật trạng thái voucher");
    } finally {
      setChangingVoucherId(null);
    }
  };

  return (
    <section className="admin-page voucher-page">
      <div className="admin-page-heading voucher-page-heading">
        <div>
          <span className="voucher-eyebrow"><Ticket size={15} /> KHUYẾN MÃI HỆ THỐNG</span>
          <h1>Quản lý voucher hệ thống</h1>
          <p>Tạo, kiểm soát và theo dõi các ưu đãi do platform tài trợ.</p>
        </div>
      </div>

      <div className="voucher-stat-grid" aria-label="Tổng quan voucher">
        <div className="voucher-stat-card"><span><Ticket size={17} /></span><small>Tổng voucher</small><strong>{stats.total}</strong><em>Toàn bộ mã đã tạo</em></div>
        <div className="voucher-stat-card"><span className="is-green"><CheckCircle2 size={17} /></span><small>Đang hoạt động</small><strong>{stats.active}</strong><em>Đang cho phép sử dụng</em></div>
        <div className="voucher-stat-card"><span className="is-blue"><FileClock size={17} /></span><small>Bản nháp</small><strong>{stats.draft}</strong><em>Chờ kiểm tra và kích hoạt</em></div>
        <div className="voucher-stat-card"><span className="is-gray"><PauseCircle size={17} /></span><small>Tạm dừng</small><strong>{stats.paused}</strong><em>Có thể kích hoạt lại</em></div>
      </div>

      <VoucherForm onSubmit={create} />

      <div className="voucher-list-toolbar" role="search" aria-label="Lọc danh sách voucher">
        <label className="voucher-search-field">
          <Search size={17} />
          <span className="sr-only">Tìm voucher</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo mã hoặc tên voucher" />
        </label>
        <label className="voucher-status-filter">
          <span className="sr-only">Lọc theo trạng thái</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            {statusFilters.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
          </select>
        </label>
      </div>

      <VoucherList
        items={filteredItems}
        isLoading={isLoading}
        changingVoucherId={changingVoucherId}
        onStatusChange={(voucher) => void changeStatus(voucher)}
      />
    </section>
  );
}
