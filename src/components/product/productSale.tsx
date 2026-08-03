import type { Product } from "../../type/product";
import "../../css/components/product/productSale.css";
import { formatVnd } from "../../ultil/currency";

type Props = {
  product: Product;
};

export default function ProductSell({ product }: Props) {
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

      <img src={product.image} alt={product.name} />
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
