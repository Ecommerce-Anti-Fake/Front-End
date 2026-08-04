import { CalendarClock, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import type { LiveSession } from "../../services/live.api";
import "../../css/components/live/liveShopCard.css";
import MediaThumbnail from "../media/mediaThumbnail";

export default function LiveShopCard({ live }: { live: LiveSession }) {
  return (
    <Link className="live-card" to={`/live/${live.id}`}>
      <div className="live-image-wrapper">
        {live.coverUrl ? (
          <MediaThumbnail
            src={live.coverUrl}
            alt=""
            className="live-image"
            width={640}
            height={360}
          />
        ) : (
          <div className="live-image live-image-empty">
            <Radio size={34} />
          </div>
        )}
        <span className={`live-badge ${live.status.toLowerCase()}`}>
          {live.status === "LIVE"
            ? "Đang phát"
            : live.status === "SCHEDULED"
              ? "Sắp diễn ra"
              : "Phát lại"}
        </span>
        <p className="live-title">{live.title}</p>
      </div>
      <div className="live-card-meta">
        <b>{live.shopName}</b>
        <span>
          <CalendarClock size={13} />
          {new Date(live.startAt).toLocaleString("vi-VN")}
        </span>
      </div>
    </Link>
  );
}
