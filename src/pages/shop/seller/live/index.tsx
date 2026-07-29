import {
  CalendarClock,
  ExternalLink,
  ImagePlus,
  Radio,
  RefreshCw,
  Square,
  Trash2,
  Video,
  Activity,
  XCircle,
} from "lucide-react";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import LiveOperationsPanel from "../../../../components/live/liveOperationsPanel";
import { useSellerShop } from "../../../../contexts/sellerShopContext";
import {
  createLiveSession,
  listLiveSessions,
  updateLiveSessionStatus,
  type LiveSession,
  type LiveSessionStatus,
} from "../../../../services/live.api";
import { getOrCreateLiveRtcClientId } from "../../../../services/live-rtc";
import {
  createLiveCoverPreview,
  validateLiveCoverFile,
} from "../../../../services/live-form";
import { fetchShopOffers, type ShopOffer } from "../../../../services/shop.api";
import { fetchShopVouchers } from "../../../../services/voucher.api";
import "../../../../css/pages/sellerLive.css";

const AgoraHostStudio = lazy(
  () => import("../../../../components/live/agoraHostStudio"),
);

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
  const [studioSession, setStudioSession] = useState<LiveSession | null>(null);
  const [operationsSession, setOperationsSession] =
    useState<LiveSession | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const coverPreviewRef = useRef<ReturnType<
    typeof createLiveCoverPreview
  > | null>(null);
  const submitAbortRef = useRef<AbortController | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    coverImage: null as File | null,
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
    const loadId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(loadId);
  }, [load]);

  useEffect(
    () => () => {
      submitAbortRef.current?.abort();
      coverPreviewRef.current?.revoke();
    },
    [],
  );

  const clearCover = () => {
    coverPreviewRef.current?.revoke();
    coverPreviewRef.current = null;
    setCoverPreviewUrl("");
    setForm((current) => ({ ...current, coverImage: null }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.startAt || submitting) return;
    if (form.coverImage) {
      const validationError = validateLiveCoverFile(form.coverImage);
      if (validationError) {
        toast.error(validationError);
        return;
      }
    }
    const abortController = new AbortController();
    submitAbortRef.current = abortController;
    setSubmitting(true);
    try {
      await createLiveSession({
        clientId: getOrCreateLiveRtcClientId(),
        shopId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        coverImage: form.coverImage ?? undefined,
        startAt: new Date(form.startAt).toISOString(),
        offerIds: form.offerIds,
        voucherIds: form.voucherIds,
      }, abortController.signal);
      toast.success("Đã tạo lịch livestream");
      coverPreviewRef.current?.revoke();
      coverPreviewRef.current = null;
      setCoverPreviewUrl("");
      setForm({
        title: "",
        description: "",
        coverImage: null,
        startAt: initialStartAt(),
        offerIds: [],
        voucherIds: [],
      });
      await load();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        toast.info("Đã dừng chờ tạo phiên. Đang kiểm tra lại danh sách...");
        await load();
        return;
      }
      toast.error(
        error instanceof Error ? error.message : "Không thể tạo livestream",
      );
    } finally {
      if (submitAbortRef.current === abortController) {
        submitAbortRef.current = null;
      }
      setSubmitting(false);
    }
  };

  const selectCover = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    const validationError = validateLiveCoverFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    coverPreviewRef.current?.revoke();
    const preview = createLiveCoverPreview(file);
    coverPreviewRef.current = preview;
    setCoverPreviewUrl(preview.url);
    setForm((current) => ({ ...current, coverImage: file }));
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

  const handleOperationsSessionChanged = useCallback(
    async (updated: LiveSession) => {
      setOperationsSession(updated);
      setSessions((current) =>
        current.map((session) =>
          session.id === updated.id ? updated : session,
        ),
      );
      await load();
    },
    [load],
  );

  return (
    <main className="seller-live-page">
      <header className="seller-live-heading">
        <div>
          <span className="seller-live-kicker">
            <Radio size={15} /> LIVE COMMERCE
          </span>
          <h1>Livestream của shop</h1>
          <p>Lên lịch, mở studio và bán sản phẩm trong thời gian thực.</p>
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
              <p>Camera và micro được phát trực tiếp qua Agora.</p>
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
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={selectCover}
              />
            </label>
          </div>
          <div className="seller-live-cover-picker">
            {coverPreviewUrl ? (
              <div className="seller-live-cover-preview">
                <img src={coverPreviewUrl} alt="Xem trước ảnh bìa livestream" />
                <button
                  type="button"
                  onClick={clearCover}
                >
                  <Trash2 size={15} /> Xóa ảnh
                </button>
              </div>
            ) : (
              <p>
                <ImagePlus size={18} /> Ảnh bìa tùy chọn, khuyến nghị tỷ lệ
                16:9. JPG, PNG hoặc WebP, tối đa 5 MB.
              </p>
            )}
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
            {submitting
              ? "Đang tải ảnh và tạo phiên..."
              : "Tạo lịch livestream"}
          </button>
          {submitting && (
            <button
              className="seller-live-cancel-submit"
              type="button"
              onClick={() => submitAbortRef.current?.abort()}
            >
              Dừng chờ
            </button>
          )}
        </form>

        <section className="seller-live-sessions" aria-busy={loading}>
          <div className="seller-live-card-title">
            <CalendarClock size={20} />
            <div>
              <h2>Các phiên của shop</h2>
              <p>Mở studio để kiểm tra thiết bị trước khi bắt đầu phát.</p>
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
                    onClick={() => setStudioSession(session)}
                  >
                    <Radio size={15} /> Mở studio
                  </button>
                )}
                {session.status === "SCHEDULED" && (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => void changeStatus(session.id, "CANCELLED")}
                  >
                    <XCircle size={15} /> Hủy
                  </button>
                )}
                {session.status === "LIVE" && (
                  <button
                    type="button"
                    className="danger"
                    disabled={actionId === session.id}
                    onClick={() => void changeStatus(session.id, "ENDED")}
                  >
                    <Square size={14} /> Kết thúc
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

      {studioSession && (
        <Suspense
          fallback={
            <div className="seller-live-studio" role="status">
              Đang tải Agora Studio...
            </div>
          }
        >
          <AgoraHostStudio
            key={studioSession.id}
            session={studioSession}
            onClose={() => setStudioSession(null)}
            onSessionChanged={async (updated) => {
              setStudioSession(updated);
              await load();
            }}
          />
        </Suspense>
      )}
      {operationsSession && (
        <LiveOperationsPanel
          session={operationsSession}
          offers={offers}
          onClose={() => setOperationsSession(null)}
          onSessionChanged={handleOperationsSessionChanged}
        />
      )}
    </main>
  );
}
