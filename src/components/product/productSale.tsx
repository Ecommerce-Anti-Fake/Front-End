import type { Product } from "../../type/product";
import "../../css/components/product/productSale.css";
import { formatVnd } from "../../ultil/currency";
import MediaThumbnail from "../media/mediaThumbnail";

type Props = {
  product: Product;
  loading?: "lazy" | "eager";
};

export default function ProductSell({ product, loading = "lazy" }: Props) {
  const totalQuantity = product.soldQuantity + product.availableQuantity;
  const soldPercent = totalQuantity > 0
    ? Math.min(100, Math.round((product.soldQuantity / totalQuantity) * 100))
    : 0;

  return (
    <div className="flash-card">
      {product.oldPrice && product.oldPrice > product.price ? (
        <div className="discount-tag">
          -{Math.round((1 - product.price / product.oldPrice) * 100)}%
        </div>
      ) : null}

      <MediaThumbnail
        src={product.image}
        alt={product.name}
        width={320}
        height={320}
        loading={loading}
      />
      <h4>{product.name}</h4>
      <div className="price">{formatVnd(product.price)}</div>
      {product.oldPrice && product.oldPrice > product.price ? (
        <div className="old-price">{formatVnd(product.oldPrice)}</div>
      ) : null}

      <div className="sold-bar">
        <div className="sold-progress" style={{ width: `${soldPercent}%` }} />
      </div>
      <div className="sold-text">Đã bán {product.soldQuantity}</div>
    </div>
  );
}
