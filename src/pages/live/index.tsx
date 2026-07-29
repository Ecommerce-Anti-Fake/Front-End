import {
  Bell,
  CalendarClock,
  Copy,
  Flame,
  Heart,
  MessageCircle,
  Store,
  ThumbsUp,
  Zap,
} from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import LiveChat from "../../components/live/liveChat";
import LivePinnedOffer from "../../components/live/livePinnedOffer";
import LiveProducts from "../../components/live/liveProducts";
import { useLiveRealtime } from "../../hooks/useLiveRealtime";
import {
  getLiveSession,
  remindLiveSession,
  type LiveSession,
} from "../../services/live.api";
import { getToken } from "../../ultil/auth";
import "../../css/components/live/liveRoom.css";

const LivePlayer = lazy(() => import("../../components/live/livePlayer"));

const reactionOptions = [
  { type: "LIKE" as const, label: "Thích", icon: ThumbsUp },
  { type: "LOVE" as const, label: "Yêu thích", icon: Heart },
  { type: "WOW" as const, label: "Wow", icon: Zap },
  { type: "FIRE" as const, label: "Tuyệt", icon: Flame },
];

export default function LiveRoomPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reminding, setReminding] = useState(false);
  const realtime = useLiveRealtime(id, setSession);
  const sessionStatus = session?.status;

  useEffect(() => {
    const abortController = new AbortController();
    const loadId = window.setTimeout(() => {
      setLoading(true);
      void getLiveSession(id, abortController.signal)
        .then((value) => {
          if (!abortController.signal.aborted) {
            setSession(value);
            setError("");
          }
        })
        .catch((requestError) => {
          if (
            !abortController.signal.aborted &&
            !(
              requestError instanceof DOMException &&
              requestError.name === "AbortError"
            )
          ) {
            setError(
              requestError instanceof Error
                ? requestError.message
                : "Không thể tải livestream",
            );
          }
        })
        .finally(() => !abortController.signal.aborted && setLoading(false));
    }, 0);
    return () => {
      window.clearTimeout(loadId);
      abortController.abort();
    };
  }, [id]);

  useEffect(() => {
    if (!id || !sessionStatus || !["SCHEDULED", "LIVE"].includes(sessionStatus)) {
      return;
    }

    const abortController = new AbortController();
    let inFlight = false;
    const intervalMs = sessionStatus === "SCHEDULED" ? 3_000 : 15_000;
    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const refreshed = await getLiveSession(id, abortController.signal);
        if (!abortController.signal.aborted) setSession(refreshed);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        )
          return;
      } finally {
        inFlight = false;
      }
    };
    const intervalId = window.setInterval(() => void refresh(), intervalMs);
    return () => {
      abortController.abort();
      window.clearInterval(intervalId);
    };
  }, [id, sessionStatus]);

  const setReminder = async () => {
    if (!getToken()) {
      navigate(`/auth?redirect=${encodeURIComponent(`/live/${id}`)}`);
      return;
    }
    setReminding(true);
    try {
      const updated = await remindLiveSession(id);
      setSession(updated);
      toast.success("Đã bật nhắc lịch livestream");
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Không thể bật nhắc lịch",
      );
    } finally {
      setReminding(false);
    }
  };

  if (loading) {
    return <div className="live-page-state">Đang tải livestream...</div>;
  }
  if (error || !session) {
    return (
      <div className="live-page-state live-page-error">
        <p>{error || "Không tìm thấy livestream"}</p>
        <Link to="/live">Xem các livestream khác</Link>
      </div>
    );
  }

  const chat = (
    <LiveChat
      comments={realtime.comments}
      connected={realtime.connected}
      canInteract={realtime.canInteract}
      onSend={realtime.sendComment}
    />
  );

  return (
    <div className="live-room-page">
      <main className="live-main">
        <Suspense
          fallback={
            <section className="live-player">
              <div className="live-player-placeholder" role="status">
                Đang tải trình phát...
              </div>
            </section>
          }
        >
          <LivePlayer key={session.id} session={session} />
        </Suspense>
        {session.pinnedOffer && (
          <LivePinnedOffer
            offer={session.pinnedOffer}
            sessionId={session.id}
          />
        )}
        <section className="live-session-summary">
          <div>
            <p className="live-session-shop">
              <Store size={16} /> {session.shopName}
            </p>
            <h1>{session.title}</h1>
            {session.description && <p>{session.description}</p>}
            <span>
              <CalendarClock size={15} />
              {new Date(session.startAt).toLocaleString("vi-VN")}
            </span>
          </div>
          {session.status === "SCHEDULED" && (
            <button
              className="live-reminder-button"
              onClick={setReminder}
              disabled={reminding || session.viewerHasReminder}
            >
              <Bell size={17} />
              {session.viewerHasReminder ? "Đã nhắc lịch" : "Nhắc tôi"}
            </button>
          )}
        </section>

        <section className="live-reactions" aria-label="Cảm xúc">
          {reactionOptions.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              disabled={!realtime.canInteract || !realtime.connected}
              onClick={() => realtime.sendReaction(type)}
              title={
                realtime.canInteract ? label : "Đăng nhập để thả cảm xúc"
              }
            >
              <Icon size={18} />
              <span>{realtime.reactions.totals[type]}</span>
            </button>
          ))}
          <span className="live-comment-total">
            <MessageCircle size={17} /> {realtime.comments.length}
          </span>
          {realtime.error && (
            <span className="live-realtime-error">{realtime.error}</span>
          )}
        </section>

        {(session.vouchers ?? []).length > 0 && (
          <section className="live-vouchers">
            <h2>Voucher dành cho phiên live</h2>
            <div>
              {session.vouchers.map((voucher) => (
                <article key={voucher.voucherId}>
                  <div>
                    <b>{voucher.code}</b>
                    <span>{voucher.name}</span>
                    <small>
                      Đơn tối thiểu{" "}
                      {new Intl.NumberFormat("vi-VN").format(
                        voucher.minOrderAmount,
                      )}
                      đ
                    </small>
                  </div>
                  <button
                    onClick={() => {
                      void navigator.clipboard.writeText(voucher.code);
                      toast.success("Đã sao chép mã voucher");
                    }}
                  >
                    <Copy size={15} /> Sao chép
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="live-chat-bottom">{chat}</div>
        <LiveProducts products={session.offers} sessionId={session.id} />
      </main>
      <aside className="live-chat-right">{chat}</aside>
    </div>
  );
}
