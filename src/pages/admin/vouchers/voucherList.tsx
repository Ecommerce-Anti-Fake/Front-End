import { CirclePause, CirclePlay, Clock3, PackageCheck, Percent, ShieldCheck, Ticket } from "lucide-react";
import type { Voucher, VoucherStatus } from "../../../services/admin.api";
import { formatVoucherAmount } from "./form";

type VoucherListProps = {
  items: Voucher[];
  isLoading: boolean;
  changingVoucherId: string | null;
  onStatusChange: (voucher: Voucher) => void;
};

const statusLabels: Record<VoucherStatus, string> = {
  DRAFT: "Bản nháp",
  ACTIVE: "Đang hoạt động",
  PAUSED: "Tạm dừng",
  EXPIRED: "Đã hết hạn",
};

const scopeLabels: Record<string, string> = {
  ALL: "Toàn sàn",
  SHOP: "Shop được chỉ định",
  OFFER: "Sản phẩm / offer",
  VARIANT: "Phân loại sản phẩm",
};

function discountLabel(voucher: Voucher) {
  if (voucher.discountType === "PERCENTAGE") {
    return `${voucher.percentage ?? 0}%${voucher.maxDiscountAmount ? ` · tối đa ${formatVoucherAmount(voucher.maxDiscountAmount)}` : ""}`;
  }
  if (voucher.discountType === "FIXED_AMOUNT") return formatVoucherAmount(voucher.fixedAmount);
  return voucher.maxDiscountAmount ? `Miễn ship · tối đa ${formatVoucherAmount(voucher.maxDiscountAmount)}` : "Miễn phí vận chuyển";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function usageLabel(voucher: Voucher) {
  const total = voucher.totalUsageLimit ? `${voucher.totalUsageLimit} lượt tổng` : "Không giới hạn tổng";
  const user = voucher.userUsageLimit ? `${voucher.userUsageLimit} lượt/người` : "Không giới hạn/người";
  return `${total} · ${user}`;
}

export default function VoucherList({ items, isLoading, changingVoucherId, onStatusChange }: VoucherListProps) {
  return (
    <section className="admin-table-card voucher-list-card" aria-labelledby="voucher-list-title">
      <div className="voucher-list-heading">
        <div>
          <span className="voucher-eyebrow"><Ticket size={15} /> QUẢN LÝ ƯU ĐÃI</span>
          <h2 id="voucher-list-title">Danh sách voucher</h2>
          <p>Kiểm tra trạng thái, điều kiện và thời gian hiệu lực của từng mã.</p>
        </div>
        <span className="voucher-count">{items.length} voucher</span>
      </div>

      {isLoading ? (
        <div className="voucher-list-loading" aria-busy="true" aria-label="Đang tải voucher">
          {[1, 2, 3].map((item) => <div className="voucher-skeleton" key={item} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="voucher-list-empty" role="status">
          <PackageCheck size={30} />
          <strong>Chưa có voucher phù hợp</strong>
          <p>Thử đổi bộ lọc hoặc tạo một voucher mới ở phía trên.</p>
        </div>
      ) : (
        <div className="voucher-list" role="list">
          {items.map((voucher) => {
            const nextStatus: VoucherStatus = voucher.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
            const isChanging = changingVoucherId === voucher.id;
            return (
              <article className="voucher-list-item" role="listitem" key={voucher.id}>
                <div className="voucher-list-main">
                  <div className="voucher-list-title-row">
                    <strong className="voucher-code">{voucher.code}</strong>
                    <span className={`voucher-status voucher-status--${voucher.status.toLowerCase()}`}>
                      {voucher.status === "ACTIVE" ? <ShieldCheck size={13} /> : <Clock3 size={13} />}
                      {statusLabels[voucher.status] ?? voucher.status}
                    </span>
                  </div>
                  <h3>{voucher.name}</h3>
                  <div className="voucher-list-meta">
                    <span><Percent size={14} /> {discountLabel(voucher)}</span>
                    <span><PackageCheck size={14} /> Đơn từ {formatVoucherAmount(voucher.minOrderAmount)}</span>
                    <span><Ticket size={14} /> {scopeLabels[voucher.scopeType ?? "ALL"] ?? voucher.scopeType}</span>
                  </div>
                </div>
                <div className="voucher-list-details">
                  <div><small>Hiệu lực</small><strong>{formatDate(voucher.startsAt)}</strong><span>đến {formatDate(voucher.endsAt)}</span></div>
                  <div><small>Sử dụng</small><strong>{usageLabel(voucher)}</strong></div>
                </div>
                {voucher.status !== "EXPIRED" && (
                  <button
                    type="button"
                    className="voucher-status-button"
                    onClick={() => onStatusChange(voucher)}
                    disabled={isChanging}
                    aria-label={`${nextStatus === "ACTIVE" ? "Kích hoạt" : "Tạm dừng"} ${voucher.code}`}
                  >
                    {nextStatus === "ACTIVE" ? <CirclePlay size={17} /> : <CirclePause size={17} />}
                    {isChanging ? "Đang cập nhật" : nextStatus === "ACTIVE" ? "Kích hoạt" : "Tạm dừng"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
