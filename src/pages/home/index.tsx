import { useEffect, useState } from "react";
import BannerSlider from "../../components/home/bannerSlider";
import FeaturedCategories from "../../components/home/featuredCategories";
import FlashSale from "../../components/home/flashSale";
import Footer from "../../components/layout/footer";
import LiveShopCard from "../../components/live/liveShopCard";
import ProductCard from "../../components/product/productCard";
import ShopCard from "../../components/shop/shopCard";
import "../../css/components/dataSkeleton.css";
import "../../css/pages/home.css";
import {
  listLiveSessions,
  type LiveSession,
} from "../../services/live.api";
import { fetchOffers } from "../../services/product.api";
import { fetchShops } from "../../services/shop.api";
import type { ProductView } from "../../type/product";
import type { shopCard } from "../../type/shop";

export default function HomePage() {
  const [products, setProducts] = useState<ProductView[]>([]);
  const [shops, setShops] = useState<shopCard[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [liveLoading, setLiveLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    let active = true;
    void fetchOffers(page, pageSize)
      .then((data) => {
        if (!active) return;
        setProducts((current) => {
          const existingIds = new Set(current.map((product) => product.id));
          const newItems = ((data.items as ProductView[]) || []).filter(
            (item) => !existingIds.has(item.id),
          );
          return [...current, ...newItems];
        });
      })
      .catch((error) => console.error("Load products error:", error))
      .finally(() => active && setProductsLoading(false));
    return () => {
      active = false;
    };
  }, [page]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetchShops(1, 5),
      listLiveSessions({ filter: "all" }),
    ])
      .then(([shopResult, liveItems]) => {
        if (!active) return;
        setShops(shopResult.items || []);
        setLiveSessions(liveItems.slice(0, 6));
      })
      .catch((error) => console.error("Load home data error:", error))
      .finally(() => {
        if (active) {
          setShopsLoading(false);
          setLiveLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="home-container">
      <div className="home-layout">
        <FeaturedCategories />
        <BannerSlider />
      </div>
      <div className="home-flash-sale">
        <FlashSale products={products} />
      </div>

      <div className="home-content">
        <section className="home-shop-card">
          <h2>Cửa hàng uy tín</h2>
          <div className="shop-list">
            {shopsLoading ? (
              <CompactSkeleton count={5} label="Đang tải cửa hàng" />
            ) : (
              shops.map((shop) => (
                <ShopCard key={shop.shopId} shop={shop} />
              ))
            )}
          </div>
        </section>

        <section className="live-section">
          <h2>Livestream</h2>
          {liveLoading ? (
            <CompactSkeleton count={3} label="Đang tải livestream" />
          ) : liveSessions.length ? (
            <div className="live-grid">
              {liveSessions.map((session) => (
                <LiveShopCard key={session.id} live={session} />
              ))}
            </div>
          ) : (
            <p>Chưa có livestream.</p>
          )}
        </section>
      </div>

      <section className="home-product">
        <div className="product-grid">
          {productsLoading && products.length === 0 ? (
            <div
              className="data-skeleton data-skeleton-cards product-card-skeleton home-product-skeleton"
              aria-busy="true"
              aria-label="Đang tải sản phẩm"
            >
              {Array.from({ length: 12 }, (_, index) => (
                <div className="data-skeleton-row" key={index}>
                  <span className="data-skeleton-thumbnail" />
                  <span className="data-skeleton-lines">
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
        <div className="load-more-wrapper">
          <button
            className="load-more-btn"
            onClick={() => setPage((current) => current + 1)}
          >
            Xem thêm sản phẩm
          </button>
        </div>
      </section>
      <Footer />
    </div>
  );
}

function CompactSkeleton({
  count,
  label,
}: {
  count: number;
  label: string;
}) {
  return (
    <div
      className="data-skeleton data-skeleton-compact home-shop-skeleton"
      aria-busy="true"
      aria-label={label}
    >
      {Array.from({ length: count }, (_, index) => (
        <div className="data-skeleton-row" key={index}>
          <span className="data-skeleton-thumbnail" />
          <span className="data-skeleton-lines">
            <span />
            <span />
            <span />
          </span>
        </div>
      ))}
    </div>
  );
}
