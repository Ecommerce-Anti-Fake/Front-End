import "../../css/components/shop/shopCard.css";
import { BadgeCheck, Package, Star } from "lucide-react";
import type { shopCard } from "../../type/shop";
import { formatSale } from "../../ultil/format";
import { useNavigate } from "react-router-dom";
import MediaThumbnail from "../media/mediaThumbnail";

type Props = {
  shop: shopCard;
};

export default function ShopCard({ shop }: Props) {
  const navigate = useNavigate();
  return (
    <div className="shop-card" >
      <div className="shop-info" onClick={() => navigate(`/shop/${shop.shopId}`)}>
        <MediaThumbnail
          src={shop?.shopAvatar || "https://i.pravatar.cc/100?img=3"}
          alt="shop"
          className="shop-avatar"
          width={160}
          height={160}
        />

        <div className="shop-content">
          <div className="shop-name-row">
            <h3>{shop?.shopName}</h3>
            {shop?.verify && (
              <BadgeCheck size={15} className="verify-icon" />
            )}
          </div>

          <div className="shop-meta">
            <span>
              <Star size={16} />
              {shop?.rating} ( {formatSale(shop?.totalReview)})
            </span>

            <span>
              <Package size={16} />
              {formatSale(shop?.totalSale)} sản phẩm bán ra
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
