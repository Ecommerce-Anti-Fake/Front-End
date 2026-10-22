import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CircleHelp, Landmark, QrCode, ShieldCheck, Wallet } from "lucide-react";
import { requestPayOSPayment, paymentCheckout } from "../../services/payos.api";
import { formatVnd } from "../../ultil/currency";
import {
  checkoutReference, paymentPath, parsePaymentReference, parsePayOSCheckoutState, isAllowedPayOSCheckoutUrl,
  getPayOSCheckoutRoutes, getPayOSEmbeddedReturnUrl, parsePayOSCheckoutMessage,
  paymentSecondsRemaining, formatPaymentCountdown,
  type PayOSCheckoutState,
} from "./payosCheckoutState";
import "../../css/components/payment/paymentModel.css";

type PaymentModelProps = { amount?: number; orderCode?: string | number; onBack?: () => void; onSupport?: () => void };
type PayOSClient = { open: () => void; exit: () => void };
declare global {
  interface Window {
    PayOSCheckout?: { usePayOS: (config: {
      RETURN_URL: string; ELEMENT_ID: string; CHECKOUT_URL: string; embedded: true;
      onSuccess: () => void; onCancel: () => void; onExit: () => void;
    }) => PayOSClient };
  }
}

export default function PaymentModel({ onBack, onSupport }: PaymentModelProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const initial = useMemo(() => parsePayOSCheckoutState(location.state?.checkout), [location.state]);
  const reference = useMemo(() => parsePaymentReference(location.search) ?? (initial ? checkoutReference(initial) : null), [location.search, initial]);
  const [checkout, setCheckout] = useState<PayOSCheckoutState | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [offset, setOffset] = useState(0);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const checking = useRef(false);
  const expiryChecked = useRef(false);
  const routes = getPayOSCheckoutRoutes(reference?.flow ?? "ORDER");
  const backPath = reference?.flow === "ORDER" ? "/profile/orders" : routes.backPath;
  const back = useCallback(() => { if (onBack) onBack(); else navigate(backPath); }, [onBack, navigate, backPath]);
  const refresh = useCallback(async (action: "resume" | "cancel" | "retry" = "resume") => {
    if (!reference || checking.current) return;
    checking.current = true;
    setBusy(true);
    try {
      const result = await requestPayOSPayment(reference, action);
      const next = paymentCheckout(reference, result);
      setCheckout(next);
      setStatus(result.status.toUpperCase());
      setVerified(true);
      if (result.serverTime && Number.isFinite(Date.parse(result.serverTime))) setOffset(Date.parse(result.serverTime) - Date.now());
      setError(result.message ?? (action === "cancel" && !["PAID", "CANCELLED"].includes(result.status.toUpperCase()) ? "PayOS chưa xác nhận hủy. Vui lòng kiểm tra lại trạng thái." : ""));
      setConfirmCancel(false);
      if (action === "retry") expiryChecked.current = false;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể kiểm tra PayOS. Vui lòng thử lại.");
    } finally { checking.current = false; setBusy(false); }
  }, [reference]);

  useEffect(() => {
    if (reference && !parsePaymentReference(location.search)) navigate(paymentPath(reference), { replace: true, state: location.state });
  }, [reference, location.search, location.state, navigate]);
  useEffect(() => {
    let active = true;
    const start = window.setTimeout(() => { if (active) void refresh(); }, 0);
    const poll = window.setInterval(() => { if (active) void refresh(); }, 5000);
    const focus = () => { if (active) void refresh(); };
    window.addEventListener("focus", focus);
    return () => { active = false; window.clearTimeout(start); window.clearInterval(poll); window.removeEventListener("focus", focus); };
  }, [refresh]);
  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);
  const seconds = paymentSecondsRemaining(checkout?.expiresAt, now + offset);
  // Hide immediately at the server deadline, but only the server establishes final state.
  const expired = status === "EXPIRED" || (status === "PENDING" && seconds === 0);
  const awaiting = verified && status === "PENDING" && !expired;
  const pending = awaiting && checkout?.canResume !== false;
  useEffect(() => {
    if (!expired || expiryChecked.current) return;
    expiryChecked.current = true;
    const id = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(id);
  }, [expired, refresh]);
  const checkoutUrl = pending ? checkout?.checkoutUrl : undefined;
  useLayoutEffect(() => {
    if (!checkoutUrl || !isAllowedPayOSCheckoutUrl(checkoutUrl)) return;
    const container = document.getElementById("payos-checkout-frame");
    if (!container) return;
    const sdk = window.PayOSCheckout;
    if (!sdk) { container.textContent = "Không thể tải thanh toán PayOS. Vui lòng tải lại trang."; return; }
    container.replaceChildren();
    let disposed = false;
    const reconcile = () => { if (!disposed) void refresh(); };
    const client = sdk.usePayOS({
      // The SDK concatenates this value without encoding its nested query.
      RETURN_URL: encodeURIComponent(getPayOSEmbeddedReturnUrl(window.location.origin, reference ?? undefined)), ELEMENT_ID: "payos-checkout-frame",
      CHECKOUT_URL: checkoutUrl, embedded: true, onSuccess: reconcile, onCancel: reconcile, onExit: reconcile,
    });
    try { client.open(); } catch { container.textContent = "Không thể tải PayOS. Vui lòng tải lại trang."; }
    const frame = container.querySelector("iframe");
    if (frame) frame.title = "Biểu mẫu thanh toán PayOS";
    const message = (event: MessageEvent) => {
      if (!["https://next.pay.payos.vn", "https://pay.payos.vn"].includes(event.origin) || !frame || event.source !== frame.contentWindow) return;
      const result = parsePayOSCheckoutMessage(event.data);
      if (result) reconcile();
    };
    window.addEventListener("message", message);
    return () => {
      disposed = true;
      window.removeEventListener("message", message);
      try { if (container.querySelector("iframe")) client.exit(); } catch { /* PayOS may have already removed its frame. */ }
      container.replaceChildren();
    };
  }, [checkoutUrl, refresh, reference]);

  const title = reference?.flow === "USER_WALLET_TOP_UP" ? "Nạp tiền vào ví" : reference?.flow === "SHOP_WALLET_TOP_UP" ? "Nạp tiền vào ví shop" : "Thanh toán đơn hàng";
  const statusLabel: Record<string, string> = { PENDING: "Chờ thanh toán", PROCESSING: "Đang xử lý", PAID: "Đã thanh toán", CANCELLED: "Đã hủy", EXPIRED: "Đã hết hạn", FAILED: "Chưa thành công" };
  return (
    <section className="payment-model-page">
      <div className="payment-model-shell">
        <header className="payment-model-header">
          <div><h1>{title}</h1><p>{reference?.flow === "ORDER" ? "Quét mã QR PayOS bên dưới để hoàn tất giao dịch." : "Quét mã QR PayOS bên dưới để hoàn tất yêu cầu nạp tiền."}</p></div>
          <div className="payment-order-code"><span>{reference?.flow === "ORDER" ? "Mã đơn hàng" : "Mã giao dịch"}</span><strong>{checkout ? checkout.flow === "ORDER" ? checkout.orderCode : checkout.topUpId : "Đang cập nhật"}</strong></div>
        </header>
        <div className="payment-model-content">
          <div className="payment-qr-card">
            <div className="payment-safe-badge"><ShieldCheck size={15} /> Giao dịch an toàn</div>
            {!reference ? <p role="alert">Thiếu thông tin giao dịch. Vui lòng quay lại danh sách đơn hàng hoặc ví để tiếp tục.</p> : null}
            {reference && !verified ? <p role="status">Đang xác minh giao dịch với PayOS...</p> : null}
            {pending ? <>
              <div id="payos-checkout-frame" className="payment-embed-frame" />
              <p className="payment-countdown">{seconds === null ? "Đang đối soát thời hạn giao dịch" : <>Hết hạn sau <strong>{formatPaymentCountdown(seconds)}</strong></>}</p>
            </> : null}
            {expired ? <p className="payment-expired" role="status">Mã QR đã hết hạn. Vui lòng tạo yêu cầu thanh toán mới.</p> : null}
            {status === "PAID" ? <p className="payment-result-card payment-result-card--compact" role="status">Thanh toán thành công. Hệ thống đã xác nhận giao dịch.</p> : null}
            {status === "CANCELLED" ? <p className="payment-result-card payment-result-card--cancelled payment-result-card--compact" role="status">Thanh toán đã được xác nhận hủy.</p> : null}
            {status === "FAILED" ? <p className="payment-result-card payment-result-card--failed payment-result-card--compact" role="status">Thanh toán chưa thành công.</p> : null}
            {checkout ? <strong className="payment-amount">{formatVnd(Number(checkout.amount))}</strong> : null}
            <p className="payment-auto-note">Chỉ xác nhận thanh toán sau khi hệ thống đối soát với PayOS. Quay lại không hủy yêu cầu.</p>
            <div className="payment-management">
              <p className="payment-status-label" aria-live="polite">Trạng thái: <strong>{statusLabel[status] || "Đang kiểm tra"}</strong></p>
              {error ? <p role="alert" className="payment-embed-alert">{error}</p> : null}
              {awaiting ? <button className="payment-cancel-btn" type="button" disabled={busy} onClick={() => setConfirmCancel(true)}>Hủy thanh toán</button> : null}
              {(expired || (status === "CANCELLED" && reference?.flow !== "ORDER") || status === "FAILED") && checkout?.canRetry !== false ? <button className="payment-result-btn" type="button" disabled={busy} onClick={() => reference?.flow === "ORDER" ? void refresh("retry") : navigate(backPath)}>Tạo yêu cầu thanh toán mới</button> : null}
              {status === "PAID" ? <button className="payment-result-btn" type="button" onClick={back}>{reference?.flow === "ORDER" ? "Xem đơn hàng" : "Mở ví"}</button> : null}
              {confirmCancel ? <div className="payment-cancel-confirm" role="alertdialog" aria-modal="false" aria-labelledby="payment-cancel-title">
                <h3 id="payment-cancel-title">Xác nhận hủy thanh toán?</h3>
                <p>{reference?.flow === "ORDER" ? "Thao tác này hủy yêu cầu PayOS và áp dụng quy tắc hủy đơn hàng hiện hành. Nếu thanh toán đã được ghi nhận, giao dịch sẽ không bị hủy." : "Yêu cầu nạp tiền này sẽ bị hủy sau khi PayOS xác nhận."}</p>
                <button className="payment-result-btn" type="button" disabled={busy} onClick={() => void refresh("cancel")}>Xác nhận hủy thanh toán</button>
                <button className="payment-check-btn" type="button" disabled={busy} onClick={() => setConfirmCancel(false)}>Tiếp tục thanh toán</button>
              </div> : null}
            </div>
            <div className="payment-method-icons" aria-label="Phương thức hỗ trợ"><span><Landmark size={20} /></span><span><Wallet size={20} /></span><span><QrCode size={20} /></span></div>
          </div>
          <div className="payment-guide-area">
            <div className="payment-guide-card">
              <h2>Hướng dẫn thanh toán</h2>
              <ol>
                <li><span>1</span>Mở ứng dụng Ngân hàng hoặc Ví điện tử.</li>
                <li><span>2</span>Chọn chức năng &quot;Quét mã QR&quot;.</li>
                <li><span>3</span>Quét mã QR, xác nhận thanh toán và chờ hệ thống kiểm tra.</li>
              </ol>
              <div className="payment-guide-watermark" aria-hidden="true"><Wallet size={82} /></div>
            </div>
            <div className="payment-action-row">
              <button type="button" className="payment-back-btn" onClick={back}><ArrowLeft size={18} />Quay lại</button>
              <button type="button" className="payment-support-btn" onClick={onSupport ?? (() => navigate("/chat"))}><CircleHelp size={18} />Cần hỗ trợ?</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
