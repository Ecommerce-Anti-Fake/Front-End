import { Link, QrCode, ShieldCheck, Upload } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import ContextualHelpLink from "../../components/help/contextualHelpLink";
import { verifyProduct, type VerificationResult } from "../../services/verification.api";
import "../../css/pages/qr.css";

type VerificationTab = "qr" | "link" | "code";

const UNSUPPORTED_IMAGE_MESSAGE =
  "Hiện chưa thể đọc ảnh QR trực tiếp trên trình duyệt này. Vui lòng dán liên kết hoặc nhập mã xác thực.";

export default function QRPage() {
  const [activeTab, setActiveTab] = useState<VerificationTab>("qr");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);
    setError(null);

    if (activeTab === "qr") {
      setError(UNSUPPORTED_IMAGE_MESSAGE);
      return;
    }

    const value = input.trim();
    if (!value) {
      setError("Vui lòng nhập mã hoặc liên kết xác thực.");
      return;
    }

    setLoading(true);
    try {
      setResult(await verifyProduct(value));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể kiểm tra sản phẩm lúc này",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelection = () => {
    setResult(null);
    setError(UNSUPPORTED_IMAGE_MESSAGE);
  };

  return (
    <div className="qr-page">
      <div className="qr-card">
        <div className="qr-header">
          <ShieldCheck size={52} />
          <h1>Xác thực sản phẩm</h1>

          <p>
            Kiểm tra nguồn gốc sản phẩm bằng QR Code, liên kết sản phẩm hoặc mã
            xác thực.
          </p>
          <ContextualHelpLink to="/help/qr/verify-product">
            Hướng dẫn kiểm tra sản phẩm
          </ContextualHelpLink>
        </div>

        <div className="qr-tabs" role="tablist" aria-label="Phương thức xác thực">
          <button
            type="button"
            className={activeTab === "qr" ? "qr-tab active" : "qr-tab"}
            data-testid="verification-tab-qr"
            onClick={() => setActiveTab("qr")}
          >
            <QrCode size={18} />
            QR Code
          </button>

          <button
            type="button"
            className={activeTab === "link" ? "qr-tab active" : "qr-tab"}
            data-testid="verification-tab-link"
            onClick={() => setActiveTab("link")}
          >
            <Link size={18} />
            Link sản phẩm
          </button>

          <button
            type="button"
            className={activeTab === "code" ? "qr-tab active" : "qr-tab"}
            data-testid="verification-tab-code"
            onClick={() => setActiveTab("code")}
          >
            <ShieldCheck size={18} />
            Mã xác thực
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === "qr" && (
            <div className="qr-content">
              <label className="qr-upload">
                <Upload size={42} />
                <span>Chọn ảnh chứa QR Code</span>

                <input
                  type="file"
                  accept="image/*"
                  hidden
                  data-testid="verification-file-input"
                  onChange={handleFileSelection}
                />
              </label>
            </div>
          )}

          {(activeTab === "link" || activeTab === "code") && (
            <div className="qr-content">
              <label className="qr-input-label" htmlFor="verification-code-input">
                {activeTab === "link" ? "Liên kết sản phẩm" : "Mã xác thực"}
              </label>
              <input
                id="verification-code-input"
                data-testid="verification-code-input"
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={
                  activeTab === "link"
                    ? "Dán liên kết sản phẩm..."
                    : "Nhập mã xác thực..."
                }
                className="qr-input"
                autoComplete="off"
              />
            </div>
          )}

          <button
            type="submit"
            className="qr-btn"
            data-testid="verification-submit"
            disabled={loading}
          >
            {loading ? "Đang kiểm tra..." : "Kiểm tra ngay"}
          </button>
        </form>

        {error && (
          <p className="qr-feedback qr-error" role="alert" data-testid="verification-error">
            {error}
          </p>
        )}

        {result && <VerificationResultPanel result={result} />}
      </div>
    </div>
  );
}

function VerificationResultPanel({ result }: { result: VerificationResult }) {
  return (
    <section
      className={`qr-feedback qr-result qr-result-${result.status.toLowerCase()}`}
      data-testid="verification-result"
      data-status={result.status}
      aria-live="polite"
    >
      <h2>{getStatusTitle(result.status)}</h2>
      {result.status === "VERIFIED" && result.brandName ? (
        <dl className="qr-result-details">
          <div><dt>Thương hiệu</dt><dd>{result.brandName}</dd></div>
          {result.productName && <div><dt>Sản phẩm</dt><dd>{result.productName}</dd></div>}
          {result.modelName && <div><dt>Mẫu sản phẩm</dt><dd>{result.modelName}</dd></div>}
          {result.batchNumber && <div><dt>Mã lô</dt><dd>{result.batchNumber}</dd></div>}
          {result.countryOfOrigin && <div><dt>Nguồn gốc</dt><dd>{result.countryOfOrigin}</dd></div>}
        </dl>
      ) : (
        <p>{getStatusDescription(result.status)}</p>
      )}
    </section>
  );
}

function getStatusTitle(status: VerificationResult["status"]) {
  if (status === "VERIFIED") return "Sản phẩm đã được xác minh";
  if (status === "SUSPICIOUS") return "Cần thận trọng với sản phẩm này";
  if (status === "INACTIVE") return "Mã xác thực không còn hoạt động";
  return "Không tìm thấy mã xác thực";
}

function getStatusDescription(status: VerificationResult["status"]) {
  if (status === "SUSPICIOUS") return "Hệ thống ghi nhận trạng thái rủi ro; hãy kiểm tra sản phẩm với nhà bán hàng.";
  if (status === "INACTIVE") return "Mã không thể dùng để xác minh nguồn gốc ở thời điểm hiện tại.";
  return "Kiểm tra lại mã hoặc liên kết, rồi thử lại.";
}
