import { useEffect, useState } from "react";
import { SearchX } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import SearchSidebar from "../../components/layout/searchSidebar";
import "../../css/pages/search.css";
import SearchHeader from "../../components/layout/searchHeader";
import { searchOffers } from "../../services/product.api";
import "../../css/components/dataSkeleton.css";
import ProductCard from "../../components/product/productCard";
import { fetchCategories } from "../../services/category.api";
import type { SearchCategory } from "../../components/layout/searchSidebar";
import EmptyState from "../../components/common/emptyState";
import type { ProductView } from "../../type/product";

type SearchProduct = ProductView & { createdAt?: string };

function normalizeList<T>(data: unknown): T[] {
  const payload =
    typeof data === "object" && data !== null
      ? ((data as { data?: unknown; items?: unknown }).data ??
        (data as { items?: unknown }).items ??
        data)
      : data;
  return Array.isArray(payload) ? (payload as T[]) : [];
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [categories, setCategories] = useState<SearchCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const keyword = searchParams.get("q") || "";
  const categoryId = searchParams.get("categoryId");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const [sortType, setSortType] = useState("all");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(normalizeList<SearchCategory>(data));
      } catch (error) {
        console.error(error);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);

        const data = await searchOffers({
          q: keyword || undefined,
          categoryId: categoryId || undefined,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          page: 1,
          pageSize: 20,
        });

        setProducts(normalizeList<SearchProduct>(data));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [keyword, categoryId, minPrice, maxPrice]);

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
    <div className="search-page">
      <div className="s-sidebar-page">
        <SearchSidebar categories={categories} />
      </div>

      <div className="search-content">
        <div className="search-header-page">
          <SearchHeader
            sortType={sortType}
            setSortType={setSortType}
            categories={categories}
          />
        </div>
        <div className="s-product-grid">
          {loading && <div className="data-skeleton data-skeleton-cards product-card-skeleton search-product-skeleton" role="status" aria-label="Đang tải kết quả tìm kiếm">{Array.from({ length: 10 }, (_, i) => <div className="data-skeleton-row" key={i}><span className="data-skeleton-thumbnail" /><span className="data-skeleton-lines"><span /><span /><span /></span></div>)}</div>}

          {!loading && sortedProducts.length === 0 && (
            <EmptyState
              icon={<SearchX size={32} />}
              title="Không tìm thấy sản phẩm"
              description="Hãy thử từ khóa khác hoặc thay đổi bộ lọc tìm kiếm."
              className="empty-search"
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
