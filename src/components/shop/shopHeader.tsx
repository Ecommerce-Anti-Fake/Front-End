import {
  BadgeCheck,
  Star,
  MessageSquare,
  Package,
  History,
} from "lucide-react";

import type { shopCard } from "../../type/shop";
import { formatJoinTime, formatSale } from "../../ultil/format";
import { useNavigate } from "react-router-dom";

import { getShopChatThread } from "../../services/chat.api";
import { useGlobalLoadingStore } from "../../store/globalLoadingStore";
import MediaThumbnail from "../media/mediaThumbnail";

type Props = {
  shop: shopCard;
};

function getChatErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as {
      response?: { data?: { message?: unknown } };
    }).response;
    if (typeof response?.data?.message === "string") {
      return response.data.message;
    }
  }

  return error instanceof Error
    ? error.message
    : "Đã xảy ra lỗi khi tạo cuộc trò chuyện";
}

export default function ShopHeader({ shop }: Props) {
  const navigate = useNavigate();
  const showLoading = useGlobalLoadingStore((state) => state.showLoading);
  const hideLoading = useGlobalLoadingStore((state) => state.hideLoading);

  const getOrCreateChatThread = async (shopId: string) => {
    try {
      showLoading("Đang mở cuộc trò chuyện...");
      const response = await getShopChatThread(shopId);

      if (!response?.success || !response?.threadId) {
        throw new Error("Không thể tạo cuộc trò chuyện");
      }

      navigate(`/chat/${response.threadId}`);

      return;
    } catch (error: unknown) {
      console.error("Lỗi tạo chat thread:", error);

      throw new Error(getChatErrorMessage(error), { cause: error });
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="shop-header-card-view">
      <div className="shop-header-left-view">
        <MediaThumbnail
          src={shop.shopAvatar || "https://i.pravatar.cc/150?img=3"}
          alt=""
          className="shop-avatar-view"
          width={160}
          height={160}
          loading="eager"
        />

        <div className="shop-header-info-view">
          <div className="shop-name-row-view">
            <h2>{shop.shopName}</h2>

            <BadgeCheck size={18} className="shop-verified-view" />
          </div>
          <div className="shop-content-view-buttom">
            <div>
              <div className="shop-meta-view">
                <span>
                  <Star size={15} fill="#f59e0b" color="#f59e0b" />
                  <b>{shop.rating}</b>
                </span>

                <span>{formatSale(shop.totalReview)} đánh giá</span>

                <div className="shop-divider-view" />

                <span>
                  <Package size={15} />
                  <b>{formatSale(shop.totalSale)}</b> Sản phẩm
                </span>
              </div>

              <div className="shop-join-view">
                <History size={15} />
                <span>
                  Tham gia <b>{formatJoinTime(shop.createdAt)}</b>
                </span>
              </div>
            </div>
            <div className="shop-header-actions-view">
              <button
                className="chat-btn-view"
                onClick={() => getOrCreateChatThread(shop.shopId)}
              >
                <MessageSquare size={18} />
                Nhắn tin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
