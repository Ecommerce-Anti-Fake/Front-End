import { QrCode, ShieldCheck, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addToCart } from "../../services/cart.api";
import { fetchBuyNowPreview } from "../../services/product.api";
import { toast } from "sonner";
import { useCartStore } from "../../store/cartStore";
import { useGlobalLoadingStore } from "../../store/globalLoadingStore";
import { formatVnd } from "../../ultil/currency";

type ProductInfoData = {
  id: string | number;
  title: string;
  price: number;
  currency?: string;
  salesMode?: string;
  minWholesaleQty?: number;
  soldQuantity?: number;
  productModelName?: string;
  availableQuantity: number;
  selectedVariantId?: string | number;
  variantId?: string | number;
  optionGroups?: Array<{
    id: string;
    displayName: string;
    values: Array<{
      id: string;
      text: string;
      mediaAsset: { id: string; secureUrl: string } | null;
    }>;
  }>;
  variants?: Array<{
    id: string | number;
    sku?: string | null;
    price?: number | null;
    priceOverride?: number | null;
    availableQuantity: number;
    isActive: boolean;
    optionValueIds?: string[];
    mediaAsset?: { id: string; secureUrl: string } | null;
  }>;
};

export default function ProductInfo({ product }: { product: ProductInfoData }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceLiveSessionId = searchParams.get("live") || undefined;
  const minQuantity =
    product.salesMode === "WHOLESALE" ? (product.minWholesaleQty ?? 1) : 1;
  const [quantity, setQuantity] = useState(minQuantity);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [buyLoading, setBuyLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const showLoading = useGlobalLoadingStore((state) => state.showLoading);
  const hideLoading = useGlobalLoadingStore((state) => state.hideLoading);
  const refreshCart = useCartStore((state) => state.refreshCart);
  const optionGroups = product.optionGroups ?? [];
  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;
  const selectedOptionValueIds = optionGroups
    .map((group) => selectedOptions[group.id])
    .filter(Boolean);
  const selectedVariant = useMemo(() => {
    if (!hasVariants || selectedOptionValueIds.length !== optionGroups.length) {
      return undefined;
    }

    return variants.find(
      (variant) =>
        (variant.optionValueIds ?? []).length === selectedOptionValueIds.length &&
        selectedOptionValueIds.every((id) =>
          (variant.optionValueIds ?? []).includes(id),
        ),
    );
  }, [hasVariants, optionGroups.length, selectedOptionValueIds, variants]);
  const displayPrice =
    selectedVariant?.priceOverride ?? selectedVariant?.price ?? product.price;
  const availableQuantity = hasVariants
    ? selectedVariant?.availableQuantity ?? 0
    : product.availableQuantity;
  const canPurchase =
    !hasVariants ||
    Boolean(
      selectedVariant &&
        selectedVariant.isActive &&
        selectedVariant.availableQuantity > 0,
    );

  const isOptionValueDisabled = (groupId: string, valueId: string) => {
    if (!hasVariants) return false;
    const nextSelected = { ...selectedOptions, [groupId]: valueId };
    const selectedIds = optionGroups
      .map((group) => nextSelected[group.id])
      .filter(Boolean);

    return !variants.some(
      (variant) =>
        variant.isActive &&
        variant.availableQuantity > 0 &&
        selectedIds.every((id) => (variant.optionValueIds ?? []).includes(id)),
    );
  };

  const selectOptionValue = (groupId: string, valueId: string) => {
    setSelectedOptions((current) => ({ ...current, [groupId]: valueId }));
    setQuantity(minQuantity);
  };

  const handleAddToCart = async () => {
    try {
      setCartLoading(true);
      showLoading("Đang thêm vào giỏ hàng...");
      if (!canPurchase) {
        toast.error("Vui lòng chọn phân loại còn hàng");
        return;
      }

      const result = await addToCart(
        String(product.id),
        quantity,
        selectedVariant ? String(selectedVariant.id) : undefined,
        sourceLiveSessionId,
      );

      console.log(result);
      refreshCart();

      toast.success("Đã thêm vào giỏ hàng");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Thêm giỏ hàng thất bại",
      );
    } finally {
      setCartLoading(false);
      hideLoading();
    }
  };

  const handleBuyNow = async () => {
    try {
      setBuyLoading(true);
      showLoading("Đang chuẩn bị đơn hàng...");

      if (!canPurchase) {
        toast.error("Vui lòng chọn phân loại còn hàng");
        return;
      }

      const variantId =
        selectedVariant?.id ?? product.selectedVariantId ?? product.variantId;
      const preview = await fetchBuyNowPreview({
        offerId: String(product.id),
        variantId: variantId ? String(variantId) : undefined,
        quantity,
      }, { includeShipping: false });

      navigate("/checkout", {
        state: {
          source: "buy-now",
          buyNowSelection: {
            offerId: preview.offerId,
            variantId: preview.variantId,
            quantity: preview.quantity,
          },
          shippingOptions: preview.shippingOptions,
          shops: [
            {
              shopId: preview.shopId,
              shopName: preview.shopName,
              items: [
                {
                  id: preview.variantId ?? preview.offerId,
                  thumbnailUrl: preview.thumbnailUrl ?? "",
                  offerTitleSnapshot: preview.modelName,
                  unitPriceSnapshot: preview.price,
                  currencySnapshot: "VND",
                  quantity: preview.quantity,
                },
              ],
            },
          ],
        },
      });
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Khong the mua ngay",
      );
    } finally {
      setBuyLoading(false);
      hideLoading();
    }
  };

  return (
    <div className="pd-info">
      <h1>{product.title}</h1>

      <div className="pd-price">{formatVnd(displayPrice, product.currency)}</div>
      <div className="pd-info-row">
        <span>Đã bán:</span>
        <b className="pd-soldQuantity">{product.soldQuantity}</b>
      </div>

      <div className="pd-info-row">
        <span>Model:</span>
        <b className="pd-ModelName">{product.productModelName}</b>
      </div>

      <div className="pd-info-row">
        <span>Loại bán:</span>

        <span className="pd-badge">
          {product.salesMode === "WHOLESALE" ? "Bán sỉ" : "Bán lẻ"}
        </span>
      </div>

      {product.salesMode === "WHOLESALE" && (
        <div className="pd-info-row pd-min">
          <span>Mua tối thiểu:</span>

          <b>{product.minWholesaleQty}</b>
        </div>
      )}

      {optionGroups.length > 0 && (
        <div className="pd-options">
          {optionGroups.map((group) => (
            <div className="pd-option-group" key={group.id}>
              <span>{group.displayName}</span>
              <div className="pd-option-values">
                {group.values.map((value) => {
                  const disabled = isOptionValueDisabled(group.id, value.id);
                  return (
                    <button
                      key={value.id}
                      type="button"
                      className={`pd-option-value ${
                        selectedOptions[group.id] === value.id ? "active" : ""
                      }`}
                      disabled={disabled}
                      onClick={() => selectOptionValue(group.id, value.id)}
                    >
                      {value.mediaAsset?.secureUrl && (
                        <img src={value.mediaAsset.secureUrl} alt={value.text} />
                      )}
                      <span>{value.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {hasVariants && selectedOptionValueIds.length < optionGroups.length && (
            <small className="pd-option-warning">Vui lòng chọn phân loại</small>
          )}
          {hasVariants && selectedVariant?.availableQuantity === 0 && (
            <small className="pd-option-warning">Hết hàng</small>
          )}
        </div>
      )}

      <div className="pd-quantity-box">
        <span>Số lượng</span>

        <div className="pd-quantity-control">
          <button
            onClick={() =>
              setQuantity(Math.max(minQuantity, quantity - 1))
            }
          >
            -
          </button>

          <span>{quantity}</span>

          <button
            onClick={() =>
              setQuantity(Math.min(availableQuantity, quantity + 1))
            }
            disabled={!canPurchase}
          >
            +
          </button>
        </div>

        <b className="pd-availableQuantity">{availableQuantity}</b>
        <span>sản phẩm có sẵn</span>
      </div>

      <div className="pd-action-buttons">
        <button
          className="pd-cart-btn"
          disabled={cartLoading || buyLoading || !canPurchase}
          onClick={handleAddToCart}
        >
          <ShoppingCart size={20} /> Thêm vào giỏ hàng
        </button>

        <button
          className="pd-buy-btn"
          disabled={buyLoading || cartLoading || !canPurchase}
          onClick={handleBuyNow}
        >
          Mua ngay
        </button>
      </div>

      <div className="pd-verify-box">
        <div className="pd-verify-header">
          <div className="pd-verify-icon">
            <ShieldCheck size={26} />
          </div>

          <div className="pd-verify-content">
            <h3>Xác thực sản phẩm chính hãng</h3>
            <p>
              Kiểm tra nguồn gốc, chứng nhận và thông tin chống hàng giả của sản
              phẩm.
            </p>
          </div>
        </div>

        <div className="pd-verify-features">
          <div className="pd-verify-feature">✓ Kiểm tra nhanh chóng</div>

          <div className="pd-verify-feature">✓ Nguồn gốc rõ ràng</div>

          <div className="pd-verify-feature">✓ Chứng nhận AntiFake</div>
        </div>

        <button className="pd-verify-btn">
          <QrCode size={18} />
          Kiểm tra ngay
        </button>
      </div>
    </div>
  );
}
