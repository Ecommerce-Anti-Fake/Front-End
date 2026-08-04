import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleHelp,
  Landmark,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  XCircle,
  Wallet,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "../../css/components/payment/paymentModel.css";
import { fetchOrderDetail } from "../../services/order.api";
import { formatVnd } from "../../ultil/currency";
import {
  getPayOSCheckoutRoutes,
  parsePayOSCheckoutMessage,
  parsePayOSReturnQuery,
  parsePayOSCheckoutState,
  getPayOSEmbeddedReturnUrl,
  type PayOSInlineResult,
  type OrderPayOSCheckoutState,
  type PayOSCheckoutState,
} from "./payosCheckoutState";

type PaymentModelProps = {
  amount?: number;
  orderCode?: string | number;
  onBack?: () => void;
  onSupport?: () => void;
};

const successStatuses = new Set(["PAID"]);
const failedStatuses = new Set(["FAILED", "CANCELLED", "CANCELED", "EXPIRED"]);

type PayOSConfig = {
  RETURN_URL: string;
  ELEMENT_ID: string;
  CHECKOUT_URL: string;
  embedded: true;
  onSuccess: () => void;
  onCancel: () => void;
  onExit: () => void;
};

type PayOSClient = {
  open: () => void;
  exit: () => void;
};

type PayOSCheckoutSdk = {
  usePayOS: (config: PayOSConfig) => PayOSClient;
};

declare global {
  interface Window {
    PayOSCheckout?: PayOSCheckoutSdk;
  }
}

const getCheckoutCopy = (checkout: PayOSCheckoutState | null) => {
  if (checkout?.flow === "USER_WALLET_TOP_UP") {
    return {
      title: "Nạp tiền vào ví",
      description: "Quét mã QR PayOS bên dưới để hoàn tất yêu cầu nạp tiền.",
      referenceLabel: "Mã nạp tiền",
      reference: checkout.topUpId,
      autoNote: "Số dư sẽ được cập nhật sau khi webhook xác nhận thanh toán.",
    };
  }

  if (checkout?.flow === "SHOP_WALLET_TOP_UP") {
    return {
      title: "Nạp tiền vào ví shop",
      description: "Quét mã QR PayOS bên dưới để hoàn tất yêu cầu nạp tiền.",
      referenceLabel: "Mã nạp tiền",
      reference: checkout.topUpId,
      autoNote: "Số dư shop sẽ được cập nhật sau khi webhook xác nhận thanh toán.",
    };
  }

  return {
    title: "Thanh toán đơn hàng",
    description: "Quét mã QR PayOS bên dưới để hoàn tất giao dịch.",
    referenceLabel: "Mã đơn hàng",
    reference: checkout?.orderCode ?? "Chưa có",
    autoNote: "Hệ thống chỉ xác nhận thành công khi đơn hàng đã được ghi nhận PAID.",
  };
};

export default function PaymentModel({
  amount,
  orderCode,
  onBack,
  onSupport,
}: PaymentModelProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const checkout = useMemo(
    () => parsePayOSCheckoutState(location.state?.checkout),
    [location.state?.checkout],
  );
  const payOSReturn = useMemo(
    () => parsePayOSReturnQuery(location.search),
    [location.search],
  );
  const routes = useMemo(
    () =>
      checkout
        ? getPayOSCheckoutRoutes(checkout.flow)
        : {
            backPath: "/checkout",
            successPath: "/payment-success",
            cancelPath: "/payment-failed",
          },
    [checkout],
  );
  const copy = useMemo(() => getCheckoutCopy(checkout), [checkout]);
  const navigatedRef = useRef(false);
  const checkingRef = useRef(false);
  const [embedError, setEmbedError] = useState("");
  const [embedReady, setEmbedReady] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [inlineResult, setInlineResult] = useState<PayOSInlineResult | null>(
    null,
  );

  useEffect(() => {
    if (checkout || !payOSReturn) return;

    navigate(
      payOSReturn.cancelled
        ? `/payment-failed${location.search}`
        : `/payment-success${location.search}`,
      { replace: true },
    );
  }, [checkout, location.search, navigate, payOSReturn]);

  const isOrderCheckout = checkout?.flow === "ORDER";
  const displayAmount = Number(checkout?.amount ?? amount ?? 0);
  const displayReference = String(
    orderCode ?? (isOrderCheckout ? checkout.orderCode : copy.reference),
  );

  const isWalletTopUp =
    checkout?.flow === "USER_WALLET_TOP_UP" ||
    checkout?.flow === "SHOP_WALLET_TOP_UP";

  const showInlineResult = useCallback((result: PayOSInlineResult) => {
    navigatedRef.current = true;
    setStatusMessage("");
    setInlineResult(result);
  }, []);

  const finishOrderPayment = useCallback(
    (
      orderCheckout: OrderPayOSCheckoutState,
      result: "success" | "failed",
      paymentStatus: string,
      reason?: string,
    ) => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;

      navigate(result === "success" ? "/payment-success" : "/payment-failed", {
        replace: true,
        state: {
          checkout: orderCheckout,
          paymentMethod: "PAYOS",
          paymentStatus,
          reason,
        },
      });
    },
    [navigate],
  );

  const checkPaymentNow = useCallback(async () => {
    if (checkout?.flow !== "ORDER" || checkingRef.current) return;

    checkingRef.current = true;
    setCheckingPayment(true);
    setStatusMessage("");

    try {
      const order = await fetchOrderDetail(checkout.orderId);
      const paymentStatus = String(order.paymentStatus ?? "").toUpperCase();

      if (successStatuses.has(paymentStatus)) {
        finishOrderPayment(checkout, "success", paymentStatus);
        return;
      }

      if (failedStatuses.has(paymentStatus)) {
        finishOrderPayment(
          checkout,
          "failed",
          paymentStatus,
          "Thanh toán không thành công",
        );
        return;
      }

      setStatusMessage(
        "Thanh toán đang chờ backend xác nhận. Bạn có thể tiếp tục chờ trên trang này.",
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Không thể kiểm tra trạng thái thanh toán",
      );
    } finally {
      checkingRef.current = false;
      setCheckingPayment(false);
    }
  }, [checkout, finishOrderPayment]);

  useEffect(() => {
    if (!checkout) return;

    const elementId = "payos-checkout-frame";
    const container = document.getElementById(elementId);
    if (!container) {
      const missingContainerTimeout = window.setTimeout(
        () => setEmbedError("Không tìm thấy vùng hiển thị biểu mẫu PayOS."),
        0,
      );
      return () => window.clearTimeout(missingContainerTimeout);
    }

    container.replaceChildren();
    let frameLoaded = false;
    let disposed = false;

    const handleSuccess = () => {
      if (disposed || navigatedRef.current) return;

      if (checkout.flow === "ORDER") {
        setStatusMessage(
          "PayOS đã tiếp nhận giao dịch. Đang chờ backend xác nhận đơn hàng PAID...",
        );
        void checkPaymentNow();
        return;
      }

      showInlineResult("SUCCESS");
    };

    const handleCancel = () => {
      if (disposed || navigatedRef.current) return;

      if (checkout.flow === "ORDER") {
        finishOrderPayment(
          checkout,
          "failed",
          "CANCELLED",
          "Người dùng đã hủy thanh toán",
        );
        return;
      }

      showInlineResult("CANCELLED");
    };

    const handleExit = () => {
      if (disposed || navigatedRef.current) return;
      navigatedRef.current = true;
      navigate(routes.backPath, { replace: true });
    };

    const config: PayOSConfig = {
      RETURN_URL: getPayOSEmbeddedReturnUrl(window.location.origin),
      ELEMENT_ID: elementId,
      CHECKOUT_URL: checkout.checkoutUrl,
      embedded: true,
      onSuccess: handleSuccess,
      onCancel: handleCancel,
      onExit: handleExit,
    };
    const payOSSdk = window.PayOSCheckout;
    if (!payOSSdk) {
      const missingSdkTimeout = window.setTimeout(
        () => setEmbedError("Không tải được SDK nhúng thanh toán PayOS."),
        0,
      );
      return () => window.clearTimeout(missingSdkTimeout);
    }

    const payOS = payOSSdk.usePayOS(config);

    try {
      payOS.open();
    } catch (error) {
      const openErrorTimeout = window.setTimeout(
        () =>
          setEmbedError(
            error instanceof Error
              ? error.message
              : "Không thể nhúng biểu mẫu PayOS vào trang.",
          ),
        0,
      );
      return () => window.clearTimeout(openErrorTimeout);
    }

    const frame = container.querySelector("iframe");
    if (!frame) {
      const missingFrameTimeout = window.setTimeout(
        () => setEmbedError("PayOS không tạo được biểu mẫu thanh toán."),
        0,
      );
      return () => window.clearTimeout(missingFrameTimeout);
    }

    frame.title = "Biểu mẫu thanh toán PayOS";

    const handleLoad = () => {
      frameLoaded = true;
      if (!disposed) setEmbedReady(true);
    };
    const handleError = () => {
      if (!disposed) {
        setEmbedError(
          "Biểu mẫu PayOS không tải được. Vui lòng thử lại yêu cầu thanh toán.",
        );
      }
    };

    frame.addEventListener("load", handleLoad);
    frame.addEventListener("error", handleError);

    const handleNextPayOSMessage = (event: MessageEvent) => {
      if (
        event.origin !== "https://next.pay.payos.vn" ||
        event.source !== frame.contentWindow
      ) {
        return;
      }

      const checkoutEvent = parsePayOSCheckoutMessage(event.data);
      if (checkoutEvent === "SUCCESS") handleSuccess();
      if (checkoutEvent === "CANCEL") handleCancel();
      if (checkoutEvent === "FAILED") {
        if (checkout.flow === "ORDER") {
          finishOrderPayment(
            checkout,
            "failed",
            "FAILED",
            "PayOS báo giao dịch thất bại",
          );
        } else {
          showInlineResult("FAILED");
        }
      }
      if (checkoutEvent === "EXIT") handleExit();
    };
    window.addEventListener("message", handleNextPayOSMessage);

    const timeoutId = window.setTimeout(() => {
      if (!disposed && !frameLoaded) {
        setEmbedError(
          "Biểu mẫu PayOS phản hồi quá lâu. Vui lòng thử lại yêu cầu thanh toán.",
        );
      }
    }, 8000);

    return () => {
      disposed = true;
      window.clearTimeout(timeoutId);
      frame.removeEventListener("load", handleLoad);
      frame.removeEventListener("error", handleError);
      window.removeEventListener("message", handleNextPayOSMessage);

      if (container.contains(frame)) {
        try {
          payOS.exit();
        } catch {
          container.replaceChildren();
        }
      } else {
        container.replaceChildren();
      }
    };
  }, [
    checkout,
    checkPaymentNow,
    finishOrderPayment,
    navigate,
    routes,
    showInlineResult,
  ]);

  useEffect(() => {
    if (checkout?.flow !== "ORDER") return;

    const intervalId = window.setInterval(() => {
      if (!navigatedRef.current) void checkPaymentNow();
    }, 3500);

    return () => window.clearInterval(intervalId);
  }, [checkout, checkPaymentNow]);

  return (
    <section className="payment-model-page">
      <div className="payment-model-shell">
        <header className="payment-model-header">
          <div>
            <h1>{copy.title}</h1>
            <p>{copy.description}</p>
          </div>

          <div className="payment-order-code">
            <span>{copy.referenceLabel}</span>
            <strong>{displayReference}</strong>
          </div>
        </header>

        <div className="payment-model-content">
          <div className="payment-qr-card">
            <div className="payment-safe-badge">
              <ShieldCheck size={15} />
              Giao dịch an toàn
            </div>

            {checkout ? (
              <>
                <div
                  id="payos-checkout-frame"
                  className={`payment-embed-frame${inlineResult ? " payment-embed-frame--result" : ""}`}
                  aria-busy={!embedReady}
                />
                {!embedReady && !embedError ? (
                  <div
                    className="payment-embed-status"
                    role="status"
                    aria-live="polite"
                  >
                    <Loader2 size={16} className="payment-spin" />
                    Đang tải biểu mẫu PayOS...
                  </div>
                ) : null}
                {embedError ? (
                  <div
                    className="payment-embed-alert"
                    role="alert"
                    aria-live="assertive"
                  >
                    <AlertTriangle size={18} />
                    <div>
                      <strong>Không thể hiển thị QR ổn định</strong>
                      <p>{embedError}</p>
                    </div>
                  </div>
                ) : null}
                {inlineResult && isWalletTopUp ? (
                  <div
                    className={`payment-result-card payment-result-card--${inlineResult.toLowerCase()}`}
                    role="status"
                    aria-live="polite"
                  >
                    {inlineResult === "SUCCESS" ? (
                      <CheckCircle2 size={34} />
                    ) : (
                      <XCircle size={34} />
                    )}
                    <strong>
                      {inlineResult === "SUCCESS"
                        ? "Thanh toán thành công"
                        : inlineResult === "CANCELLED"
                          ? "Bạn đã hủy thanh toán"
                          : "Thanh toán chưa thành công"}
                    </strong>
                    <p>
                      {inlineResult === "SUCCESS"
                        ? "PayOS đã báo giao dịch thành công. Số dư sẽ được cộng sau khi hệ thống nhận webhook xác nhận."
                        : inlineResult === "CANCELLED"
                          ? "Giao dịch chưa được ghi nhận. Bạn có thể quay lại ví và thử lại khi sẵn sàng."
                          : "PayOS chưa xác nhận giao dịch. Vui lòng kiểm tra lại hoặc thử lại sau."}
                    </p>
                    <button
                      type="button"
                      className="payment-result-btn"
                      onClick={() =>
                        navigate(
                          inlineResult === "SUCCESS"
                            ? routes.successPath
                            : routes.cancelPath,
                          { replace: true },
                        )
                      }
                    >
                      {inlineResult === "SUCCESS" ? "Mở ví" : "Quay lại ví"}
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="payment-invalid-state" role="alert">
                <AlertTriangle size={28} />
                <strong>Không thể bắt đầu thanh toán</strong>
                <p>
                  Thông tin PayOS bị thiếu hoặc không hợp lệ. Vui lòng quay lại
                  màn trước để tạo lại yêu cầu thanh toán.
                </p>
              </div>
            )}

            {checkout ? (
              <>
                <strong className="payment-amount">
                  {formatVnd(displayAmount)}
                </strong>
                <p className="payment-auto-note">{copy.autoNote}</p>
              </>
            ) : null}

            {checkout && isOrderCheckout ? (
              <div className="payment-link-actions">
                {isOrderCheckout ? (
                  <button
                    type="button"
                    className="payment-check-btn"
                    onClick={() => void checkPaymentNow()}
                    disabled={checkingPayment}
                  >
                    {checkingPayment ? (
                      <Loader2 size={16} className="payment-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    Kiểm tra thanh toán
                  </button>
                ) : null}
              </div>
            ) : null}

            {statusMessage ? (
              <div
                className="payment-checking-note"
                role="status"
                aria-live="polite"
              >
                {statusMessage}
              </div>
            ) : null}

            <div
              className="payment-method-icons"
              aria-label="Phương thức hỗ trợ"
            >
              <span>
                <Landmark size={20} />
              </span>
              <span>
                <Wallet size={20} />
              </span>
              <span>
                <QrCode size={20} />
              </span>
            </div>
          </div>

          <div className="payment-guide-area">
            <div className="payment-guide-card">
              <h2>Hướng dẫn thanh toán</h2>

              <ol>
                <li>
                  <span>1</span>
                  Mở ứng dụng Ngân hàng hoặc Ví điện tử.
                </li>
                <li>
                  <span>2</span>
                  Chọn chức năng &quot;Quét mã QR&quot;.
                </li>
                <li>
                  <span>3</span>
                  Quét mã QR, xác nhận thanh toán và chờ hệ thống kiểm tra.
                </li>
              </ol>

              <div className="payment-guide-watermark" aria-hidden="true">
                <Wallet size={82} />
              </div>
            </div>

            <div className="payment-action-row">
              <button
                type="button"
                className="payment-back-btn"
                onClick={onBack ?? (() => navigate(routes.backPath))}
              >
                <ArrowLeft size={18} />
                Quay lại
              </button>

              <button
                type="button"
                className="payment-support-btn"
                onClick={onSupport ?? (() => navigate("/chat"))}
              >
                <CircleHelp size={18} />
                Cần hỗ trợ?
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
