import {
  CheckCircle2,
  CircleHelp,
  Monitor,
  Smartphone,
  TabletSmartphone,
} from "lucide-react";
import { useState } from "react";
import type { PwaEnvironment, PwaPlatform } from "../../services/pwa-install";

type GuideKey = PwaPlatform;

const tabs: Array<{
  key: GuideKey;
  label: string;
  icon: typeof Monitor;
}> = [
  { key: "desktop", label: "Máy tính", icon: Monitor },
  { key: "android", label: "Android", icon: Smartphone },
  { key: "ios", label: "iPhone/iPad", icon: TabletSmartphone },
];

const chromeSteps = [
  "Mở AntiFake bằng Google Chrome.",
  "Truy cập trang Cài đặt AntiFake.",
  "Nhấn “Cài đặt AntiFake”.",
  "Xác nhận “Install/Cài đặt” trong popup của Chrome.",
  "Icon AntiFake sẽ xuất hiện trong danh sách ứng dụng; Chrome có thể cho phép tạo shortcut ngoài Desktop.",
  "Mở AntiFake từ icon để sử dụng trong cửa sổ ứng dụng riêng.",
];

const edgeSteps = [
  "Mở AntiFake bằng Microsoft Edge.",
  "Chọn “Cài đặt AntiFake” trên trang.",
  "Hoặc mở menu Edge → Apps → Install AntiFake.",
  "Xác nhận cài đặt trong hộp thoại của Edge.",
  "Chọn tạo Desktop shortcut nếu Edge cung cấp tùy chọn này.",
  "Mở AntiFake từ shortcut hoặc app launcher sau khi cài.",
];

const androidSteps = [
  "Mở AntiFake bằng Google Chrome trên Android.",
  "Đăng nhập nếu cần và mở trang Cài đặt AntiFake.",
  "Nhấn “Cài đặt AntiFake”.",
  "Xác nhận “Install/Cài đặt”.",
  "Icon AntiFake sẽ xuất hiện ngoài màn hình chính.",
  "Từ lần sau, nhấn icon AntiFake để mở ứng dụng.",
];

const iosSteps = [
  "Mở antifake.io.vn bằng Safari.",
  "Nhấn nút Chia sẻ (Share).",
  "Cuộn menu và chọn “Thêm vào Màn hình chính / Add to Home Screen”.",
  "Kiểm tra tên ứng dụng là “AntiFake”.",
  "Nhấn “Thêm / Add”.",
  "Icon AntiFake sẽ xuất hiện trên màn hình chính.",
  "Nhấn icon AntiFake để sử dụng như ứng dụng.",
];

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="pwa-step-list">
      {steps.map((step, index) => (
        <li key={step}>
          <span aria-hidden="true">{index + 1}</span>
          <p>{step}</p>
        </li>
      ))}
    </ol>
  );
}

export default function InstallGuideTabs({
  environment,
}: {
  environment: PwaEnvironment;
}) {
  const [activeTab, setActiveTab] = useState<GuideKey>(environment.platform);

  return (
    <section className="pwa-guide" aria-labelledby="pwa-guide-title">
      <div className="pwa-section-heading">
        <div>
          <p className="pwa-eyebrow">HƯỚNG DẪN THEO THIẾT BỊ</p>
          <h2 id="pwa-guide-title">Chọn thiết bị của bạn</h2>
        </div>
        <span className="pwa-support-badge">
          <CheckCircle2 size={16} aria-hidden="true" /> Không bắt buộc cài đặt
        </span>
      </div>

      <div className="pwa-tabs" role="tablist" aria-label="Thiết bị cài đặt">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            id={`pwa-tab-${key}`}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            aria-controls={`pwa-panel-${key}`}
            className={activeTab === key ? "active" : ""}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={19} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "desktop" && (
        <div
          id="pwa-panel-desktop"
          role="tabpanel"
          aria-labelledby="pwa-tab-desktop"
          className="pwa-guide-panel"
        >
          <div className="pwa-guide-copy">
            <div className="pwa-browser-block">
              <h3>Google Chrome</h3>
              <p className="pwa-recommendation">Đề xuất trên Windows và macOS</p>
              <StepList steps={chromeSteps} />
              <p className="pwa-tip">
                <CircleHelp size={17} aria-hidden="true" /> Bạn cũng có thể nhấn
                icon Install trên thanh địa chỉ khi Chrome hiển thị icon này.
              </p>
            </div>
            <div className="pwa-browser-block">
              <h3>Microsoft Edge</h3>
              <p className="pwa-recommendation">Tích hợp tốt với Windows</p>
              <StepList steps={edgeSteps} />
            </div>
          </div>
          <img
            src="/pwa/install-desktop.svg"
            alt="Minh họa nút Cài app và hộp thoại xác nhận trên Chrome hoặc Edge"
            className="pwa-guide-image"
          />
        </div>
      )}

      {activeTab === "android" && (
        <div
          id="pwa-panel-android"
          role="tabpanel"
          aria-labelledby="pwa-tab-android"
          className="pwa-guide-panel"
        >
          <div className="pwa-guide-copy">
            <div className="pwa-browser-block">
              <h3>Chrome trên Android</h3>
              <p className="pwa-recommendation">Cài trực tiếp hoặc thêm vào màn hình chính</p>
              <StepList steps={androidSteps} />
              <p className="pwa-tip">
                <CircleHelp size={17} aria-hidden="true" /> Nếu không thấy nút cài,
                mở menu ⋮ → “Add to Home screen” hoặc “Install app”, tùy phiên bản Chrome.
              </p>
            </div>
          </div>
          <img
            src="/pwa/install-android.svg"
            alt="Minh họa menu Chrome Android với lựa chọn Cài đặt ứng dụng"
            className="pwa-guide-image"
          />
        </div>
      )}

      {activeTab === "ios" && (
        <div
          id="pwa-panel-ios"
          role="tabpanel"
          aria-labelledby="pwa-tab-ios"
          className="pwa-guide-panel"
        >
          <div className="pwa-guide-copy">
            <div className="pwa-browser-block">
              <h3>Safari trên iPhone/iPad</h3>
              <p className="pwa-recommendation">Cài bằng tính năng Thêm vào Màn hình chính</p>
              {environment.platform === "ios" && environment.browser !== "safari" && (
                <p className="pwa-ios-notice" role="note">
                  Để cài AntiFake trên iPhone/iPad, hãy mở trang này bằng Safari.
                </p>
              )}
              <StepList steps={iosSteps} />
              <p className="pwa-tip">
                <CircleHelp size={17} aria-hidden="true" /> Safari iOS không dùng
                popup cài đặt giống Chrome Android, vì vậy trang không hiển thị nút cài giả.
              </p>
            </div>
          </div>
          <img
            src="/pwa/install-ios.svg"
            alt="Minh họa nút Chia sẻ Safari và lựa chọn Thêm vào Màn hình chính"
            className="pwa-guide-image"
          />
        </div>
      )}
    </section>
  );
}
