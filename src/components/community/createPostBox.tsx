import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Image, X } from "lucide-react";
import { createSocialPost } from "../../services/community.api";
import { useGlobalLoadingStore } from "../../store/globalLoadingStore";

type CreatePostBoxProps = {
  onCreated?: () => void;
};

type SelectedImage = {
  file: File;
  url: string;
};

const MAX_IMAGES = 4;

export default function CreatePostBox({ onCreated }: CreatePostBoxProps) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const showLoading = useGlobalLoadingStore((state) => state.showLoading);
  const hideLoading = useGlobalLoadingStore((state) => state.hideLoading);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<SelectedImage[]>([]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, []);

  const openComposer = () => {
    setOpen(true);
    setError("");
  };

  const closeComposer = (force = false) => {
    if (submitting && !force) return;
    setOpen(false);
    setBody("");
    setError("");
    setImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.url));
      return [];
    });
  };

  const chooseImages = () => {
    openComposer();
    window.setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, MAX_IMAGES - images.length);

    if (files.length === 0) {
      event.target.value = "";
      return;
    }

    setImages((current) => [
      ...current,
      ...files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    ]);
    event.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target.url);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handleSubmit = async () => {
    const content = body.trim();
    if (!content) {
      setError("Vui long nhap noi dung bai viet");
      return;
    }

    setSubmitting(true);
    showLoading("Đang đăng bài...");
    setError("");

    try {
      await createSocialPost({
        postType: "QUESTION",
        body: content,
        media: images.map((image) => image.file),
      });
      closeComposer(true);
      onCreated?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Dang bai viet that bai");
    } finally {
      setSubmitting(false);
      hideLoading();
    }
  };

  return (
    <>
      <div className="create-post">
        <button className="create-post-input" type="button" onClick={openComposer}>
          Bạn đang nghĩ gì?
        </button>

        <div className="create-actions">
          <button type="button" onClick={chooseImages}>
            <Image size={18} />
            Hình ảnh
          </button>
        </div>
      </div>

      {open && (
        <div className="create-post-modal-backdrop" role="presentation">
          <section
            aria-labelledby="create-post-title"
            className="create-post-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="create-post-modal-header">
              <h3 id="create-post-title">Tạo bài viết</h3>
              <button
                aria-label="Đóng"
                className="create-post-close"
                type="button"
                onClick={() => closeComposer()}
              >
                <X size={20} />
              </button>
            </div>

            <textarea
              autoFocus
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Làm sao để kiểm tra sản phẩm này chính hãng?"
              rows={5}
            />

            {images.length > 0 && (
              <div className="create-post-preview-grid">
                {images.map((image, index) => (
                  <div className="create-post-preview" key={image.url}>
                    <img src={image.url} alt={`Ảnh đã chọn ${index + 1}`} />
                    <button
                      aria-label="Xóa ảnh"
                      type="button"
                      onClick={() => removeImage(index)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="create-post-media-row">
              <span>{images.length}/{MAX_IMAGES} ảnh</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= MAX_IMAGES}
              >
                <Image size={18} />
                Chọn ảnh
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleImageChange}
            />

            {error && <p className="create-post-error">{error}</p>}

            <button
              className="create-post-submit"
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Đang đăng..." : "Đăng bài"}
            </button>
          </section>
        </div>
      )}
    </>
  );
}
