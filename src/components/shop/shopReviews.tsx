import { useEffect, useState } from "react";
import { PackageOpen, Search } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import ProductCard from "../product/productCard";
import EmptyState from "../common/emptyState";
import "../../css/components/dataSkeleton.css";
import {
  fetchShopBestSellingProducts,
  type ShopBestSellingProduct,
} from "../../services/shop.api";
import type { ProductView } from "../../type/product";

const mapProductView = (product: ShopBestSellingProduct): ProductView => ({
  id: product.id,
  title: product.title,
  price: product.price,
  currency: product.currency || "VND",
  thumbnailUrl: product.thumbnailUrl || "",
  soldQuantity: product.soldQuantity ?? 0,
  categoryName: "",
  salesMode: product.salesMode === "WHOLESALE" ? "WHOLESALE" : "RETAIL",
  verificationLevel: product.verificationLevel || "",
  offerStatus: product.offerStatus || "",
  brandId: "",
  shopId: "",
});

export default function ShopReviews() {
  const { shopId } = useParams<{ shopId: string }>();
  const [products, setProducts] = useState<ShopBestSellingProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!shopId) return;

    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchShopBestSellingProducts(shopId, 12);
        setProducts(data);
      } catch (error) {
        console.error(error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [shopId]);

  return (
    <div className="shop-best-selling">
      <div className="shop-best-selling-header">
        <h3>Sản phẩm bán chạy</h3>
      </div>

      {loading && (
        <div className="shop-best-selling-state">
          <div className="data-skeleton data-skeleton-cards product-card-skeleton data-skeleton-compact" role="status" aria-label="Đang tải sản phẩm bán chạy">{Array.from({ length: 4 }, (_, i) => <div className="data-skeleton-row" key={i}><span className="data-skeleton-thumbnail" /><span className="data-skeleton-lines"><span /><span /><span /></span></div>)}</div>
        </div>
      )}

      {!loading && products.length === 0 && (
        <EmptyState
          icon={<PackageOpen size={32} />}
          title="Chưa có sản phẩm bán chạy"
          description="Shop chưa có đủ dữ liệu bán hàng để hiển thị danh sách nổi bật."
          className="shop-best-selling-empty"
          action={
            <Link to={shopId ? `/shop/${shopId}/products` : "/search"}>
              <Search size={18} />
              Xem sản phẩm của shop
            </Link>
          }
        />
      )}

      {!loading && products.length > 0 && (
        <div className="shop-best-selling-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={mapProductView(product)} />
          ))}
        </div>
      )}
    </div>
  );
}
