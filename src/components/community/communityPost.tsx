import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Share2,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { likePost, unLikePost } from "../../services/community.api";
import type { SocialPost } from "../../type/community";
import { getToken } from "../../ultil/auth";
import { formatCommunityTime } from "../../ultil/format";
import CommentBottomSheet from "./commentBottomSheet";

type Props = {
  post: SocialPost;
};

export default function CommunityPost({ post }: Props) {
  const navigate = useNavigate();
  const [openComment, setOpenComment] = useState(false);
  const [liked, setLiked] = useState(post.viewer.liked);
  const [reactionCount, setReactionCount] = useState(post.stats.reactions);
  const [loadingLike, setLoadingLike] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const imageMedia =
    post.media
      ?.filter((item) => item.assetType === "IMAGE" && item.url)
      .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)) ??
    [];
  const legacyImageMedia =
    imageMedia.length === 0 && post.image
      ? [{ id: post.image, url: post.image }]
      : [];
  const mediaToRender = imageMedia.length > 0 ? imageMedia : legacyImageMedia;

  const redirectToLogin = () => {
    toast.error("Vui lòng đăng nhập trước");
    navigate("/auth");
  };

  const isAuthError = (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    return (
      message.includes("unauthorized") ||
      message.includes("401") ||
      message.includes("đăng nhập") ||
      message.includes("phiên")
    );
  };

  const requireLogin = () => {
    if (getToken()) return true;

    redirectToLogin();
    return false;
  };

  const handleOpenComment = () => {
    if (!requireLogin()) return;

    setOpenComment(true);
  };

  const handleLike = async () => {
    if (loadingLike) return;
    if (!requireLogin()) return;

    setLoadingLike(true);

    const oldLiked = liked;
    const oldCount = reactionCount;

    setLiked(!oldLiked);
    setReactionCount(oldLiked ? oldCount - 1 : oldCount + 1);

    try {
      if (oldLiked) {
        await unLikePost(post.id, "LIKE");
      } else {
        await likePost(post.id, "LIKE");
      }
    } catch (err: unknown) {
      setLiked(oldLiked);
      setReactionCount(oldCount);

      if (isAuthError(err)) {
        redirectToLogin();
      } else {
        toast.error(err instanceof Error ? err.message : "Thao tác thất bại");
      }
    } finally {
      setLoadingLike(false);
    }
  };

  const closeImageViewer = () => setActiveImageIndex(null);

  const showPrevImage = () => {
    setActiveImageIndex((current) =>
      current === null
        ? current
        : (current - 1 + mediaToRender.length) % mediaToRender.length,
    );
  };

  const showNextImage = () => {
    setActiveImageIndex((current) =>
      current === null ? current : (current + 1) % mediaToRender.length,
    );
  };

  return (
    <div className="community-post">
      <div className="post-header">
        <img
          src={post.author.avatar || "https://i.pravatar.cc/150?img=11"}
          alt=""
        />

        <div>
          <h4>{post.author.name}</h4>
          <span>{formatCommunityTime(post.createdAt)}</span>
        </div>
      </div>

      <p>{post.body}</p>

      {mediaToRender.length > 0 && (
        <div className={`post-media-grid media-count-${mediaToRender.length}`}>
          {mediaToRender.slice(0, 4).map((item, index) => (
            <button
              key={item.id}
              className="post-image-button"
              type="button"
              onClick={() => setActiveImageIndex(index)}
            >
              <img
                src={item.url}
                alt={`Ảnh bài viết ${index + 1}`}
                className="post-image"
              />
            </button>
          ))}
        </div>
      )}

      <div className="post-actions">
        <button onClick={handleLike} disabled={loadingLike}>
          <Heart
            size={18}
            fill={liked ? "#ef4444" : "none"}
            color={liked ? "#ef4444" : "currentColor"}
          />
          {reactionCount}
        </button>

        <button onClick={handleOpenComment}>
          <MessageCircle size={18} />
          {post.stats.comments}
        </button>

        <button>
          <Share2 size={18} />
          {post.stats.shares}
        </button>
      </div>

      <CommentBottomSheet
        open={openComment}
        onClose={() => setOpenComment(false)}
        postId={post.id}
      />

      {activeImageIndex !== null && (
        <div
          className="post-image-viewer"
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh bài viết"
        >
          <button
            className="post-image-viewer-close"
            type="button"
            aria-label="Đóng"
            onClick={closeImageViewer}
          >
            <X size={24} />
          </button>

          {mediaToRender.length > 1 && (
            <button
              className="post-image-viewer-nav prev"
              type="button"
              aria-label="Ảnh trước"
              onClick={showPrevImage}
            >
              <ChevronLeft size={28} />
            </button>
          )}

          <img
            src={mediaToRender[activeImageIndex].url}
            alt={`Ảnh bài viết ${activeImageIndex + 1}`}
          />

          {mediaToRender.length > 1 && (
            <button
              className="post-image-viewer-nav next"
              type="button"
              aria-label="Ảnh tiếp theo"
              onClick={showNextImage}
            >
              <ChevronRight size={28} />
            </button>
          )}

          {mediaToRender.length > 1 && (
            <span className="post-image-viewer-count">
              {activeImageIndex + 1}/{mediaToRender.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
