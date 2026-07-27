import {
  CalendarClock,
  ExternalLink,
  Play,
  Radio,
  RefreshCw,
  Square,
  Video,
  Activity,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import BroadcastCredentialsPanel from "../../../../components/live/broadcastCredentialsPanel";
import LiveOperationsPanel from "../../../../components/live/liveOperationsPanel";
import { useSellerShop } from "../../../../contexts/sellerShopContext";
import {
  createLiveSession,
  getBroadcastCredentials,
  refreshLiveRecording,
  listLiveSessions,
  startLiveSession,
  updateLiveSessionStatus,
  type BroadcastCredentials,
  type LiveSession,
  type LiveSessionStatus,
} from "../../../../services/live.api";
import { fetchShopOffers, type ShopOffer } from "../../../../services/shop.api";
import { fetchShopVouchers } from "../../../../services/voucher.api";
import "../../../../css/pages/sellerLive.css";

const statusLabel: Record<LiveSessionStatus, string> = {
  SCHEDULED: "Đã lên lịch",
  LIVE: "Đang phát",
  ENDED: "Đã kết thúc",
  CANCELLED: "Đã hủy",
};

const initialStartAt = () => {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

type ShopVoucher = {
  id: string;
  code: string;
  name: string;
  status: string;
  startsAt: string;
  endsAt: string;
};

export default function SellerLivePage() {
  const { shopId } = useSellerShop();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [offers, setOffers] = useState<ShopOffer[]>([]);
  const [vouchers, setVouchers] = useState<ShopVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState("");
  const [credentials, setCredentials] =
    useState<BroadcastCredentials | null>(null);
  const [operationsSession, setOperationsSession] =
    useState<LiveSession | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    coverUrl: "",
    startAt: initialStartAt(),
    offerIds: [] as string[],
    voucherIds: [] as string[],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [liveItems, offerResult, voucherItems] = await Promise.all([
        listLiveSessions({ filter: "all", shopId }),
        fetchShopOffers(shopId, {
          page: 1,
          pageSize: 100,
          offerStatus: "active",
          moderationStatus: "approved",
        }),
        fetchShopVouchers(shopId),
      ]);
      setSessions(liveItems);
      setOffers(offerResult.items);
      setVouchers(
        (voucherItems as ShopVoucher[]).filter(
          (voucher) => voucher.status === "ACTIVE",
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu livestream",
      );
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.startAt) return;
    setSubmitting(true);
    try {
      const created = await createLiveSession({
        shopId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        coverUrl: form.coverUrl.trim() || undefined,
        startAt: new Date(form.startAt).toISOString(),
        offerIds: form.offerIds,
        voucherIds: form.voucherIds,
      });
      setCredentials(created.broadcastCredentials ?? null);
      toast.success("Đã tạo lịch livestream");
      setForm({
        title: "",
        description: "",
        coverUrl: "",
        startAt: initialStartAt(),
        offerIds: [],
        voucherIds: [],
      });
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tạo livestream",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (
    sessionId: string,
    status: Extract<LiveSessionStatus, "ENDED" | "CANCELLED">,
  ) => {
    setActionId(sessionId);
    try {
      await updateLiveSessionStatus(sessionId, status);
      toast.success(`Đã cập nhật: ${statusLabel[status]}`);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật phiên live",
      );
    } finally {
      setActionId("");
    }
  };

  const startBroadcast = async (sessionId: string) => {
    setActionId(sessionId);
    try {
      await startLiveSession(sessionId);
      setCredentials(await getBroadcastCredentials(sessionId));
      toast.success("Đang chờ OBS kết nối với Cloudflare");
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể chuẩn bị phiên livestream",
      );
    } finally {
      setActionId("");
    }
  };

  const showCredentials = async (sessionId: string) => {
    setActionId(sessionId);
    try {
      setCredentials(await getBroadcastCredentials(sessionId));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lấy cấu hình OBS",
      );
    } finally {
      setActionId("");
    }
  };

  const refreshRecording = async (sessionId: string) => {
    setActionId(sessionId);
    try {
      const result = await refreshLiveRecording(sessionId);
      toast[result.ready ? "success" : "info"](
        result.ready
          ? "Bản phát lại đã sẵn sàng"
          : "Cloudflare vẫn đang xử lý bản phát lại",
      );
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể kiểm tra bản phát lại",
      );
    } finally {
      setActionId("");
    }
  };

  const toggleOffer = (offerId: string) =>
    setForm((current) => ({
      ...current,
      offerIds: current.offerIds.includes(offerId)
        ? current.offerIds.filter((id) => id !== offerId)
        : [...current.offerIds, offerId],
    }));

  const toggleVoucher = (voucherId: string) =>
    setForm((current) => ({
      ...current,
      voucherIds: current.voucherIds.includes(voucherId)
        ? current.voucherIds.filter((id) => id !== voucherId)
        : [...current.voucherIds, voucherId],
    }));

  return (
    <main className="seller-live-page">
      <header className="seller-live-heading">
        <div>
          <span className="seller-live-kicker">
            <Radio size={15} /> LIVE COMMERCE
          </span>
          <h1>Livestream của shop</h1>
          <p>Lên lịch, cấu hình OBS và bán sản phẩm trong thời gian thực.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={17} /> Làm mới
        </button>
      </header>

      <div className="seller-live-layout">
        <form className="seller-live-form" onSubmit={submit}>
          <div className="seller-live-card-title">
            <Video size={20} />
            <div>
              <h2>Tạo phiên livestream</h2>
              <p>Cloudflare sẽ cấp server và stream key dùng trong OBS.</p>
            </div>
          </div>
          <label>
            Tiêu đề *
            <input
              required
              maxLength={255}
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="Live sale hàng chính hãng"
            />
          </label>
          <label>
            Mô tả
            <textarea
              maxLength={2000}
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              placeholder="Nội dung và ưu đãi chính trong phiên live"
            />
          </label>
          <div className="seller-live-form-row">
            <label>
              Bắt đầu lúc *
              <input
                required
                type="datetime-local"
                value={form.startAt}
                onChange={(event) =>
                  setForm({ ...form, startAt: event.target.value })
                }
              />
            </label>
            <label>
              Ảnh bìa
              <input
                type="url"
                value={form.coverUrl}
                onChange={(event) =>
                  setForm({ ...form, coverUrl: event.target.value })
                }
                placeholder="https://..."
              />
            </label>
          </div>
          <fieldset>
            <legend>Sản phẩm ghim ({form.offerIds.length})</legend>
            <div className="seller-live-offer-picker">
              {offers.length === 0 ? (
                <p>Shop chưa có sản phẩm đang bán và đã duyệt.</p>
              ) : (
                offers.map((offer) => (
                  <label key={offer.id}>
                    <input
                      type="checkbox"
                      checked={form.offerIds.includes(offer.id)}
                      onChange={() => toggleOffer(offer.id)}
                    />
                    <span>
                      <strong>{offer.title}</strong>
                      <small>
                        Còn {offer.availableQuantity ?? 0} sản phẩm
                      </small>
                    </span>
                  </label>
                ))
              )}
            </div>
          </fieldset>
          <fieldset>
            <legend>Voucher trong live ({form.voucherIds.length})</legend>
            <div className="seller-live-offer-picker">
              {vouchers.length === 0 ? (
                <p>Shop chưa có voucher đang hoạt động.</p>
              ) : (
                vouchers.map((voucher) => (
                  <label key={voucher.id}>
                    <input
                      type="checkbox"
                      checked={form.voucherIds.includes(voucher.id)}
                      onChange={() => toggleVoucher(voucher.id)}
                    />
                    <span>
                      <strong>{voucher.code}</strong>
                      <small>{voucher.name}</small>
                    </span>
                  </label>
                ))
              )}
            </div>
          </fieldset>
          <button className="seller-live-primary" disabled={submitting}>
            <CalendarClock size={17} />
            {submitting ? "Đang tạo..." : "Tạo lịch và lấy stream key"}
          </button>
        </form>

        <section className="seller-live-sessions" aria-busy={loading}>
          <div className="seller-live-card-title">
            <CalendarClock size={20} />
            <div>
              <h2>Các phiên của shop</h2>
              <p>OBS kết nối sẽ tự chuyển phiên sang trạng thái đang phát.</p>
            </div>
          </div>
          {!loading && sessions.length === 0 && (
            <div className="seller-live-empty">
              <Radio size={30} />
              <strong>Chưa có lịch livestream</strong>
              <span>Tạo phiên đầu tiên bằng biểu mẫu bên cạnh.</span>
            </div>
          )}
          {sessions.map((session) => (
            <article className="seller-live-session" key={session.id}>
              <div>
                <span className={`seller-live-status ${session.status.toLowerCase()}`}>
                  {statusLabel[session.status]}
                </span>
                <h3>{session.title}</h3>
                <p>
                  {new Date(session.startAt).toLocaleString("vi-VN")} ·{" "}
                  {session.offers.length} sản phẩm
                </p>
                {session.providerStatus && (
                  <small>Đường truyền: {session.providerStatus}</small>
                )}
              </div>
              <div className="seller-live-actions">
                <button
                  type="button"
                  onClick={() => setOperationsSession(session)}
                >
                  <Activity size={15} /> Vận hành
                </button>
                {["SCHEDULED", "LIVE"].includes(session.status) && (
                  <button
                    type="button"
                    disabled={actionId === session.id}
                    onClick={() => void showCredentials(session.id)}
                  >
                    <Radio size={15} /> OBS
                  </button>
                )}
                {session.status === "SCHEDULED" && (
                  <>
                    <button
                      type="button"
                      disabled={actionId === session.id}
                      onClick={() => void startBroadcast(session.id)}
                    >
                      <Play size={15} />{" "}
                      {session.providerStatus === "STARTING"
                        ? "Mở lại OBS"
                        : "Bắt đầu"}
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => void changeStatus(session.id, "CANCELLED")}
                    >
                      <XCircle size={15} /> Hủy
                    </button>
                  </>
                )}
                {session.status === "LIVE" && (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => void changeStatus(session.id, "ENDED")}
                  >
                    <Square size={14} /> Kết thúc
                  </button>
                )}
                {session.status === "ENDED" && !session.recordingUrl && (
                  <button
                    type="button"
                    disabled={actionId === session.id}
                    onClick={() => void refreshRecording(session.id)}
                  >
                    <RefreshCw size={15} /> Kiểm tra replay
                  </button>
                )}
                {session.status !== "CANCELLED" && (
                  <Link to={`/live/${session.id}`}>
                    <ExternalLink size={15} /> Xem
                  </Link>
                )}
              </div>
            </article>
          ))}
        </section>
      </div>

      {credentials && (
        <BroadcastCredentialsPanel
          credentials={credentials}
          onClose={() => setCredentials(null)}
        />
      )}
      {operationsSession && (
        <LiveOperationsPanel
          session={operationsSession}
          onClose={() => setOperationsSession(null)}
        />
      )}
    </main>
  );
}
