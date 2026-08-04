import { Bell, CalendarClock, Radio, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  listLiveSessions,
  remindLiveSession,
  type LiveSession,
} from "../../services/live.api";
import { getToken } from "../../ultil/auth";
import "../../css/pages/liveDiscovery.css";
import MediaThumbnail from "../../components/media/mediaThumbnail";

type Filter = "live" | "upcoming";

const filters: Array<{ value: Filter; label: string }> = [
  { value: "live", label: "Đang phát" },
  { value: "upcoming", label: "Sắp diễn ra" },
];

export default function LiveDiscoveryPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("live");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadId = window.setTimeout(() => {
      setLoading(true);
      void listLiveSessions({ filter, q: submittedQuery })
        .then((items) => {
          if (active) {
            setSessions(items);
            setError("");
          }
        })
        .catch((requestError) => {
          if (active) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : "Không thể tải livestream",
            );
          }
        })
        .finally(() => active && setLoading(false));
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(loadId);
    };
  }, [filter, submittedQuery]);

  const remind = async (event: React.MouseEvent, session: LiveSession) => {
    event.preventDefault();
    if (!getToken()) {
      navigate(`/auth?redirect=${encodeURIComponent("/live")}`);
      return;
    }
    try {
      const updated = await remindLiveSession(session.id);
      setSessions((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success("Đã bật nhắc lịch livestream");
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Không thể bật nhắc lịch",
      );
    }
  };

  return (
    <main className="live-discovery-page">
      <header className="live-discovery-header">
        <div>
          <span className="live-discovery-eyebrow">
            <Radio size={17} /> Mua sắm trực tiếp
          </span>
          <h1>Livestream từ các shop</h1>
          <p>Xem sản phẩm thật, trò chuyện và mua ngay trong lúc phát.</p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSubmittedQuery(query.trim());
          }}
        >
          <Search size={18} />
          <input
            id="live-search"
            name="liveSearch"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm tiêu đề hoặc shop"
          />
        </form>
      </header>

      <nav className="live-filter-tabs" aria-label="Lọc livestream">
        {filters.map((item) => (
          <button
            key={item.value}
            className={filter === item.value ? "active" : ""}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="live-discovery-state">Đang tải...</div>
      ) : error ? (
        <div className="live-discovery-state error">{error}</div>
      ) : sessions.length === 0 ? (
        <div className="live-discovery-state">Chưa có livestream phù hợp.</div>
      ) : (
        <section className="live-discovery-grid">
          {sessions.map((session, index) => (
            <Link
              to={`/live/${session.id}`}
              className="live-discovery-card"
              key={session.id}
            >
              <div className="live-discovery-cover">
                {session.coverUrl ? (
                  <MediaThumbnail
                    src={session.coverUrl}
                    alt=""
                    width={640}
                    height={360}
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                ) : (
                  <Radio size={38} />
                )}
                <span className={`live-status ${session.status.toLowerCase()}`}>
                  {session.status === "LIVE"
                    ? "Đang phát"
                    : "Sắp diễn ra"}
                </span>
              </div>
              <div className="live-discovery-body">
                <small>{session.shopName}</small>
                <h2>{session.title}</h2>
                <p>
                  <CalendarClock size={14} />
                  {new Date(session.startAt).toLocaleString("vi-VN")}
                </p>
                <div>
                  <span>{session.offers.length} sản phẩm</span>
                  {session.status === "SCHEDULED" && (
                    <button
                      disabled={session.viewerHasReminder}
                      onClick={(event) => void remind(event, session)}
                    >
                      <Bell size={15} />
                      {session.viewerHasReminder ? "Đã nhắc" : "Nhắc tôi"}
                    </button>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
