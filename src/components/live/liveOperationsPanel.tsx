import {
  Eye,
  EyeOff,
  MessageCircle,
  Pin,
  PinOff,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getLiveAnalytics,
  getLiveSession,
  listLiveComments,
  replaceLiveSessionOffers,
  updateLiveCommentVisibility,
  updateLivePinnedOffer,
  type LiveAnalytics,
  type LiveComment,
  type LiveSession,
} from "../../services/live.api";
import type { ShopOffer } from "../../services/shop.api";

export default function LiveOperationsPanel({
  session,
  offers,
  onClose,
  onSessionChanged,
}: {
  session: LiveSession;
  offers: ShopOffer[];
  onClose: () => void;
  onSessionChanged: (session: LiveSession) => void | Promise<void>;
}) {
  const [currentSession, setCurrentSession] = useState(session);
  const [selectedOfferIds, setSelectedOfferIds] = useState(
    session.offers.map((offer) => offer.offerId),
  );
  const [analytics, setAnalytics] = useState<LiveAnalytics | null>(null);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [offerBusy, setOfferBusy] = useState(false);
  const canEdit = ["SCHEDULED", "LIVE"].includes(currentSession.status);

  const offerById = useMemo(
    () => new Map(offers.map((offer) => [offer.id, offer])),
    [offers],
  );

  const applySession = useCallback(
    async (updated: LiveSession) => {
      setCurrentSession(updated);
      setSelectedOfferIds(updated.offers.map((offer) => offer.offerId));
      await onSessionChanged(updated);
    },
    [onSessionChanged],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [metrics, commentItems, updatedSession] = await Promise.all([
        getLiveAnalytics(session.id),
        listLiveComments(session.id, true),
        getLiveSession(session.id),
      ]);
      setAnalytics(metrics);
      setComments(commentItems);
      await applySession(updatedSession);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu vận hành",
      );
    } finally {
      setLoading(false);
    }
  }, [applySession, session.id]);

  useEffect(() => {
    const loadId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(loadId);
  }, [load]);

  const toggleVisibility = async (comment: LiveComment) => {
    try {
      const updated = await updateLiveCommentVisibility(
        session.id,
        comment.id,
        comment.visibility === "PUBLIC" ? "HIDDEN" : "PUBLIC",
      );
      setComments((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể kiểm duyệt bình luận",
      );
    }
  };

  const toggleOffer = (offerId: string) => {
    setSelectedOfferIds((current) =>
      current.includes(offerId)
        ? current.filter((id) => id !== offerId)
        : [...current, offerId],
    );
  };

  const saveOffers = async () => {
    if (
      currentSession.pinnedOfferId &&
      !selectedOfferIds.includes(currentSession.pinnedOfferId)
    ) {
      toast.error("Hãy đổi hoặc bỏ ghim sản phẩm trước khi gỡ khỏi phiên live");
      return;
    }
    setOfferBusy(true);
    try {
      await replaceLiveSessionOffers(session.id, selectedOfferIds);
      await applySession(await getLiveSession(session.id));
      toast.success("Đã cập nhật sản phẩm trong phiên live");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật sản phẩm",
      );
    } finally {
      setOfferBusy(false);
    }
  };

  const changePinnedOffer = async (offerId: string | null) => {
    setOfferBusy(true);
    try {
      await updateLivePinnedOffer(session.id, offerId);
      await applySession(await getLiveSession(session.id));
      toast.success(offerId ? "Đã ghim sản phẩm" : "Đã bỏ ghim sản phẩm");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể thay đổi sản phẩm ghim",
      );
    } finally {
      setOfferBusy(false);
    }
  };

  return (
    <div className="live-operations-backdrop" role="presentation">
      <section
        className="live-operations-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Vận hành ${currentSession.title}`}
      >
        <header>
          <div>
            <small>Vận hành livestream</small>
            <h2>{currentSession.title}</h2>
          </div>
          <button onClick={onClose} aria-label="Đóng">
            <X size={19} />
          </button>
        </header>

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <>
            <div className="live-operations-metrics">
              <article>
                <Users />
                <b>{analytics?.currentViewers ?? 0}</b>
                <span>Đang xem</span>
              </article>
              <article>
                <MessageCircle />
                <b>{analytics?.commentCount ?? 0}</b>
                <span>Bình luận</span>
              </article>
              <article>
                <ShoppingBag />
                <b>{analytics?.conversionCount ?? 0}</b>
                <span>Đơn từ live</span>
              </article>
              <article>
                <b>
                  {new Intl.NumberFormat("vi-VN").format(
                    analytics?.grossRevenue ?? 0,
                  )}
                  đ
                </b>
                <span>Doanh thu gộp</span>
              </article>
            </div>

            <div className="live-operations-offers">
              <div>
                <h3>Sản phẩm trong phiên</h3>
                <button
                  type="button"
                  disabled={!canEdit || offerBusy}
                  onClick={() => void saveOffers()}
                >
                  Lưu danh sách
                </button>
              </div>
              {!canEdit && (
                <p>Phiên đã kết thúc hoặc bị hủy nên không thể sửa sản phẩm.</p>
              )}
              <div className="live-operations-offer-list">
                {offers.map((offer) => {
                  const selected = selectedOfferIds.includes(offer.id);
                  const pinned = currentSession.pinnedOfferId === offer.id;
                  const soldOut = (offer.availableQuantity ?? 0) <= 0;
                  return (
                    <article key={offer.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={
                            !canEdit || offerBusy || (soldOut && !selected)
                          }
                          onChange={() => toggleOffer(offer.id)}
                        />
                        <span>
                          <b>{offer.title}</b>
                          <small>
                            {soldOut
                              ? "Hết hàng"
                              : `Còn ${offer.availableQuantity ?? 0} sản phẩm`}
                          </small>
                        </span>
                      </label>
                      {selected && (
                        <button
                          type="button"
                          disabled={
                            !canEdit || offerBusy || (soldOut && !pinned)
                          }
                          className={pinned ? "pinned" : ""}
                          onClick={() =>
                            void changePinnedOffer(pinned ? null : offer.id)
                          }
                          title={pinned ? "Bỏ ghim" : "Ghim sản phẩm"}
                        >
                          {pinned ? <PinOff size={16} /> : <Pin size={16} />}
                          {pinned ? "Bỏ ghim" : "Ghim"}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
              {currentSession.pinnedOfferId &&
                !offerById.has(currentSession.pinnedOfferId) && (
                  <button
                    type="button"
                    disabled={!canEdit || offerBusy}
                    onClick={() => void changePinnedOffer(null)}
                  >
                    <PinOff size={16} /> Bỏ ghim sản phẩm không còn bán
                  </button>
                )}
            </div>

            <div className="live-operations-comments">
              <h3>Kiểm duyệt bình luận</h3>
              {comments.length === 0 ? (
                <p>Chưa có bình luận.</p>
              ) : (
                comments.map((comment) => (
                  <article key={comment.id}>
                    <div>
                      <b>{comment.authorName}</b>
                      <p>{comment.body}</p>
                    </div>
                    <button
                      onClick={() => void toggleVisibility(comment)}
                      title={comment.visibility === "PUBLIC" ? "Ẩn" : "Hiện"}
                    >
                      {comment.visibility === "PUBLIC" ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </article>
                ))
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
