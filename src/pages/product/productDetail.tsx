import { useEffect, useState } from "react";
import ProductInfo from "../../components/product/productInfo";
import ProductSpecification from "../../components/product/productSpecification";
import "../../css/pages/productDetail.css";
import Review from "../../components/product/review";
import ShopCard from "../../components/shop/shopCard";
import { MessageCircle, Star, Store } from "lucide-react";
import { fetchOfferDetail, type OfferDetail } from "../../services/product.api";
import { useNavigate, useParams } from "react-router-dom";
import { fetchShopByOffer } from "../../services/shop.api";
import "../../css/components/dataSkeleton.css";
import ProductGallery from "../../components/product/productGallery";
import { fetchOfferReviews } from "../../services/review.api";
import { getShopChatThread } from "../../services/chat.api";
import ProductCard from "../../components/product/productCard";
import { searchOffers } from "../../services/product.api";
import type { ProductView } from "../../type/product";
import type { shopCard } from "../../type/shop";
import { useGlobalLoadingStore } from "../../store/globalLoadingStore";

type ReviewItem = {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
  media: string[];
};

type ProductDetailData = Omit<OfferDetail, "price" | "availableQuantity" | "imageUrls"> & {
  price: number;
  availableQuantity: number;
  imageUrls: string[];
  salesMode?: string;
  minWholesaleQty?: number;
  selectedVariantId?: string;
  variantId?: string;
  shopId?: string;
  shop?: { shopId?: string; id?: string };
};

type ProductShop = shopCard & { id?: string };

const getChatErrorMessage = (error: unknown): string => {
  if (error && typeof error === "object") {
    const record = error as { response?: unknown; message?: unknown };
    if (record.response && typeof record.response === "object") {
      const response = record.response as { data?: unknown };
      if (response.data && typeof response.data === "object") {
        const data = response.data as { message?: unknown };
        if (typeof data.message === "string") return data.message;
      }
    }
    if (typeof record.message === "string") return record.message;
  }

  return "Đã xảy ra lỗi khi tạo cuộc trò chuyện";
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showLoading = useGlobalLoadingStore((state) => state.showLoading);
  const hideLoading = useGlobalLoadingStore((state) => state.hideLoading);
  const [activeTab, setActiveTab] = useState("description");
  const [product, setProduct] = useState<ProductDetailData>();
  const [shop, setShop] = useState<ProductShop>();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReview, setTotalReview] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<ProductView[]>([]);
  const shopId =
    shop?.shopId ||
    shop?.id ||
    product?.shopId ||
    product?.shop?.shopId ||
    product?.shop?.id ||
    "";


  useEffect(() => {
    if (!id) return;

    const loadProduct = async () => {
      try {
        const data = await fetchOfferDetail(id);
        setProduct({
          ...data,
          price: data.price ?? 0,
          availableQuantity: data.availableQuantity ?? 0,
          imageUrls: data.imageUrls ?? [],
        });
      } catch (error) {
        console.error(error);
      }
    };

    const loadShop = async () => {
      try {
        const shop = await fetchShopByOffer(id) as ProductShop;
        setShop(shop);
      } catch (error) {
        console.error(error);
      }
    };

    const loadReviews = async () => {
      try {
        setLoadingReviews(true);

        const data = await fetchOfferReviews(id);

        setReviews(data.items || []);
        setAverageRating(data.averageRating || 0);
        setTotalReview(data.total || 0);
      } catch (error) {
        console.error(error);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    loadShop();
    loadReviews();
    loadProduct();
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!product?.categoryId || !product?.id) {
      return;
    }

    const loadRelatedProducts = async () => {
      try {
        const data = await searchOffers({
          categoryId: product.categoryId,
          page: 1,
          pageSize: 9,
        });
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data.items)
            ? data.items
            : [];

        setRelatedProducts(
          items
            .filter((item: ProductView) => item.id !== product.id)
            .slice(0, 8),
        );
      } catch (error) {
        console.error(error);
        setRelatedProducts([]);
      }
    };

    loadRelatedProducts();
  }, [product?.categoryId, product?.id]);

  const getOrCreateChatThread = async (targetShopId: string) => {
    if (!targetShopId) {
      console.error("Missing shopId when creating chat thread", shop);
      return;
    }

    try {

      showLoading("Đang mở cuộc trò chuyện...");
      const response = await getShopChatThread(targetShopId);

      if (!response?.success || !response?.threadId) {
        throw new Error("Không thể tạo cuộc trò chuyện");
      }

      navigate(`/chat/${response.threadId}`);

      return;
    } catch (error: unknown) {
      console.error("Lỗi tạo chat thread:", error);
      throw new Error(getChatErrorMessage(error), { cause: error });
    } finally {
      hideLoading();
    }
  };

  if (!product) {
    return (
      <div>
        <div className="data-skeleton data-skeleton-detail" role="status" aria-label="Đang tải chi tiết sản phẩm"><div className="data-skeleton-detail-hero"><span /><div><span /><span /><span /></div></div><div className="data-skeleton-detail-grid">{Array.from({ length: 6 }, (_, i) => <span key={i} />)}</div></div>
      </div>
    );
  }

  const visibleRelatedProducts = product.categoryId && product.id
    ? relatedProducts
    : [];

  return (
    <div className="product-detail-page">
      <div className="pd-top">
        <ProductGallery images={product.imageUrls} />

        <ProductInfo product={product} />
      </div>

      <div className="pd-shop-box">
        <div className="pd-shop-left">
          {shop && <ShopCard shop={shop} />}
        </div>

        <div className="pd-shop-right">
          <button
            className="pd-chat-btn"
            disabled={!shopId}
            onClick={() => getOrCreateChatThread(shopId)}
          >
            <MessageCircle size={18} />
            <span>Nhắn tin</span>
          </button>

          <button className="pd-view-shop-btn" disabled={!shopId} onClick={() => navigate(`/shop/${shopId}`)}>
            <Store size={18} />
            <span>Xem Shop</span>
          </button>
        </div>
      </div>

      <div className="pd-content">
        <div>
          <div className="pd-tabs-header">
            <button
              className={`pd-tab ${activeTab === "description" ? "active" : ""}`}
              onClick={() => setActiveTab("description")}
            >
              Mô tả sản phẩm
            </button>

            <button
              className={`pd-tab ${activeTab === "review" ? "active" : ""}`}
              onClick={() => setActiveTab("review")}
            >
              Đánh giá ({totalReview}){averageRating.toFixed(1)}
              <Star size={14} style={{ margin: "0 4px" }} />
            </button>
          </div>
          <div className="pd-tabs-content">
            {activeTab === "description" && (
              <div className="pd-description">
                <h2>Mô tả sản phẩm</h2>
                <p>Tên đầy đủ sản phẩm: {product.title}</p>
                <p>{product.description}</p>
              </div>
            )}

            {activeTab === "review" && (
              <Review reviews={reviews} loading={loadingReviews} />
            )}
          </div>
        </div>
        <ProductSpecification product={product} />
      </div>


      {visibleRelatedProducts.length > 0 && (
        <section className="pd-related-section">
          <div className="pd-related-header">
            <h2>Có thể bạn sẽ thích</h2>
          </div>

          <div className="pd-related-grid">
            {visibleRelatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
