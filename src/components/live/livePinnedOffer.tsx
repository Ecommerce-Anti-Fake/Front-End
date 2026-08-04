import { Pin, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import type { PinnedLiveOffer } from "../../services/live.api";
import { isLiveOfferSoldOut } from "../../services/live-offer";
import MediaThumbnail from "../media/mediaThumbnail";

export default function LivePinnedOffer({
  offer,
  sessionId,
}: {
  offer: PinnedLiveOffer;
  sessionId: string;
}) {
  const soldOut = isLiveOfferSoldOut(offer.availableQuantity);
  return (
    <section className={`live-pinned-offer${soldOut ? " sold-out" : ""}`}>
      <div className="live-pinned-offer-image">
        {offer.thumbnailUrl ? (
          <MediaThumbnail
            src={offer.thumbnailUrl}
            alt={offer.title}
            width={160}
            height={160}
          />
        ) : (
          <Pin size={24} />
        )}
      </div>
      <div>
        <span>
          <Pin size={14} /> Sản phẩm đang ghim
        </span>
        <h2>{offer.title}</h2>
        <strong>
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: offer.currency || "VND",
          }).format(offer.price)}
        </strong>
        <small>
          {soldOut ? "Đã hết hàng" : `Còn ${offer.availableQuantity} sản phẩm`}
        </small>
      </div>
      {soldOut ? (
        <button type="button" disabled>
          <ShoppingCart size={17} /> Hết hàng
        </button>
      ) : (
        <Link
          to={`/product/${offer.id}?live=${encodeURIComponent(sessionId)}`}
        >
          <ShoppingCart size={17} /> Mua ngay
        </Link>
      )}
    </section>
  );
}
