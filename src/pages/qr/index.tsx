import { Link, QrCode, ShieldCheck, Upload } from "lucide-react";
import { useState } from "react";
import "../../css/pages/qr.css";
import ContextualHelpLink from "../../components/help/contextualHelpLink";

export default function QRPage() {
  const [activeTab, setActiveTab] = useState<"qr" | "link" | "code">("qr");

  return (
    <div className="qr-page">
      <div className="qr-card">
        <div className="qr-header">
          <ShieldCheck size={52} />
          <h1>Xác thực sản phẩm</h1>

          <p>
            Kiểm tra nguồn gốc sản phẩm bằng QR Code,
            liên kết sản phẩm hoặc mã xác thực.
          </p>
          <ContextualHelpLink to="/help/qr/verify-product">Hướng dẫn kiểm tra sản phẩm</ContextualHelpLink>
        </div>

        <div className="qr-tabs">
          <button
            className={activeTab === "qr" ? "qr-tab active" : "qr-tab"}
            onClick={() => setActiveTab("qr")}
          >
            <QrCode size={18} />
            QR Code
          </button>

          <button
            className={activeTab === "link" ? "qr-tab active" : "qr-tab"}
            onClick={() => setActiveTab("link")}
          >
            <Link size={18} />
            Link sản phẩm
          </button>

          <button
            className={activeTab === "code" ? "qr-tab active" : "qr-tab"}
            onClick={() => setActiveTab("code")}
          >
            <ShieldCheck size={18} />
            Mã xác thực
          </button>
        </div>

        {activeTab === "qr" && (
          <div className="qr-content">
            <label className="qr-upload">
              <Upload size={42} />
              <span>Chọn ảnh chứa QR Code</span>

              <input type="file" accept="image/*" hidden />
            </label>
          </div>
        )}

        {activeTab === "link" && (
          <div className="qr-content">
            <input
              type="text"
              placeholder="Dán liên kết sản phẩm..."
              className="qr-input"
            />
          </div>
        )}

        {activeTab === "code" && (
          <div className="qr-content">
            <input
              type="text"
              placeholder="Nhập mã xác thực..."
              className="qr-input"
            />
          </div>
        )}

        <button className="qr-btn">
          Kiểm tra ngay
        </button>
      </div>
    </div>
  );
}
