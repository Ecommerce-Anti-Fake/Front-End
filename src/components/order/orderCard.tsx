import ResumePayment from "./resumePayment";
import { useNavigate } from "react-router-dom";
import "../../css/components/order/orderCard.css";
import type { Order } from "../../type/order";
import { formatVnd } from "../../ultil/currency";

type Props = {
  order: Order;
};

const statusLabels: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  processing: "Đang xử lý",
  shipping: "Đang giao hàng",
  shipped: "Đang giao hàng",
  completed: "Hoàn thành",
  delivered: "Đã giao hàng",
  cancelled: "Đã hủy",
  canceled: "Đã hủy",
};

const paymentMethodLabels: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng",
  PAYOS: "Thanh toán PayOS",
  VNPAY: "VNPay",
  MOMO: "MoMo",
  ZALOPAY: "ZaloPay",
  BANKTRANSFER: "Chuyển khoản ngân hàng",
};

const formatOrderCode = (orderCode: string) =>
  orderCode.startsWith("#") ? orderCode : `#${orderCode}`;

const getStatusLabel = (status: string) =>
  statusLabels[status.toLowerCase()] ?? status;

const getPaymentMethodLabel = (paymentMethod: string) =>
  paymentMethodLabels[paymentMethod.toUpperCase()] ?? paymentMethod;

export default function OrderCard({ order }: Props) {
  const navigate = useNavigate();
  const firstProduct = order.firstProduct ?? {
    name: "Sản phẩm",
    variant: "",
    quantity: 1,
    price: 0,
    image: "",
  };

  return (
    <div className="order-card-user">
      <div className="order-header-user">
        <span className="order-code">{formatOrderCode(order.orderCode)}</span>
        <span className="order-status">{getStatusLabel(order.status)}</span>
      </div>

      <div className="order-shop">{order.shopName}</div>

      <div className="order-product">
        <img
          src={firstProduct.image || "https://picsum.photos/seed/order/200/200"}
          alt={firstProduct.name}
          className="order-product-image"
        />

        <div className="order-product-info">
          <h3>{firstProduct.name}</h3>
          <p>{firstProduct.variant || "Không có phân loại"}</p>
          <span>x{firstProduct.quantity}</span>

          {order.otherProducts > 0 && (
            <div className="order-other-products">
              +{order.otherProducts} sản phẩm khác
            </div>
          )}
        </div>

        <div className="order-product-price">
          <strong>{formatVnd(firstProduct.price)}</strong>
          <small>Giá sản phẩm</small>
        </div>
      </div>

      <div className="order-footer">
        <ResumePayment order={order} />
        <div className="order-payment-info">
          <div>
            <span>Tổng thanh toán</span>
            <b>{formatVnd(order.totalAmount)}</b>
          </div>

          <div>
            <span>Hình thức thanh toán</span>
            <b>{getPaymentMethodLabel(order.paymentMethod)}</b>
          </div>
        </div>

        <button
          className="order-detail-btn"
          onClick={() => navigate(`/profile/orders/${order.id}`)}
        >
          Xem chi tiết
        </button>
      </div>
    </div>
  );
}
