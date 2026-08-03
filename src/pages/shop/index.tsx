import { Outlet, useParams } from "react-router-dom";
import ShopTabs from "../../components/layout/shopTabs";
import ShopHeader from "../../components/shop/shopHeader";
import "../../css/components/shop/shop.css";
import { useEffect, useState } from "react";
import type { shopCard } from "../../type/shop";
import { getShopDetail } from "../../services/shop.api";

export default function ShopPage() {
  const { shopId } = useParams<{ shopId: string }>();

  const [shop, setShop] = useState<shopCard | null>(null);

  useEffect(() => {
    if (!shopId) return;

    const loadShop = async () => {
      try {
        const data = await getShopDetail(shopId);
        setShop(data);
      } catch (error) {
        console.error(error);
      }
    };

    loadShop();
  }, [shopId]);

  return (
    <div className="shop-page">
      <div className={`shop-banner ${shop?.shopBanner ? "" : "shop-banner-fallback"}`}>
        {shop?.shopBanner ? (
          <img src={shop.shopBanner} alt="" />
        ) : (
          <div className="shop-banner-fallback-content" aria-label="Banner shop chưa được thiết lập">
            AntiFake Marketplace
          </div>
        )}
      </div>

      {shop && <ShopHeader shop={shop} />}
      <div className="shop-main">
        <div className="shop-tabs-wrapper">
          <ShopTabs />
        </div>

        <div className="shop-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
