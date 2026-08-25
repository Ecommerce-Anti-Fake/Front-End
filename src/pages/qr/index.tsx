import { BrowserQRCodeReader } from "@zxing/browser";
import { Link, QrCode, ShieldCheck, Upload } from "lucide-react";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import ContextualHelpLink from "../../components/help/contextualHelpLink";
import { verifyProduct, type VerificationResult } from "../../services/verification.api";
import "../../css/pages/qr.css";

type VerificationTab = "qr" | "link" | "code";

const QR_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_QR_IMAGE_BYTES = 5 * 1024 * 1024;
const QR_IMAGE_TYPE_MESSAGE =
  "Vui lòng chọn ảnh PNG, JPEG hoặc WebP nhỏ hơn 5 MB.";
const QR_IMAGE_DECODE_MESSAGE =
  "Không tìm thấy mã QR có thể đọc trong ảnh này. Vui lòng thử ảnh rõ hơn hoặc dán liên kết/mã xác thực.";
const QR_IMAGE_DECODE_TIMEOUT_MS = 2500;

async function decodeQrImage(objectUrl: string) {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error("QR_DECODE_TIMEOUT")),
      QR_IMAGE_DECODE_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([
      new BrowserQRCodeReader().decodeFromImageUrl(objectUrl),
      timeout,
    ]);
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
}

export default function QRPage() {
  const [activeTab, setActiveTab] = useState<VerificationTab>("qr");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const verifyValue = async (value: string) => {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      setError("Vui lòng nhập mã hoặc liên kết xác thực.");
      return;
    }

    setLoading(true);
    try {
      setResult(await verifyProduct(normalizedValue));
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);
    setError(null);

    if (activeTab === "qr" && !input.trim()) {
      setError("Vui lòng chọn ảnh QR trước khi kiểm tra.");
      return;
    }

    await verifyValue(input);
  };

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    setResult(null);
    setError(null);
    setInput("");

    if (!file) return;
    if (!QR_IMAGE_TYPES.has(file.type) || file.size > MAX_QR_IMAGE_BYTES) {
      setError(QR_IMAGE_TYPE_MESSAGE);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLoading(true);
    try {
      const decoded = await decodeQrImage(objectUrl);
      const decodedValue = decoded.getText().trim();
      if (!decodedValue) throw new Error("QR_EMPTY_RESULT");

      setInput(decodedValue);
      await verifyValue(decodedValue);
    } catch {
      setError(QR_IMAGE_DECODE_MESSAGE);
    } finally {
      URL.revokeObjectURL(objectUrl);
      setLoading(false);
    }
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
                  accept="image/png,image/jpeg,image/webp"
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
