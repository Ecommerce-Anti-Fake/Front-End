import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ProductTable from "../../../../components/productManagement/productTable";
import "../../../../css/pages/productManagement.css";
import ProductCard from "../../../../components/productManagement/productCard";
import CreateProduct from "../../../../components/productManagement/createProduct";
import {
  type FetchShopOffersParams,
  fetchShopCategories,
  fetchShopOffers,
  getMyShop,
  type ShopCategory,
  type ShopOffer,
} from "../../../../services/shop.api";
import { formatVnd } from "../../../../ultil/currency";
import ContextualHelpLink from "../../../../components/help/contextualHelpLink";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  categoryId: string;
  price: string;
  stock: number;
  status: string;
  image: string;
};

type ProductTab =
  | "all"
  | "active"
  | "low"
  | "review"
  | "failed"
  | "disabled";

const PAGE_SIZE = 100;
const LOW_STOCK_THRESHOLD = 10;

const getOfferQueryByTab = (tab: ProductTab): FetchShopOffersParams => {
  switch (tab) {
    case "active":
    case "low":
      return { offerStatus: "active", moderationStatus: "approved" };
    case "review":
      return { offerStatus: "active", moderationStatus: "pending" };
    case "failed":
      return { offerStatus: "active", moderationStatus: "rejected" };
    case "disabled":
      return { offerStatus: "inactive", moderationStatus: "approved" };
    default:
      return {};
  }
};

const normalizeMyShop = (data: unknown) => {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const payload = record.data ?? record.items ?? data;

  if (Array.isArray(payload)) return payload[0] ?? null;
  return payload && typeof payload === "object"
    ? (payload as Record<string, unknown>)
    : null;
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const formatCurrency = (value?: number, currency = "VND") =>
  typeof value === "number" ? formatVnd(value, currency) : "";

const normalizeStatus = (offer: ShopOffer) => {
  const offerStatus = offer.offerStatus?.toLowerCase() || "active";
  const moderationStatus = offer.moderationStatus?.toLowerCase();
  const stock = offer.availableQuantity ?? 0;

  if (moderationStatus === "pending") return "review";
  if (moderationStatus === "rejected" || moderationStatus === "banned") {
    return "failed";
  }
  if (offerStatus === "inactive") return "disabled";
  if (offerStatus === "active" && stock > 0 && stock <= LOW_STOCK_THRESHOLD) {
    return "low";
  }

  return offerStatus;
};

const mapOfferToProduct = (
  offer: ShopOffer,
  categories: ShopCategory[],
): Product => {
  const categoryId = offer.categoryId || "";
  const category = categories.find(
    (item) => String(item.id) === String(categoryId),
  );

  return {
    id: offer.id,
    name: offer.title,
    sku: offer.id,
    category: offer.categoryName || category?.name || "Chua phan loai",
    categoryId,
    price: formatCurrency(offer.price, offer.currency || "VND"),
    stock: offer.availableQuantity ?? 0,
    status: normalizeStatus(offer),
    image: offer.thumbnailUrl || "/vite.svg",
  };
};

function ProductLoading() {
  return (
    <div
      className="seller-product-loading"
      role="status"
      aria-live="polite"
      aria-label="Dang tai san pham"
    >
      <div className="seller-product-loading-list" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="seller-product-loading-row" key={index}>
            <span />
            <span />
            <span />
            <span />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductManagement() {
  const [activeTab, setActiveTab] = useState<ProductTab>("all");
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [openCreateProduct, setOpenCreateProduct] = useState(false);
  const [shopId, setShopId] = useState("");
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createVersion, setCreateVersion] = useState(0);

  useEffect(() => {
    const loadShop = async () => {
      try {
        const shopData = await getMyShop();
        const shop = normalizeMyShop(shopData);
        const nextShopId = shop?.shopId || shop?.id;

        if (!nextShopId) {
          setError("Khong tim thay cua hang cua ban");
          setLoading(false);
          return;
        }

        setShopId(String(nextShopId));
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Khong the tai thong tin cua hang"));
        setLoading(false);
      }
    };

    loadShop();
  }, []);

  useEffect(() => {
    if (!shopId) return;

    const loadProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const [categoryData, offerData] = await Promise.all([
          fetchShopCategories(shopId),
          fetchShopOffers(shopId, {
            ...getOfferQueryByTab(activeTab),
            page: 1,
            pageSize: PAGE_SIZE,
          }),
        ]);

        setCategories(categoryData);
        setProducts(
          offerData.items.map((offer) =>
            mapOfferToProduct(offer, categoryData),
          ),
        );
      } catch (err: unknown) {
        setCategories([]);
        setProducts([]);
        setError(getErrorMessage(err, "Khong the tai danh sach san pham"));
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [shopId, activeTab, createVersion]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const stockMatch =
        activeTab === "low" ? product.stock <= LOW_STOCK_THRESHOLD : true;

      const keyword = searchText.trim().toLowerCase();

      const searchMatch =
        keyword === "" ||
        product.name.toLowerCase().includes(keyword) ||
        product.sku.toLowerCase().includes(keyword);

      const categoryMatch =
        categoryFilter === "all"
          ? true
          : String(product.categoryId) === String(categoryFilter);

      return stockMatch && searchMatch && categoryMatch;
    });
  }, [products, activeTab, searchText, categoryFilter]);

  return (
    <div className="seller-product-page">
      <div className="seller-product-header">
        <div>
          <h2>Quản lý sản phẩm</h2>
          <p>Theo dõi, chỉnh sửa và quản lý sản phẩm của cửa hàng.</p>
          <ContextualHelpLink to="/help/seller/create-product">Cách đăng sản phẩm</ContextualHelpLink>
        </div>

        <button
          className="seller-product-add-btn"
          onClick={() => setOpenCreateProduct(true)}
        >
          <Plus size={18} />
          Thêm sản phẩm mới
        </button>
      </div>

      <div className="seller-product-filter">
        <div className="seller-product-tabs">
          <button
            className={`seller-product-tab ${
              activeTab === "all" ? "active" : ""
            }`}
            onClick={() => setActiveTab("all")}
          >
            Tất cả
          </button>

          <button
            className={`seller-product-tab ${
              activeTab === "active" ? "active" : ""
            }`}
            onClick={() => setActiveTab("active")}
          >
            Trên kệ 
          </button>

          <button
            className={`seller-product-tab ${
              activeTab === "low" ? "active" : ""
            }`}
            onClick={() => setActiveTab("low")}
          >
            Còn ít 
          </button>

          <button
            className={`seller-product-tab ${
              activeTab === "review" ? "active" : ""
            }`}
            onClick={() => setActiveTab("review")}
          >
            Đang xét duyệt 
          </button>

          <button
            className={`seller-product-tab ${
              activeTab === "failed" ? "active" : ""
            }`}
            onClick={() => setActiveTab("failed")}
          >
            Không thành công 
          </button>

          <button
            className={`seller-product-tab ${
              activeTab === "disabled" ? "active" : ""
            }`}
            onClick={() => setActiveTab("disabled")}
          >
            Đã vô hiệu hóa 
          </button>
        </div>
        <div className="seller-product-search-select">
          <div className="seller-product-search">
            <Search size={18} />

            <input
              placeholder="Tìm kiếm sản phẩm hoặc SKU..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Tất cả danh mục</option>

            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="seller-product-table-section">
        {loading ? (
          <ProductLoading />
        ) : error ? (
          <div className="seller-empty-product">{error}</div>
        ) : filteredProducts.length > 0 ? (
          <div>
            <div className="seller-product-management-destop">
              <ProductTable products={filteredProducts} />
            </div>
            <div className="seller-product-management-mobile">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        ) : (
          <div className="seller-empty-product">
            Không tìm thấy sản phẩm nào.
          </div>
        )}
      </div>
      {openCreateProduct && (
        <div
          className="create-product-overlay"
          role="presentation"
          onClick={() => setOpenCreateProduct(false)}
        >
          <div
            className="create-product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-product-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="create-product-header">
              <h2 id="create-product-title">Tạo sản phẩm mới</h2>

              <button
                type="button"
                aria-label="Dong form tao san pham"
                onClick={() => setOpenCreateProduct(false)}
              >
                x
              </button>
            </div>

            <div className="create-product-body">
              <CreateProduct
                onCancel={() => setOpenCreateProduct(false)}
                onCreated={() => setCreateVersion((current) => current + 1)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
