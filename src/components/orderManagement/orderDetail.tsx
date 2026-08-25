import {
  ArrowLeft,
  BadgeCheck,
  Clock3,
  FileText,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  Printer,
  Truck,
  XCircle,
} from "lucide-react";
import "../../css/components/dataSkeleton.css";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import "../../css/components/orderManagement/orderDetail.css";
import {
  fetchOrderDetail,
  updateOrderFulfillment,
  type FulfillmentStatus,
} from "../../services/order.api";
import { getMyShop, type MyShop } from "../../services/shop.api";
import type { OrderDetail, OrderItem, OrderShop } from "../../type/order";
import { formatVnd } from "../../ultil/currency";

const statusLabels: Record<string, string> = {
  pending: "Chờ xác nhận",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thanh toán thất bại",
  refunded: "Đã hoàn tiền",
};

const normalizeMyShop = (data: MyShop[] | null): MyShop | null => data?.[0] ?? null;

const normalizeStatus = (status?: string) => String(status ?? "").toLowerCase();

const getStatusLabel = (status?: string) => {
  const value = normalizeStatus(status);
  return statusLabels[value] ?? status ?? "Không rõ";
};

const getPaymentStatusLabel = (status?: string) => {
  const value = normalizeStatus(status);
  return paymentStatusLabels[value] ?? status ?? "Không rõ";
};

const formatDateTime = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const initials = (name?: string) =>
  String(name || "KH")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "KH";

function OrderDetailLoading() {
  return (
    <div className="seller-order-detail-loading">
      <div className="data-skeleton data-skeleton-detail" role="status" aria-label="Đang tải chi tiết đơn hàng"><div className="data-skeleton-detail-hero"><span /><div><span /><span /><span /></div></div><div className="data-skeleton-detail-grid">{Array.from({ length: 6 }, (_, i) => <span key={i} />)}</div></div>
    </div>
  );
}

export default function OrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [shopId, setShopId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<FulfillmentStatus | "">("");

  useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      if (!orderId) {
        setError("Không tìm thấy mã đơn hàng");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [shopData, orderData] = await Promise.all([
          getMyShop(),
          fetchOrderDetail(orderId),
        ]);

        if (cancelled) return;

        const shop = normalizeMyShop(shopData);
        setShopId(String(shop?.id ?? ""));
        setOrder(orderData);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải chi tiết đơn hàng",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const currentShop = useMemo<OrderShop | null>(() => {
    if (!order) return null;
    if (!shopId) return order.shops[0] ?? null;

    return (
      order.shops.find(
        (shop) =>
          String(shop.shopId ?? shop.id ?? "") === shopId ||
          String(shop.id ?? "") === shopId,
      ) ?? null
    );
  }, [order, shopId]);

  const items = currentShop?.items ?? [];
  const currentStatus = currentShop?.fulfillmentStatus ?? order?.status;
  const normalizedCurrentStatus = normalizeStatus(currentStatus);
  const canProcessOrder = normalizedCurrentStatus === "pending";
  const shopSubtotal = items.reduce(
    (sum, item) => sum + Number(item.totalPrice ?? 0),
    0,
  );
  const displaySubtotal = shopSubtotal || Number(order?.subtotal ?? 0);
  const displayTotal =
    shopSubtotal > 0
      ? shopSubtotal +
        Number(order?.shippingFee ?? 0) -
        Number(order?.discount ?? 0)
      : Number(order?.totalAmount ?? 0);

  const handleFulfillmentUpdate = async (fulfillmentStatus: FulfillmentStatus) => {
    if (!order || updatingStatus) return;

    setUpdatingStatus(fulfillmentStatus);

    try {
      await updateOrderFulfillment(order.id, fulfillmentStatus);
      setOrder((current) => {
        if (!current) return current;

        return {
          ...current,
          status: fulfillmentStatus.toLowerCase(),
          shops: current.shops.map((shop) =>
            String(shop.shopId ?? shop.id ?? "") === String(currentShop?.shopId ?? currentShop?.id ?? "")
              ? { ...shop, fulfillmentStatus }
              : shop,
          ),
        };
      });
      toast.success(
        fulfillmentStatus === "CANCELLED"
          ? "Đã từ chối đơn hàng"
          : "Đã xác nhận đơn hàng",
      );
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Không thể cập nhật trạng thái đơn hàng",
      );
    } finally {
      setUpdatingStatus("");
    }
  };

  const handlePrintShippingLabel = () => {
    if (!order) return;

    const printableItems = items
      .map(
        (item) => `
          <tr>
            <td>${item.productName}</td>
            <td>${item.variantName || ""}</td>
            <td>${item.quantity}</td>
            <td>${formatVnd(item.totalPrice)}</td>
          </tr>
        `,
      )
      .join("");

    const printWindow = window.open("", "_blank", "width=820,height=920");
    if (!printWindow) {
      toast.error("Trình duyệt đang chặn cửa sổ in");
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Van don ${order.orderCode || order.id}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 24px; font-family: Arial, sans-serif; color: #111; }
            .label { width: 760px; margin: 0 auto; border: 2px solid #111; padding: 18px; }
            .top { display: grid; grid-template-columns: 1fr 220px; gap: 16px; border-bottom: 2px solid #111; padding-bottom: 14px; }
            h1 { margin: 0 0 8px; font-size: 24px; letter-spacing: 1px; }
            .code { font-size: 18px; font-weight: 700; }
            .barcode { height: 88px; border: 1px solid #111; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 18px; background: repeating-linear-gradient(90deg,#111 0,#111 2px,#fff 2px,#fff 6px); color: transparent; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
            .box { border: 1px solid #111; padding: 12px; min-height: 112px; }
            .box h2 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; }
            .box p { margin: 4px 0; font-size: 14px; line-height: 1.35; }
            table { width: 100%; border-collapse: collapse; margin-top: 14px; }
            th, td { border: 1px solid #111; padding: 8px; font-size: 12px; text-align: left; }
            th { text-transform: uppercase; }
            .money { margin-top: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
            .money strong { font-size: 22px; }
            .note { margin-top: 14px; border: 1px dashed #111; padding: 10px; font-size: 12px; }
            @media print { body { padding: 0; } .label { width: 100%; border-width: 1px; } }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="top">
              <div>
                <h1>PHIEU GIAO HANG</h1>
                <div class="code">${order.orderCode || order.id}</div>
                <p>Don vi van chuyen: ${order.carrier || "Dang cap nhat"}</p>
              </div>
              <div class="barcode">${order.orderCode || order.id}</div>
            </div>

            <div class="grid">
              <div class="box">
                <h2>Nguoi nhan</h2>
                <p><strong>${order.receiverName || "Khach hang"}</strong></p>
                <p>${order.receiverPhone || ""}</p>
                <p>${order.shippingAddress || ""}</p>
              </div>
              <div class="box">
                <h2>Nguoi gui</h2>
                <p><strong>${currentShop?.shopName ?? currentShop?.name ?? "Shop"}</strong></p>
                <p>Ma shop: ${currentShop?.shopId ?? currentShop?.id ?? ""}</p>
                <p>Thanh toan: ${order.paymentMethod}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr><th>San pham</th><th>Phan loai</th><th>SL</th><th>Thanh tien</th></tr>
              </thead>
              <tbody>${printableItems}</tbody>
            </table>

            <div class="money">
              <div class="box">
                <h2>Thu ho COD</h2>
                <strong>${order.paymentMethod === "COD" ? formatVnd(displayTotal) : "0 VND"}</strong>
              </div>
              <div class="box">
                <h2>Tong thanh toan</h2>
                <strong>${formatVnd(displayTotal)}</strong>
              </div>
            </div>

            <div class="note">Vui long doi chieu ma don va tinh trang hang hoa khi ban giao cho don vi van chuyen.</div>
          </div>
          <script>window.print(); window.onafterprint = () => window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="seller-order-detail">
        <OrderDetailLoading />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="seller-order-detail">
        <Link className="seller-order-detail-back" to="/seller/orders">
          <ArrowLeft size={16} />
          Quay lại danh sách đơn hàng
        </Link>
        <div className="seller-order-detail-error">
          {error || "Không tìm thấy chi tiết đơn hàng"}
        </div>
      </div>
    );
  }

  return (
    <div className="seller-order-detail">
      <Link className="seller-order-detail-back" to="/seller/orders">
        <ArrowLeft size={16} />
        Quay lại danh sách đơn hàng
      </Link>

      <div className="seller-order-detail-breadcrumb">
        Đơn hàng <span>/</span> Chi tiết đơn hàng
      </div>

      <div className="seller-order-detail-header">
        <div>
          <h1>Đơn hàng {order.orderCode || order.id}</h1>
          {currentShop?.shopName || currentShop?.name ? (
            <p>{currentShop.shopName ?? currentShop.name}</p>
          ) : null}
        </div>

        <div className="seller-order-detail-actions">
          <button
            type="button"
            className="seller-order-action ghost"
            onClick={handlePrintShippingLabel}
          >
            <Printer size={16} />
            In vận đơn
          </button>
          {canProcessOrder && (
            <>
              <button
                type="button"
                className="seller-order-action ghost"
                disabled={Boolean(updatingStatus)}
                onClick={() => handleFulfillmentUpdate("PROCESSING")}
              >
                <FileText size={16} />
                {updatingStatus === "PROCESSING" ? "Đang xác nhận..." : "Xác nhận đơn"}
              </button>
              <button
                type="button"
                className="seller-order-action danger"
                disabled={Boolean(updatingStatus)}
                onClick={() => handleFulfillmentUpdate("CANCELLED")}
              >
                <XCircle size={16} />
                {updatingStatus === "CANCELLED" ? "Đang từ chối..." : "Từ chối đơn"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="seller-order-detail-grid">
        <main className="seller-order-detail-main">
          <section className="seller-order-status-card">
            <div className="seller-order-status-left">
              <div className="seller-order-status-icon">
                <PackageCheck size={22} />
              </div>
              <div>
                <span>Trạng thái hiện tại</span>
                <strong>{getStatusLabel(currentStatus)}</strong>
              </div>
            </div>

            <div className="seller-order-status-date">
              <span>Ngày đặt hàng</span>
              <strong>{formatDateTime(order.createdAt)}</strong>
            </div>
          </section>

          <section className="seller-order-info-grid">
            <article className="seller-order-card">
              <div className="seller-order-card-title">
                <h2>Khách hàng</h2>
              </div>

              <div className="seller-order-customer-block">
                <div className="seller-order-avatar">
                  {initials(order.receiverName)}
                </div>
                <div>
                  <strong>{order.receiverName || "Khách hàng"}</strong>
                  <p>{order.id}</p>
                </div>
              </div>

              <p className="seller-order-muted-line">
                <Mail size={14} />
                Chưa có email
              </p>
              <p className="seller-order-muted-line">
                <Phone size={14} />
                {order.receiverPhone || "--"}
              </p>
            </article>

            <article className="seller-order-card">
              <div className="seller-order-card-title">
                <h2>Giao hàng</h2>
                <Truck size={16} />
              </div>

              <p className="seller-order-label">Địa chỉ giao hàng</p>
              <p className="seller-order-address">
                <MapPin size={14} />
                {order.shippingAddress || "--"}
              </p>

              <div className="seller-order-delivery-note">
                <Clock3 size={16} />
                <span>
                  {order.carrier ||
                    order.shippingMethod ||
                    "Chưa có đơn vị vận chuyển"}
                </span>
              </div>
            </article>
          </section>

          <section className="seller-order-products-card">
            <h2>Danh sách sản phẩm ({items.length})</h2>

            <div className="seller-order-product-head">
              <span>Sản phẩm</span>
              <span>Đơn giá</span>
              <span>Số lượng</span>
              <span>Thành tiền</span>
            </div>

            {items.map((item: OrderItem) => (
              <div key={item.id} className="seller-order-product-row">
                <div className="seller-order-product-info">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt={item.productName} />
                  ) : (
                    <div className="seller-order-product-placeholder">
                      <PackageCheck size={22} />
                    </div>
                  )}
                  <div>
                    <strong>{item.productName}</strong>
                    <p>{item.variantName || "Không có phân loại"}</p>
                  </div>
                </div>
                <span>{formatVnd(item.unitPrice)}</span>
                <span>{item.quantity}</span>
                <strong>{formatVnd(item.totalPrice)}</strong>
              </div>
            ))}
          </section>
        </main>

        <aside className="seller-order-summary-card">
          <h2>Tổng cộng</h2>
          <div className="seller-order-summary-row">
            <span>Tạm tính ({items.length} sản phẩm)</span>
            <strong>{formatVnd(displaySubtotal)}</strong>
          </div>
          <div className="seller-order-summary-row">
            <span>Phí vận chuyển</span>
            <strong>{formatVnd(order.shippingFee)}</strong>
          </div>
          <div className="seller-order-summary-row discount">
            <span>Giảm giá</span>
            <strong>-{formatVnd(order.discount)}</strong>
          </div>
          <div className="seller-order-summary-row total">
            <span>Tổng thanh toán</span>
            <strong>{formatVnd(displayTotal)}</strong>
          </div>

          <div className="seller-order-payment-box">
            <div>
              <span>Phương thức thanh toán</span>
              <strong>{order.paymentMethod}</strong>
              <p>{getPaymentStatusLabel(order.paymentStatus)}</p>
            </div>
            <BadgeCheck size={20} />
          </div>
        </aside>
      </div>

      {order.note ? (
        <section className="seller-order-note-card">
          <label>Ghi chú đơn hàng</label>
          <p>{order.note}</p>
        </section>
      ) : null}
    </div>
  );
}
