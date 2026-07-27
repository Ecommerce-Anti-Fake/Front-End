import {
  AlertCircle,
  Clock,
  CreditCard,
  Headphones,
  ReceiptText,
  ShieldX,
  SmartphoneNfc,
  WifiOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "../../css/components/payment/paymentFailed.css";

const failureReasons = [
  {
    icon: CreditCard,
    title: "Thẻ bị từ chối",
    description: "Vui lòng kiểm tra lại số dư hoặc hạn mức tín dụng của thẻ.",
  },
  {
    icon: WifiOff,
    title: "Lỗi kết nối",
    description: "Đường truyền internet bị gián đoạn trong quá trình xác thực.",
  },
  {
    icon: Clock,
    title: "Hết thời gian",
    description: "Phiên thanh toán đã quá hạn. Vui lòng thử lại thao tác.",
  },
  {
    icon: ShieldX,
    title: "Xác thực OTP",
    description: "Mã xác thực không chính xác hoặc đã quá thời gian nhập.",
  },
];

export default function PaymentFailedPage() {
  const navigate = useNavigate();

  return (
    <main className="payment-failed-page">
      <section className="payment-failed-card">
        <div className="payment-failed-icon">
          <AlertCircle size={34} />
        </div>

        <h1>Rất tiếc! Thanh toán không thành công</h1>

        <p className="payment-failed-subtitle">
          Chúng tôi không thể xử lý giao dịch của bạn tại thời điểm này. Đừng
          lo lắng, tài khoản của bạn chưa bị trừ tiền.
        </p>

        <div className="payment-failed-reasons">
          {failureReasons.map(({ icon: Icon, title, description }) => (
            <article className="payment-failed-reason" key={title}>
              <Icon size={20} />
              <div>
                <strong>{title}</strong>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="payment-failed-actions">
          <button
            type="button"
            className="payment-retry-btn"
            onClick={() => navigate("/profile/orders")}
          >
            <ReceiptText size={18} />
            Xem đơn hàng
          </button>

          <button
            type="button"
            className="payment-help-btn"
            onClick={() => navigate("/chat")}
          >
            <Headphones size={18} />
            Liên hệ hỗ trợ
          </button>
        </div>

        <div className="payment-failed-note">
          <SmartphoneNfc size={18} />
          Bạn có thể chọn phương thức thanh toán khác ở bước thanh toán.
        </div>
      </section>
    </main>
  );
}
