import { CheckCircle2, Download, Info, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import InstallGuideTabs from "../../components/pwa/installGuideTabs";
import { usePwaInstall } from "../../hooks/usePwaInstall";
import "../../css/pages/profile/settingsPage.css";

export default function SettingsPage() {
  const { environment, uiState, installing, install } = usePwaInstall();

  const handleInstall = async () => {
    const outcome = await install();
    if (outcome === "accepted") {
      toast.success("AntiFake đã được cài đặt thành công");
    } else if (outcome === "dismissed") {
      toast.info("Bạn có thể cài AntiFake sau từ trang này");
    }
  };

  return (
    <main className="pwa-settings-page">
      <header className="pwa-hero">
        <div className="pwa-hero-copy">
          <p className="pwa-eyebrow">ỨNG DỤNG ANTIFAKE</p>
          <h1>Cài đặt AntiFake</h1>
          <p>
            Cài AntiFake trên thiết bị để truy cập nhanh hơn mà không cần nhập
            lại địa chỉ website.
          </p>
          <div className="pwa-hero-points" aria-label="Lợi ích">
            <span><ShieldCheck size={17} aria-hidden="true" /> Cùng tài khoản và dữ liệu</span>
            <span><Download size={17} aria-hidden="true" /> Không cần tải file cài đặt</span>
          </div>
        </div>
        <img src="/favicon.png" alt="Biểu tượng AntiFake" className="pwa-app-icon" />
      </header>

      <section className={`pwa-install-status pwa-status-${uiState.status}`} aria-live="polite">
        <div className="pwa-status-icon" aria-hidden="true">
          {uiState.status === "installed" ? <CheckCircle2 size={28} /> : <Download size={28} />}
        </div>
        <div className="pwa-status-copy">
          <p className="pwa-status-label">TRẠNG THÁI TRÊN THIẾT BỊ NÀY</p>
          <h2>
            {uiState.status === "installed"
              ? "AntiFake đã được cài trên thiết bị này"
              : uiState.status === "ready"
                ? "AntiFake chưa được cài trên thiết bị này"
                : "Cài đặt bằng hướng dẫn dành cho thiết bị của bạn"}
          </h2>
          <p>
            {uiState.status === "installed"
              ? environment.isStandalone
                ? "Bạn đang sử dụng AntiFake ở chế độ ứng dụng độc lập."
                : "Cài đặt hoàn tất. Hãy mở AntiFake từ icon trên thiết bị của bạn."
              : uiState.status === "ready"
                ? "Trình duyệt đã sẵn sàng mở hộp thoại cài đặt khi bạn yêu cầu."
                : "Trình duyệt hiện tại không cung cấp popup cài trực tiếp. Đây không phải là lỗi."}
          </p>
        </div>
        {uiState.showInstallButton && (
          <button
            type="button"
            className="pwa-install-button"
            onClick={() => void handleInstall()}
            disabled={installing}
          >
            <Download size={19} aria-hidden="true" />
            {installing ? "Đang mở cài đặt..." : "Cài đặt AntiFake"}
          </button>
        )}
      </section>

      <aside className="pwa-session-note">
        <Info size={20} aria-hidden="true" />
        <p>
          AntiFake đã cài vẫn dùng phiên đăng nhập hiện tại. Bạn chỉ cần đăng
          nhập lại khi phiên bảo mật đã hết hạn hoặc bị thu hồi.
        </p>
      </aside>

      <InstallGuideTabs environment={environment} />
    </main>
  );
}
