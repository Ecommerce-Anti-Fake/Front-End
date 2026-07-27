import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { checkoutCart } from "../../services/cart.api";
import { checkoutBuyNow } from "../../services/product.api";
import { useGlobalLoadingStore } from "../../store/globalLoadingStore";
import type { BuyNowSelection, CheckoutShop, CheckoutSource } from "../../type/checkout";
import { formatVnd } from "../../ultil/currency";
import {
  getAffiliateAttribution,
  getAffiliateAttributionToken,
  resolveAffiliateAttribution,
} from "../../services/affiliate.api";

interface Props {
  source: CheckoutSource;
  buyNowSelection?: BuyNowSelection;
  cartItemIds: string[];
  payment: string;
  shippingOptionCode: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  shops: CheckoutShop[];
  systemVoucherCode: string;
  setSystemVoucherCode: (value: string) => void;
  shopVoucherCodes: Record<string, string>;
  setShopVoucherCodes: Dispatch<SetStateAction<Record<string, string>>>;
}

const toPaymentMethod = (payment: string) => {
  if (payment === "cod") return "COD";
  if (payment === "wallet") return "WALLET";
  return "PAYOS";
};

export default function CheckoutSummary({
  source,
  buyNowSelection,
  cartItemIds,
  payment,
  shippingOptionCode,
  subtotal,
  shippingFee,
  discount,
  total,
  shops,
  systemVoucherCode,
  setSystemVoucherCode,
  shopVoucherCodes,
  setShopVoucherCodes,
}: Props) {
  const navigate = useNavigate();
  const [capturedAffiliateCode] = useState(() => getAffiliateAttribution()?.code ?? "");
  const [affiliateCode, setAffiliateCode] = useState("");
  const [affiliateStatus, setAffiliateStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [loading, setLoading] = useState(false);
  const showLoading = useGlobalLoadingStore((state) => state.showLoading);
  const hideLoading = useGlobalLoadingStore((state) => state.hideLoading);

  const validateAffiliateCode = async () => {
    const code = affiliateCode.trim();
    if (!code) {
      setAffiliateStatus("idle");
      return;
    }
    setAffiliateStatus("checking");
    try {
      await resolveAffiliateAttribution(code);
      setAffiliateStatus("valid");
      toast.success("Mã affiliate đang hoạt động");
    } catch (error) {
      setAffiliateStatus("invalid");
      toast.error(error instanceof Error ? error.message : "Mã affiliate không hợp lệ");
    }
  };

  const handleCheckout = async () => {
    if (source === "cart" && cartItemIds.length === 0) {
      toast.error("Vui lòng chọn sản phẩm trước khi thanh toán");
      return;
    }

    if (source === "buy-now" && !buyNowSelection) {
      toast.error("Không tìm thấy thông tin sản phẩm mua ngay");
      return;
    }

    if (!shippingOptionCode) {
      toast.error("Vui lòng chọn phương thức vận chuyển");
      return;
    }

    try {
      setLoading(true);
      showLoading("Đang tạo thanh toán...");

      const paymentMethod = toPaymentMethod(payment);
      const attributionToken = getAffiliateAttributionToken();
      const checkout =
        source === "buy-now" && buyNowSelection
          ? await checkoutBuyNow({
              ...buyNowSelection,
              paymentMethod,
              shippingOptionCode,
              affiliateCode: affiliateCode.trim() || undefined,
              affiliateAttributionToken: attributionToken,
              systemVoucherCode: systemVoucherCode.trim() || undefined,
              shopVoucherCode: Object.values(shopVoucherCodes)[0]?.trim() || undefined,
            })
          : await checkoutCart({
              cartItemIds,
              paymentMethod,
              shippingOptionCode,
              affiliateCode: affiliateCode.trim() || undefined,
              affiliateAttributionToken: attributionToken,
              systemVoucherCode: systemVoucherCode.trim() || undefined,
              shopVouchers: Object.entries(shopVoucherCodes)
                .filter(([, code]) => code.trim())
                .map(([shopId, voucherCode]) => ({ shopId, voucherCode: voucherCode.trim() })),
            });

      if (paymentMethod === "COD" || paymentMethod === "WALLET") {
        navigate("/payment-success", {
          replace: true,
          state: {
            checkout,
            paymentMethod,
            paymentStatus: paymentMethod === "WALLET" ? "PAID" : "COD_PENDING",
          },
        });
        return;
      }

      navigate("/payment", {
        state: {
          checkout: {
            ...checkout,
            flow: "ORDER",
            amount: total,
          },
        },
      });
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Không thể tạo thanh toán",
      );
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  return (
    <div className="summary-card">
      <h3>Tóm tắt đơn hàng</h3>

      <div className="voucher-box">
        <input
          placeholder="Nhập mã ưu đãi..."
          value={affiliateCode}
          onChange={(event) => {
            setAffiliateCode(event.target.value);
            setAffiliateStatus("idle");
          }}
          aria-invalid={affiliateStatus === "invalid"}
        />

        <button type="button" onClick={validateAffiliateCode} disabled={affiliateStatus === "checking"}>
          {affiliateStatus === "checking" ? "Đang kiểm tra" : "Áp dụng"}
        </button>
      </div>
      {affiliateStatus === "valid" && (
        <small className="affiliate-code-status">
          Mã đang hoạt động. Hoa hồng chỉ được ghi nhận cho sản phẩm thuộc phạm vi chương trình; mã nhập tay được ưu tiên.
        </small>
      )}
      {!affiliateCode.trim() && capturedAffiliateCode && (
        <small className="affiliate-code-status">
          Đã ghi nhận link affiliate <strong>{capturedAffiliateCode}</strong>. Hệ thống chỉ áp dụng khi sản phẩm thuộc đúng phạm vi chương trình.
        </small>
      )}

      <div className="voucher-box">
        <input
          placeholder="Mã voucher hệ thống"
          value={systemVoucherCode}
          onChange={(event) => setSystemVoucherCode(event.target.value)}
          aria-label="Mã voucher hệ thống"
        />
      </div>

      {shops.map((shop) => (
        <div className="voucher-box" key={shop.shopId}>
          <span>{shop.shopName}</span>
          <input
            placeholder="Mã voucher shop"
            value={shopVoucherCodes[shop.shopId] ?? ""}
            onChange={(event) => setShopVoucherCodes((current) => ({ ...current, [shop.shopId]: event.target.value }))}
            aria-label={`Mã voucher của ${shop.shopName}`}
          />
        </div>
      ))}

      <div className="summary-row">
        <span>Tổng tiền hàng</span>
        <span>{formatVnd(subtotal)}</span>
      </div>

      <div className="summary-row">
        <span>Phí vận chuyển</span>
        <span>{formatVnd(shippingFee)}</span>
      </div>

      <div className="summary-row discount">
        <span>Giảm giá</span>
        <span>-{formatVnd(discount)}</span>
      </div>

      <div className="summary-total-checkout">
        <span>Tổng cộng</span>
        <strong>{formatVnd(total)}</strong>
      </div>

      <button
        type="button"
        className="checkout-btn"
        disabled={loading}
        onClick={handleCheckout}
      >
        Đặt hàng
      </button>
    </div>
  );
}
