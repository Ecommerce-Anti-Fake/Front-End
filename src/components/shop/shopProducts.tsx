import { useEffect, useState } from "react";
import { SearchX } from "lucide-react";
import { useParams, useSearchParams } from "react-router-dom";
import SearchHeader from "../layout/searchHeader";
import SearchSidebar, { type SearchCategory } from "../layout/searchSidebar";
import ProductCard from "../product/productCard";
import "../../css/components/dataSkeleton.css";
import EmptyState from "../common/emptyState";
import { searchOffers } from "../../services/product.api";
import { fetchShopCategories } from "../../services/shop.api";
import "../../css/components/shop/shopProduct.css";
import type { ProductView } from "../../type/product";

type ShopProduct = ProductView & { createdAt?: string };

const normalizeList = (data: unknown): ShopProduct[] => {
  const payload =
    typeof data === "object" && data !== null
      ? ((data as { data?: unknown; items?: unknown }).data ??
        (data as { items?: unknown }).items ??
        data)
      : data;
  return Array.isArray(payload) ? (payload as ShopProduct[]) : [];
};

export default function ShopProducts() {
  const { shopId } = useParams<{ shopId: string }>();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<SearchCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortType, setSortType] = useState("all");

  const keyword = searchParams.get("q") || "";
  const categoryId = searchParams.get("categoryId");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const basePath = shopId ? `/shop/${shopId}/products` : "/search";

  useEffect(() => {
    if (!shopId) return;

    const loadCategories = async () => {
      try {
        const data = await fetchShopCategories(shopId);
        setCategories(data);
      } catch (error) {
        console.error(error);
      }
    };

    loadCategories();
  }, [shopId]);

  useEffect(() => {
    if (!shopId) return;

    const loadProducts = async () => {
      try {
        setLoading(true);

        const data = await searchOffers({
          shopId,
          q: keyword || undefined,
          categoryId: categoryId || undefined,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          page: 1,
          pageSize: 20,
        });

        setProducts(normalizeList(data));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [shopId, keyword, categoryId, minPrice, maxPrice]);

  const sortedProducts = [...products];

  switch (sortType) {
    case "priceAsc":
      sortedProducts.sort((a, b) => a.price - b.price);
      break;
    case "priceDesc":
      sortedProducts.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      sortedProducts.sort(
        (a, b) =>
          new Date(b.createdAt ?? "").getTime() -
          new Date(a.createdAt ?? "").getTime(),
      );
      break;
    case "bestSelling":
      sortedProducts.sort((a, b) => b.soldQuantity - a.soldQuantity);
      break;
  }

  return (
    <div className="shop-products-page">
      <div className="shop-products-sidebar">
        <SearchSidebar categories={categories} basePath={basePath} />
      </div>

      <div className="shop-products-content">
        <div className="shop-products-content-search-header">
          <SearchHeader
            sortType={sortType}
            setSortType={setSortType}
            categories={categories}
            basePath={basePath}
          />
        </div>
        <div className="shop-products-grid">
          {loading && <div className="data-skeleton data-skeleton-cards product-card-skeleton shop-product-skeleton" role="status" aria-label="Đang tải sản phẩm của shop">{Array.from({ length: 10 }, (_, i) => <div className="data-skeleton-row" key={i}><span className="data-skeleton-thumbnail" /><span className="data-skeleton-lines"><span /><span /><span /></span></div>)}</div>}

          {!loading && sortedProducts.length === 0 && (
            <EmptyState
              icon={<SearchX size={32} />}
              title="Không tìm thấy sản phẩm"
              description="Hãy thử thay đổi danh mục, từ khóa hoặc khoảng giá."
              className="shop-products-empty"
            />
          )}

          {!loading &&
            sortedProducts.length > 0 &&
            sortedProducts.map((product, index) => (
              <div key={product.id}>
                <ProductCard
                  product={product}
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
