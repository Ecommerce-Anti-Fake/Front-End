import ResumePayment from "./resumePayment";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  MapPin,
  PackageOpen,
  Phone,
  ShieldCheck,
  Star,
  Store,
  Truck,
  User,
} from "lucide-react";
import { toast } from "sonner";
import "../../css/components/order/orderDetail.css";
import "../../css/pages/ordersPage.css";
import type { OrderDetail, OrderItem } from "../../type/order";
import { cancelOrder, fetchOrderDetail } from "../../services/order.api";
import { createOfferReview } from "../../services/review.api";
import ConfirmModal from "../common/confirmModal";
import "../../css/components/dataSkeleton.css";
import { useGlobalLoadingStore } from "../../store/globalLoadingStore";
import { formatVnd } from "../../ultil/currency";

const statusLabels: Record<string, string> = {
  pending: "Chờ xác nhận",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  delivered: "Đã giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  canceled: "Đã hủy",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thanh toán thất bại",
  cancelled: "Đã hủy thanh toán",
  refunded: "Đã hoàn tiền",
};

const paymentMethodLabels: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng",
  PAYOS: "Thanh toán PayOS",
  WALLET: "Ví AntiFake",
};

const progressSteps = [
  { value: "pending", label: "Đặt hàng" },
  { value: "processing", label: "Xử lý" },
  { value: "shipping", label: "Vận chuyển" },
  { value: "delivered", label: "Đã giao" },
];

const formatDate = (value?: string) => {
  if (!value) return "Đang cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const label = (map: Record<string, string>, value?: string) =>
  value ? map[value.toLowerCase()] ?? map[value.toUpperCase()] ?? value : "Đang cập nhật";

const getOfferId = (item: OrderItem) => item.offerId || item.productId;
const getSelectedOptionText = (item: OrderItem) =>
  item.selectedOptions?.map((option) => option.optionValueText).filter(Boolean).join(", ") ||
  item.variantName ||
  item.variant?.sku ||
  "";

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeReviewItemId, setActiveReviewItemId] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReviewId, setSubmittingReviewId] = useState("");
  const [reviewedItemIds, setReviewedItemIds] = useState<string[]>([]);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const showLoading = useGlobalLoadingStore((state) => state.showLoading);
  const hideLoading = useGlobalLoadingStore((state) => state.hideLoading);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!id) return;

    const loadOrder = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchOrderDetail(id);
        setOrder(data);
      } catch (error) {
        setOrder(null);
        setError(
          error instanceof Error ? error.message : "Không thể tải chi tiết đơn hàng",
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const orderStatus = order?.status.toLowerCase() ?? "";
  const normalizedStatus = orderStatus === "completed" ? "delivered" : orderStatus;
  const isCompleted = normalizedStatus === "delivered";
  const isPending = normalizedStatus === "pending";
  const currentStepIndex = progressSteps.findIndex(
    (step) => step.value === normalizedStatus,
  );

  const itemCount = useMemo(
    () =>
      order?.shops.reduce(
        (sum, shop) => sum + shop.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0,
      ) ?? 0,
    [order],
  );

  const openReviewBox = (itemId: string) => {
    setActiveReviewItemId((current) => (current === itemId ? "" : itemId));
    setReviewRating(5);
    setReviewComment("");
  };

  const handleSubmitReview = async (item: OrderItem) => {
    const offerId = getOfferId(item);

    if (!offerId) {
      toast.error("Không tìm thấy sản phẩm để đánh giá");
      return;
    }

    if (!reviewComment.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }

    try {
      setSubmittingReviewId(item.id);
      showLoading("Đang gửi đánh giá...");
      await createOfferReview(offerId, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewedItemIds((current) => [...current, item.id]);
      setActiveReviewItemId("");
      setReviewComment("");
      toast.success("Đánh giá sản phẩm thành công");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Đánh giá sản phẩm thất bại");
    } finally {
      setSubmittingReviewId("");
      hideLoading();
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    try {
      setCancellingOrder(true);
      showLoading("Đang hủy đơn hàng...");
      await cancelOrder(order.id);
      setOrder({ ...order, status: "cancelled" });
      setShowCancelConfirm(false);
      toast.success("Đã hủy đơn hàng");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Hủy đơn hàng thất bại");
    } finally {
      setCancellingOrder(false);
      hideLoading();
    }
  };

  if (loading) {
    return (
      <div className="order-detail-page">
        <div className="data-skeleton data-skeleton-detail" role="status" aria-label="Đang tải chi tiết đơn hàng"><div className="data-skeleton-detail-hero"><span /><div><span /><span /><span /></div></div><div className="data-skeleton-detail-grid">{Array.from({ length: 6 }, (_, i) => <span key={i} />)}</div></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-detail-page">
        <div className="profile-orders-state is-error" role="alert">
          <div className="profile-orders-state-icon">
            <AlertCircle size={30} />
          </div>
          <h2>Không thể tải chi tiết đơn hàng</h2>
          <p>{error}</p>
          <button type="button" onClick={() => navigate("/profile/orders")}>
            Quay lại đơn mua
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-detail-page">
        <div className="profile-orders-state" role="status">
          <div className="profile-orders-state-icon">
            <PackageOpen size={34} />
          </div>
          <h2>Không tìm thấy đơn hàng</h2>
          <p>Đơn hàng này không tồn tại hoặc đã được cập nhật ở nơi khác.</p>
          <button type="button" onClick={() => navigate("/profile/orders")}>
            Quay lại đơn mua
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-detail-page">
      <section className="od-section od-hero">
        <ResumePayment order={order} />
        <button className="od-back-btn" onClick={() => navigate("/profile/orders")}>
          <ArrowLeft size={20} />
          <span>Đơn mua</span>
        </button>

        <div className="od-hero-main">
          <div>
            <p className="od-kicker">Chi tiết đơn hàng</p>
            <h1>{order.orderCode || order.id}</h1>
            <span>Đặt lúc {formatDate(order.createdAt)}</span>
          </div>
          <div className={`od-status-pill ${normalizedStatus}`}>
            {label(statusLabels, order.status)}
          </div>
        </div>
      </section>

      {normalizedStatus !== "cancelled" && (
        <section className="od-section">
          <h2>Tiến độ đơn hàng</h2>
          <div className="od-progress">
            {progressSteps.map((step, index) => {
              const isActive = currentStepIndex >= index;
              return (
                <div className="od-step-wrap" key={step.value}>
                  {index > 0 && <div className={`od-line ${isActive ? "active" : ""}`} />}
                  <div className={`od-step ${isActive ? "active" : ""}`}>
                    <div className="od-step-icon">
                      {isActive ? <CheckCircle2 size={16} /> : <ShieldCheck size={16} />}
                    </div>
                    <span>{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="od-info-grid">
        <article className="od-section od-info-card">
          <h2>Người nhận</h2>
          <div className="od-info-item">
            <User size={18} />
            <span>{order.receiverName || "Đang cập nhật"}</span>
          </div>
          <div className="od-info-item">
            <Phone size={18} />
            <span>{order.receiverPhone || "Đang cập nhật"}</span>
          </div>
          <div className="od-info-item">
            <MapPin size={18} />
            <span>{order.shippingAddress || "Đang cập nhật"}</span>
          </div>
        </article>

        <article className="od-section od-info-card">
          <h2>Vận chuyển</h2>
          <div className="od-info-item">
            <Truck size={18} />
            <span>{order.carrier ?? "Đang cập nhật"}</span>
          </div>
          <div className="od-row compact">
            <span>Mã vận đơn</span>
            <b>{order.trackingCode ?? "Đang cập nhật"}</b>
          </div>
          <div className="od-row compact">
            <span>Dự kiến giao</span>
            <b>{order.estimatedDelivery ?? "Đang cập nhật"}</b>
          </div>
        </article>
      </section>

      {order.shops.map((shop) => (
        <section key={shop.id ?? shop.shopId} className="od-section od-shop-card">
          <div className="od-shop-title">
            <Store size={18} />
            <span>{shop.name ?? shop.shopName}</span>
            {shop.fulfillmentStatus && (
              <small>{label(statusLabels, shop.fulfillmentStatus)}</small>
            )}
          </div>

          {shop.items.map((item) => (
            <div key={item.id} className="od-item-block">
              <div className="od-item">
                <img src={item.thumbnailUrl} alt={item.productName} />
                <div className="od-item-info">
                  <h3>{item.productName}</h3>
                  {getSelectedOptionText(item) && (
                    <p>Phân loại: {getSelectedOptionText(item)}</p>
                  )}
                  <span>Số lượng: {item.quantity}</span>
                </div>
                <div className="od-item-side">
                  <span>{formatVnd(item.unitPrice)}</span>
                  <div className="od-item-price">{formatVnd(item.totalPrice)}</div>
                  {isCompleted && !reviewedItemIds.includes(item.id) && (
                    <button
                      type="button"
                      className="od-review-toggle"
                      onClick={() => openReviewBox(item.id)}
                    >
                      Đánh giá
                    </button>
                  )}
                  {reviewedItemIds.includes(item.id) && (
                    <span className="od-reviewed-label">Đã đánh giá</span>
                  )}
                </div>
              </div>

              {activeReviewItemId === item.id && (
                <div className="od-review-box">
                  <div className="od-review-stars" aria-label="Chọn số sao">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={star <= reviewRating ? "active" : ""}
                        onClick={() => setReviewRating(star)}
                        aria-label={`${star} sao`}
                      >
                        <Star
                          size={20}
                          fill={star <= reviewRating ? "currentColor" : "none"}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    placeholder="Nhập nội dung đánh giá sản phẩm"
                    rows={3}
                  />
                  <div className="od-review-actions">
                    <button
                      type="button"
                      className="od-btn"
                      onClick={() => setActiveReviewItemId("")}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      className="od-btn primary"
                      disabled={submittingReviewId === item.id}
                      onClick={() => handleSubmitReview(item)}
                    >
                      {submittingReviewId === item.id ? "Đang gửi..." : "Gửi đánh giá"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      ))}

      <section className="od-section od-payment-card">
        <div className="od-payment-title">
          <CreditCard size={20} />
          <h2>Thanh toán</h2>
        </div>
        <div className="od-row">
          <span>Tạm tính ({itemCount} sản phẩm)</span>
          <b>{formatVnd(order.subtotal)}</b>
        </div>
        <div className="od-row">
          <span>Giảm giá</span>
          <b>-{formatVnd(order.discount)}</b>
        </div>
        <div className="od-row">
          <span>Phí vận chuyển</span>
          <b>{formatVnd(order.shippingFee)}</b>
        </div>
        <div className="od-row od-total">
          <span>Tổng thanh toán</span>
          <b>{formatVnd(order.totalAmount)}</b>
        </div>
        <div className="od-row">
          <span>Phương thức</span>
          <b>{label(paymentMethodLabels, order.paymentMethod)}</b>
        </div>
        <div className="od-row">
          <span>Trạng thái thanh toán</span>
          <b>{label(paymentStatusLabels, order.paymentStatus)}</b>
        </div>
      </section>

      {order.histories.length > 0 && (
        <section className="od-section">
          <h2>Lịch sử đơn hàng</h2>
          {order.histories.map((history, index) => (
            <div key={`${history.status}-${index}`} className="od-history">
              <div className="od-dot" />
              <div>
                <b>{history.description || label(statusLabels, history.status)}</b>
                <p>{formatDate(history.createdAt)}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="od-actions">
        {isPending && (
          <button
            className="od-btn danger"
            disabled={cancellingOrder}
            onClick={() => setShowCancelConfirm(true)}
          >
            {cancellingOrder ? "Đang hủy..." : "Hủy đơn hàng"}
          </button>
        )}
        {isCompleted && <button className="od-btn primary">Mua lại</button>}
      </div>

      <ConfirmModal
        open={showCancelConfirm}
        title="Hủy đơn hàng"
        message="Bạn có chắc muốn hủy đơn hàng này không? Hành động này không thể hoàn tác."
        confirmText="Hủy đơn"
        cancelText="Không"
        danger
        loading={cancellingOrder}
        onConfirm={handleCancelOrder}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
  );
}
