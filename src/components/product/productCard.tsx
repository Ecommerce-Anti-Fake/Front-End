import "../../css/components/product/productCard.css";
import { BadgeCheck, Package } from "lucide-react";
import type { ProductView } from "../../type/product";
import { formatVnd } from "../../ultil/currency";
import { formatSale } from "../../ultil/format";
import { Link } from "react-router-dom";
import MediaThumbnail from "../media/mediaThumbnail";

type Props = {
  product: ProductView;
  loading?: "lazy" | "eager";
};

export default function ProductCard({ product, loading = "lazy" }: Props) {
  return (
    <Link to={`/product/${product.id}`} className="product-card-link">
      <div className="product-card">
        <div className="product-image-wrapper">
          <MediaThumbnail
            src={product.thumbnailUrl || "https://picsum.photos/600/400?random=1"}
            alt={product.title}
            className="product-image"
            width={320}
            height={320}
            loading={loading}
          />

          {/* <span className="product-status">
            {product.salesMode === "WHOLESALE" ? "Bán sỉ" : "Bán lẻ"}
          </span> */}
        </div>

        <div className="product-content">
          {/* <span className="product-category">{product.categoryName}</span> */}

          <h3 className="product-title">{product.title}</h3>

          <div className="product-price">
            {formatVnd(product.price, product.currency)}
          </div>

          <div className="product-meta">
            <span>
              <Package size={14} />
              Đã bán {formatSale(product.soldQuantity)}
            </span>

            {product.verificationLevel === "verified" && (
              <span className="verified">
                <BadgeCheck size={14} />
                Đã xác minh
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
