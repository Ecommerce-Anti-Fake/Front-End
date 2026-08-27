import {
  Globe,
  Mail,
  Phone,
} from "lucide-react";
import { Link } from "react-router-dom";
import "../../css/components/layout/footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h2>AntiFake</h2>

          <p>
            Hệ thống bảo vệ người tiêu dùng và xác thực chính
            hãng hàng đầu Việt Nam. Chúng tôi cam kết mang lại
            trải nghiệm mua sắm an toàn và minh bạch.
          </p>

          <div className="footer-social">
            <a href="#">
              <Globe size={20} />
            </a>

            <a href="#">
              <Mail size={20} />
            </a>

            <a href="#">
              <Phone size={20} />
            </a>
          </div>
        </div>

        <div className="footer-links">
          <h3>Về AntiFake</h3>

          <a href="#">Về chúng tôi</a>
          <a href="#">Tuyển dụng</a>
          <a href="#">Blog</a>
        </div>

        <div className="footer-links">
          <h3>Hỗ trợ</h3>

          <Link to="/help/qr/verify-product">Hướng dẫn xác thực</Link>
          <a href="#">Liên hệ hỗ trợ</a>
          <a href="#">Quy định chung</a>
        </div>

        <div className="footer-newsletter">
          <h3>Đăng ký nhận tin</h3>

          <div className="footer-subscribe">
            <input
              type="email"
              placeholder="Email của bạn"
            />

            <button>Gửi</button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © 2024 AntiFake - Hệ thống bảo vệ người tiêu dùng và
        xác thực chính hãng.
      </div>
    </footer>
  );
}
