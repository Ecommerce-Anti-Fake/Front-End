import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";

import "../../css/pages/checkout.css";

import { useLocation } from "react-router-dom";
import type {
  BuyNowSelection,
  CheckoutShop,
  CheckoutSource,
  ShippingOption,
} from "../../type/checkout";
import CheckoutAddress from "../../components/checkout/checkoutAddress";
import CheckoutPayment from "../../components/checkout/checkoutPayment";
import CheckoutSummary from "../../components/checkout/checkoutSummary";
import CheckoutProducts from "../../components/checkout/checkoutProducts";
import CheckoutShipping from "../../components/checkout/checkoutShipping";
import ContextualHelpLink from "../../components/help/contextualHelpLink";
import { fetchShippingOptions, quoteCartCheckout } from "../../services/cart.api";
import { fetchBuyNowPreview, quoteBuyNowCheckout } from "../../services/product.api";
import type { Address } from "../../type/address";

export default function CheckoutPage() {
  const [payment, setPayment] = useState("bank");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingCode, setSelectedShippingCode] = useState("");
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [shippingAddressKey, setShippingAddressKey] = useState("");
  const [systemVoucherCode, setSystemVoucherCode] = useState("");
  const [shopVoucherCodes, setShopVoucherCodes] = useState<Record<string, string>>({});
  const [quote, setQuote] = useState<{ discountAmount: number; buyerPayableAmount: number } | null>(null);
  const [quoteStatus, setQuoteStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [quoteError, setQuoteError] = useState("");
  const location = useLocation();
  const source: CheckoutSource =
    location.state?.source === "buy-now" ? "buy-now" : "cart";
  const buyNowSelection = location.state?.buyNowSelection as
    | BuyNowSelection
    | undefined;
  const shops: CheckoutShop[] = useMemo(
    () => location.state?.shops ?? [],
    [location.state],
  );

  const cartItemIds = useMemo(
    () => shops.flatMap((shop) => shop.items).map((item) => item.id),
    [shops],
  );

  const handleAddressChange = (address?: Address) => {
    setShippingAddressKey(
      address ? `${address.id}-${address.wardCode ?? ""}` : "",
    );
  };

  useEffect(() => {
    if (source === "buy-now") {
      return;
    }

    if (cartItemIds.length === 0 || !shippingAddressKey) {
      queueMicrotask(() => {
        setShippingOptions([]);
        setSelectedShippingCode("");
      });
      return;
    }

    const loadShippingOptions = async () => {
      try {
        setShippingLoading(true);
        setShippingError("");

        const data = await fetchShippingOptions({ cartItemIds });

        setShippingOptions(data.options);
        setSelectedShippingCode((current) => {
          if (data.options.some((option) => option.optionCode === current)) {
            return current;
          }

          return data.options[0]?.optionCode ?? "";
        });
      } catch (error) {
        console.error(error);
        setShippingOptions([]);
        setSelectedShippingCode("");
        setShippingError(
          error instanceof Error
            ? error.message
            : "Không thể lấy phương thức vận chuyển",
        );
      } finally {
        setShippingLoading(false);
      }
    };

    loadShippingOptions();
  }, [source, cartItemIds, shippingAddressKey]);

  useEffect(() => {
    if (source !== "buy-now" || !buyNowSelection) {
      return;
    }

    let cancelled = false;
    if (!shippingAddressKey) {
      queueMicrotask(() => {
        if (cancelled) return;
        setShippingOptions([]);
        setSelectedShippingCode("");
        setShippingError("");
        setShippingLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    const loadBuyNowShippingOptions = async () => {
      try {
        setShippingLoading(true);
        setShippingError("");

        const options = (
          await fetchBuyNowPreview(buyNowSelection, { includeShipping: true })
        ).shippingOptions;

        if (cancelled) return;

        setShippingOptions(options);
        setSelectedShippingCode((current) =>
          options.some((option) => option.optionCode === current)
            ? current
            : (options[0]?.optionCode ?? ""),
        );
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setShippingOptions([]);
        setSelectedShippingCode("");
        setShippingError(
          error instanceof Error
            ? error.message
            : "KhÃ´ng thá»ƒ láº¥y phÆ°Æ¡ng thá»©c váº­n chuyá»ƒn",
        );
      } finally {
        if (!cancelled) setShippingLoading(false);
      }
    };

    void loadBuyNowShippingOptions();
    return () => {
      cancelled = true;
    };
  }, [source, buyNowSelection, shippingAddressKey]);

  const subtotal = shops
    .flatMap((shop) => shop.items)
    .reduce((sum, item) => sum + item.unitPriceSnapshot * item.quantity, 0);

  const selectedShipping = shippingOptions.find(
    (option) => option.optionCode === selectedShippingCode,
  );

  const shippingFee = selectedShipping?.shippingFee ?? 0;

  useEffect(() => {
    if (!selectedShippingCode || (source === "cart" && cartItemIds.length === 0) || (source === "buy-now" && !buyNowSelection)) {
      // Quote state must be cleared before the next request so stale totals can never be submitted.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuote(null);
      setQuoteStatus("idle");
      setQuoteError("");
      return;
    }

    let cancelled = false;
    setQuote(null);
    setQuoteStatus("loading");
    setQuoteError("");

    const loadQuote = async () => {
      try {
        const result = source === "buy-now" && buyNowSelection
          ? await quoteBuyNowCheckout({
              ...buyNowSelection,
              paymentMethod: "PAYOS",
              shippingOptionCode: selectedShippingCode,
              systemVoucherCode: systemVoucherCode.trim() || undefined,
              shopVoucherCode: Object.values(shopVoucherCodes)[0]?.trim() || undefined,
            })
          : await quoteCartCheckout({
              cartItemIds,
              shippingOptionCode: selectedShippingCode,
              systemVoucherCode: systemVoucherCode.trim() || undefined,
              shopVouchers: Object.entries(shopVoucherCodes)
                .filter(([, code]) => code.trim())
                .map(([shopId, voucherCode]) => ({ shopId, voucherCode: voucherCode.trim() })),
            });
        if (!cancelled) {
          setQuote(result);
          setQuoteStatus("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setQuote(null);
          setQuoteStatus("error");
          setQuoteError(error instanceof Error ? error.message : "Không thể tính tổng tiền đơn hàng");
        }
      }
    };
    void loadQuote();
    return () => {
      cancelled = true;
    };
  }, [source, buyNowSelection, cartItemIds, selectedShippingCode, shippingAddressKey, systemVoucherCode, shopVoucherCodes]);

  const discount = quote?.discountAmount ?? 0;
  const total = quote?.buyerPayableAmount ?? null;

  return (
    <div className="checkout-page">
      <div className="checkout-left">
        <ContextualHelpLink to="/help/buyer/first-purchase/checkout">Hướng dẫn đặt hàng</ContextualHelpLink>
        {/* ADDRESS */}
        <CheckoutAddress onAddressChange={handleAddressChange} />

        {/* PRODUCTS */}
        <CheckoutProducts shops={shops} />

        {/* SHIPPING */}
        <CheckoutShipping
          error={shippingError}
          loading={shippingLoading}
          options={shippingOptions}
          selectedOptionCode={selectedShippingCode}
          setSelectedOptionCode={setSelectedShippingCode}
        />

        {/* PAYMENT */}
        <CheckoutPayment payment={payment} setPayment={setPayment} />
      </div>

      {/* SUMMARY */}
      <div className="checkout-right">
        <CheckoutSummary
          source={source}
          buyNowSelection={buyNowSelection}
          cartItemIds={cartItemIds}
          payment={payment}
          shippingOptionCode={selectedShippingCode}
          subtotal={subtotal}
          shippingFee={shippingFee}
          discount={discount}
          total={total}
          hasShippingAddress={Boolean(shippingAddressKey)}
          quoteStatus={quoteStatus}
          quoteError={quoteError}
          shops={shops}
          systemVoucherCode={systemVoucherCode}
          setSystemVoucherCode={setSystemVoucherCode}
          shopVoucherCodes={shopVoucherCodes}
          setShopVoucherCodes={setShopVoucherCodes}
        />

        <div className="security-box">
          <ShieldCheck size={18} />
          Giao dịch được bảo mật
        </div>
      </div>
    </div>
  );
}
