import { CheckCircle, Clock, CreditCard, ReceiptText } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../css/components/payment/paymentSuccess.css";

type CheckoutSuccessState = {
  checkout?: {
    orderId?: string;
    orderCode?: string | number;
  };
  paymentMethod?: string;
  paymentStatus?: string;
};

const paymentMethodLabel: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng",
  PAYOS: "Thanh toán PayOS",
};

const paymentStatusLabel: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  COD_PENDING: "Chờ thanh toán khi nhận hàng",
};

const normalizeMethod = (method?: string) => method?.toUpperCase() ?? "PAYOS";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as CheckoutSuccessState;
  const paymentMethod = normalizeMethod(state.paymentMethod);
  const isCod = paymentMethod === "COD";
  const transactionCode =
    state.checkout?.orderCode ?? state.checkout?.orderId ?? "Đang cập nhật";
  const status = state.paymentStatus ?? (isCod ? "COD_PENDING" : "PAID");

  if (!state.checkout?.orderId && !state.checkout?.orderCode) {
    return (
      <main className="payment-success-page">
        <section className="payment-success-card">
          <div className="payment-success-icon">
            <ReceiptText size={42} />
          </div>
          <h1>Không tìm thấy kết quả thanh toán</h1>
          <p className="payment-success-subtitle">
            Vui lòng mở lại kết quả từ một phiên thanh toán hợp lệ.
          </p>
          <div className="payment-success-actions">
            <button
              type="button"
              className="payment-success-primary"
              onClick={() => navigate("/profile/orders")}
            >
              Xem đơn hàng
            </button>
            <button
              type="button"
              className="payment-success-secondary"
              onClick={() => navigate("/")}
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="payment-success-page">
      <section className="payment-success-card">
        <div className="payment-success-icon">
          <CheckCircle size={42} />
        </div>

        <h1>{isCod ? "Đặt hàng thành công!" : "Thanh toán thành công!"}</h1>

        <p className="payment-success-subtitle">
          Đơn hàng của bạn đã được ghi nhận. Thông tin đơn hàng sẽ được cập nhật
          trong tài khoản của bạn.
        </p>

        <div className="payment-success-info">
          <article>
            <ReceiptText size={22} />
            <div>
              <span>Mã giao dịch</span>
              <strong>{transactionCode}</strong>
            </div>
          </article>

          <article>
            <CreditCard size={22} />
            <div>
              <span>Phương thức</span>
              <strong>{paymentMethodLabel[paymentMethod] ?? paymentMethod}</strong>
            </div>
          </article>

          <article>
            <Clock size={22} />
            <div>
              <span>Trạng thái</span>
              <strong>{paymentStatusLabel[status] ?? status}</strong>
            </div>
          </article>
        </div>

        <div className="payment-success-actions">
          <button
            type="button"
            className="payment-success-primary"
            onClick={() => navigate("/profile/orders")}
          >
            Xem đơn hàng
          </button>

          <button
            type="button"
            className="payment-success-secondary"
            onClick={() => navigate("/")}
          >
            Tiếp tục mua sắm
          </button>
        </div>

        <p className="payment-success-note">
          Biên nhận thanh toán và thông tin đơn hàng sẽ được cập nhật trong tài
          khoản của bạn.
        </p>
      </section>
    </main>
  );
}
