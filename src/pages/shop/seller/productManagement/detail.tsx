import {
  ArrowLeft,
  BadgeCheck,
  Barcode,
  Box,
  CalendarDays,
  ImageIcon,
  Layers,
  Package,
  Pencil,
  Plus,
  Ruler,
  Save,
  Star,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  fetchOfferVariants,
  fetchOfferMedia,
  fetchOfferDetail,
  deleteOfferVariant,
  updateOfferVariant,
  updateOffer,
  addOfferImages,
  deleteOfferImage,
  setOfferPrimaryImage,
  type OfferDetail,
  type OfferMedia,
  type OfferVariant,
  type UpdateOfferPayload,
} from "../../../../services/product.api";
import { formatVnd } from "../../../../ultil/currency";
import "../../../../css/pages/productManagement.css";

const statusLabels: Record<string, string> = {
  active: "Trên kệ",
  inactive: "Đã vô hiệu hóa",
  draft: "Bản nháp",
  pending: "Đang xét duyệt",
  approved: "Đã duyệt",
  rejected: "Không thành công",
  banned: "Bị cấm",
};

const MAX_PRODUCT_IMAGES = 4;

const getStatusClass = (status?: string) => {
  const value = String(status ?? "").toLowerCase();
  if (value === "active" || value === "approved") return "active";
  if (value === "inactive" || value === "rejected" || value === "banned") {
    return "failed";
  }
  return "review";
};

const getStatusLabel = (status?: string) => {
  const value = String(status ?? "").toLowerCase();
  return statusLabels[value] ?? status ?? "Không rõ";
};

const formatDate = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
};

const formatMoney = (value?: number, currency = "VND") => {
  if (typeof value !== "number") return "--";
  return formatVnd(value, currency);
};

const displayValue = (value?: number | string | null) => {
  if (value === undefined || value === null || value === "") return "--";
  return String(value);
};

const displayUnit = (value: number | string | null | undefined, unit: string) =>
  value === undefined || value === null || value === "" ? "--" : `${value} ${unit}`;

const getVariantDisplayName = (offer: OfferDetail, variant: OfferVariant) => {
  if (variant.optionValues?.length) {
    return variant.optionValues.map((value) => value.text).join(" - ");
  }

  const valueIds = variant.optionValueIds ?? [];
  const values = (offer.optionGroups ?? []).flatMap((group) =>
    group.values
      .filter((value) => valueIds.includes(value.id))
      .map((value) => value.text),
  );

  return values.join(" - ") || "--";
};

type UpdateOfferForm = Omit<
  UpdateOfferPayload,
  | "price"
  | "availableQuantity"
  | "parcelWeightGrams"
  | "parcelLengthCm"
  | "parcelWidthCm"
  | "parcelHeightCm"
> & {
  price: string;
  availableQuantity: string;
  parcelWeightGrams: string;
  parcelLengthCm: string;
  parcelWidthCm: string;
  parcelHeightCm: string;
};

const initialUpdateForm: UpdateOfferForm = {
  title: "",
  description: "",
  price: "",
  availableQuantity: "",
  parcelWeightGrams: "",
  parcelLengthCm: "",
  parcelWidthCm: "",
  parcelHeightCm: "",
  offerStatus: "active",
};

const toFormNumber = (value?: number | string | null) =>
  value === undefined || value === null ? "" : String(value);

const toPayloadNumber = (value: string) => Number(value || 0);

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: number | string | null;
}) {
  return (
    <div className="seller-product-detail-info-item">
      {icon}
      <div>
        <small>{label}</small>
        <strong>{displayValue(value)}</strong>
      </div>
    </div>
  );
}

function ProductDetailLoading() {
  return (
    <div
      className="seller-product-detail-loading"
      role="status"
      aria-live="polite"
      aria-label="Dang tai chi tiet san pham"
    >
      <div className="seller-product-detail-loading-hero" aria-hidden="true">
        <span />
        <div>
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="seller-product-detail-loading-grid" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
    </div>
  );
}

function OfferOptionsAndVariants({ offer }: { offer: OfferDetail }) {
  const optionGroups = offer.optionGroups ?? [];
  const [variants, setVariants] = useState<OfferVariant[]>([]);
  const [deletedVariants, setDeletedVariants] = useState<OfferVariant[]>([]);
  const [forms, setForms] = useState<Record<string, VariantForm>>({});
  const [showDeleted, setShowDeleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");

  const loadActiveVariants = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOfferVariants(offer.id, true);
      setVariants(data);
      setForms(
        data.reduce<Record<string, VariantForm>>((result, variant) => {
          result[variant.id] = {
            priceOverride: toFormNumber(variant.priceOverride ?? variant.price),
            availableQuantity: toFormNumber(variant.availableQuantity),
          };
          return result;
        }, {}),
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không thể tải variant");
    } finally {
      setLoading(false);
    }
  }, [offer.id]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void loadActiveVariants();
    });
    return () => {
      active = false;
    };
  }, [loadActiveVariants]);

  const loadDeletedVariants = async () => {
    setShowDeleted(true);
    try {
      const data = await fetchOfferVariants(offer.id, false);
      setDeletedVariants(data.filter((variant) => !variant.isActive));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không thể tải variant đã xóa");
    }
  };

  const updateVariantField = (
    variantId: string,
    field: keyof VariantForm,
    value: string,
  ) => {
    setForms((current) => ({
      ...current,
      [variantId]: { ...current[variantId], [field]: value },
    }));
  };

  const saveVariant = async (variantId: string) => {
    const form = forms[variantId];
    if (!form || savingId) return;

    const priceOverride = form.priceOverride.trim() === "" ? null : Number(form.priceOverride);
    const availableQuantity = Number(form.availableQuantity || 0);
    if (
      (priceOverride !== null && (Number.isNaN(priceOverride) || priceOverride < 0)) ||
      Number.isNaN(availableQuantity) ||
      availableQuantity < 0
    ) {
      toast.error("Giá và tồn kho variant không hợp lệ");
      return;
    }

    setSavingId(variantId);
    try {
      const updatedVariant = await updateOfferVariant(offer.id, variantId, {
        priceOverride,
        availableQuantity,
      });
      setVariants((current) =>
        current.map((variant) =>
          variant.id === variantId ? { ...variant, ...updatedVariant } : variant,
        ),
      );
      toast.success("Cập nhật variant thành công");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không thể cập nhật variant");
    } finally {
      setSavingId("");
    }
  };

  const removeVariant = async (variantId: string) => {
    if (savingId) return;
    setSavingId(variantId);
    try {
      await deleteOfferVariant(offer.id, variantId);
      setVariants((current) => current.filter((variant) => variant.id !== variantId));
      toast.success("Đã xóa variant");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không thể xóa variant");
    } finally {
      setSavingId("");
    }
  };

  const restoreVariant = async (variant: OfferVariant) => {
    if (savingId) return;
    setSavingId(variant.id);
    try {
      await updateOfferVariant(offer.id, variant.id, {
        isActive: true,
      });
      const restoredVariant = { ...variant, isActive: true };
      setDeletedVariants((current) => current.filter((item) => item.id !== variant.id));
      setVariants((current) => [...current, restoredVariant]);
      setForms((current) => ({
        ...current,
        [variant.id]: {
          priceOverride: toFormNumber(restoredVariant.priceOverride ?? restoredVariant.price),
          availableQuantity: toFormNumber(restoredVariant.availableQuantity),
        },
      }));
      toast.success("Đã thêm lại variant");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không thể thêm lại variant");
    } finally {
      setSavingId("");
    }
  };

  if (optionGroups.length === 0 && variants.length === 0) return null;

  return (
    <section className="seller-product-detail-section">
      <div className="seller-product-detail-section-head">
        <Layers size={18} />
        <h2>Phân loại sản phẩm</h2>
      </div>

      {optionGroups.length > 0 && (
        <div className="seller-product-option-groups">
          {optionGroups.map((group) => (
            <div className="seller-product-option-group" key={group.id}>
              <strong>{group.displayName}</strong>
              <div>
                {group.values.map((value) => (
                  <span key={value.id}>
                    {value.mediaAsset?.secureUrl && (
                      <img src={value.mediaAsset.secureUrl} alt={value.text} />
                    )}
                    {value.text}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="seller-product-variant-table">
        {loading && <div className="seller-product-detail-state">Đang tải variant...</div>}
        {!loading && variants.length === 0 && (
          <div className="seller-product-detail-empty">Không còn variant đang hoạt động.</div>
        )}
        {!loading && variants.map((variant) => {
          const form = forms[variant.id] ?? toVariantForm(variant);
          return (
            <div className="seller-product-variant-row" key={variant.id}>
              <strong>{getVariantDisplayName(offer, variant)}</strong>
              <label>
                <span>Giá</span>
                <input
                  type="number"
                  min="0"
                  value={form.priceOverride}
                  disabled={savingId === variant.id}
                  onChange={(event) => updateVariantField(variant.id, "priceOverride", event.target.value)}
                />
              </label>
              <label>
                <span>Tồn kho</span>
                <input
                  type="number"
                  min="0"
                  value={form.availableQuantity}
                  disabled={savingId === variant.id}
                  onChange={(event) => updateVariantField(variant.id, "availableQuantity", event.target.value)}
                />
              </label>
              <div className="seller-product-variant-actions">
                <button type="button" onClick={() => saveVariant(variant.id)} disabled={savingId === variant.id}>
                  <Save size={16} />
                  Lưu
                </button>
                <button
                  type="button"
                  className="seller-product-variant-delete"
                  title="Xóa variant"
                  aria-label={`Xóa variant ${getVariantDisplayName(offer, variant)}`}
                  onClick={() => removeVariant(variant.id)}
                  disabled={savingId === variant.id}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="seller-product-variant-recovery">
        <button type="button" className="seller-product-variant-add" onClick={loadDeletedVariants}>
          <Plus size={17} />
          Thêm mới
        </button>
        {showDeleted && (
          <div className="seller-product-deleted-list">
            <strong>Variant đã xóa</strong>
            {deletedVariants.length === 0 ? (
              <span>Không có variant đã xóa.</span>
            ) : (
              deletedVariants.map((variant) => (
                <div key={variant.id}>
                  <span>{getVariantDisplayName(offer, variant)}</span>
                  <button type="button" onClick={() => restoreVariant(variant)} disabled={savingId === variant.id}>
                    <Plus size={15} />
                    Thêm lại
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}

type VariantForm = {
  priceOverride: string;
  availableQuantity: string;
};

const toVariantForm = (variant: OfferVariant): VariantForm => ({
  priceOverride: toFormNumber(variant.priceOverride ?? variant.price),
  availableQuantity: toFormNumber(variant.availableQuantity),
});

const getVariantComboName = (offer: OfferDetail, variant: OfferVariant) => {
  if (variant.optionValues?.length) {
    return variant.optionValues.map((value) => value.text).join(" - ");
  }

  return (offer.optionGroups ?? [])
    .flatMap((group) =>
      group.values
        .filter((value) => (variant.optionValueIds ?? []).includes(value.id))
        .map((value) => value.text),
    )
    .join(" - ");
};

export function VariantUpdatePanel({
  offer,
  onVariantUpdated,
}: {
  offer: OfferDetail;
  onVariantUpdated: (variant: OfferVariant) => void;
}) {
  const [variants, setVariants] = useState<OfferVariant[]>([]);
  const [forms, setForms] = useState<Record<string, VariantForm>>({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [loadError, setLoadError] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  const loadVariants = useCallback(async (isActive?: boolean) => {
    if (!offer.id) return;

    setLoading(true);
    setLoadError("");
    try {
      const data = await fetchOfferVariants(offer.id, isActive);
      setVariants(data);
      setForms(
        data.reduce<Record<string, VariantForm>>((result, variant) => {
          result[variant.id] = toVariantForm(variant);
          return result;
        }, {}),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể tải variants";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [offer.id]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void loadVariants(showOnlyActive ? true : undefined);
    });
    return () => {
      active = false;
    };
  }, [loadVariants, showOnlyActive]);

  const updateVariantField = <K extends keyof VariantForm>(
    variantId: string,
    field: K,
    value: VariantForm[K],
  ) => {
    setForms((current) => ({
      ...current,
      [variantId]: {
        ...current[variantId],
        [field]: value,
      },
    }));
  };

  const saveVariant = async (variantId: string) => {
    const form = forms[variantId];
    if (!form || savingId) return;

    const availableQuantity = Number(form.availableQuantity || 0);
    const priceOverride =
      form.priceOverride.trim() === "" ? null : Number(form.priceOverride);

    if (Number.isNaN(availableQuantity) || availableQuantity < 0) {
      toast.error("Tồn kho variant không hợp lệ");
      return;
    }

    if (priceOverride !== null && (Number.isNaN(priceOverride) || priceOverride < 0)) {
      toast.error("Giá variant không hợp lệ");
      return;
    }

    setSavingId(variantId);
    try {
      const updatedVariant = await updateOfferVariant(offer.id, variantId, {
        priceOverride,
        availableQuantity,
      });

      setVariants((current) =>
        current.map((variant) =>
          variant.id === variantId ? { ...variant, ...updatedVariant } : variant,
        ),
      );
      onVariantUpdated(updatedVariant);
      toast.success("Cập nhật variant thành công");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không thể cập nhật variant");
    } finally {
      setSavingId("");
    }
  };

  return (
    <section className="seller-product-detail-section">
      <div className="seller-product-detail-section-head seller-product-variant-edit-head">
        <Layers size={18} />
        <h2>Cập nhật variant</h2>
        <label>
          <input
            type="checkbox"
            checked={showOnlyActive}
            onChange={(event) => setShowOnlyActive(event.target.checked)}
          />
          Chỉ variant đang bán
        </label>
      </div>

      {loading && <div className="seller-product-detail-state">Đang tải variants...</div>}

      {!loading && loadError && (
        <div className="seller-product-detail-state error">
          {loadError}
          <button
            type="button"
            onClick={() => loadVariants(showOnlyActive ? true : undefined)}
          >
            Tải lại
          </button>
        </div>
      )}

      {!loading && !loadError && variants.length === 0 && (
        <div className="seller-product-detail-empty">Chưa có variant để cập nhật.</div>
      )}

      {!loading && !loadError && variants.length > 0 && (
        <div className="seller-product-variant-edit-list">
          {variants.map((variant) => {
            const form = forms[variant.id] ?? toVariantForm(variant);
            const comboName = getVariantComboName(offer, variant);
            return (
              <div className="seller-product-variant-edit-row" key={variant.id}>
                <div className="seller-product-variant-edit-media">
                  {variant.mediaAsset?.secureUrl ? (
                    <img
                      src={variant.mediaAsset.secureUrl}
                      alt={comboName || "Anh variant"}
                    />
                  ) : (
                    <ImageIcon size={24} />
                  )}
                </div>
                <div className="seller-product-variant-combo">
                  <strong>{comboName || "Chưa có cặp phân loại"}</strong>
                  <small>Chưa có cặp phân loại</small>
                </div>

                <label className="seller-product-variant-sku-input">
                  <span>SKU</span>
                  <input
                    value=""
                    disabled={savingId === variant.id}
                    onChange={(event) =>
                      event.currentTarget.blur()
                    }
                  />
                </label>

                <label>
                  <span>Giá variant</span>
                  <input
                    type="number"
                    min="0"
                    value={form.priceOverride}
                    disabled={savingId === variant.id}
                    placeholder={formatMoney(offer.price, offer.currency)}
                    onChange={(event) =>
                      updateVariantField(
                        variant.id,
                        "priceOverride",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>Tồn kho</span>
                  <input
                    type="number"
                    min="0"
                    value={form.availableQuantity}
                    disabled={savingId === variant.id}
                    onChange={(event) =>
                      updateVariantField(
                        variant.id,
                        "availableQuantity",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label className="seller-product-variant-active">
                  <input
                    type="checkbox"
                    checked={variant.isActive}
                    disabled={savingId === variant.id}
                    onChange={(event) =>
                      event.currentTarget.blur()
                    }
                  />
                  Đang bán
                </label>

                <button
                  type="button"
                  disabled={savingId === variant.id}
                  onClick={() => saveVariant(variant.id)}
                >
                  {savingId === variant.id ? "Đang lưu..." : "Lưu variant"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function SellerProductDetail() {
  const { offerId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [form, setForm] = useState<UpdateOfferForm>(initialUpdateForm);
  const editing = searchParams.get("edit") === "1";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [media, setMedia] = useState<OfferMedia[]>([]);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [mediaEditorOpen, setMediaEditorOpen] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fillFormFromOffer = (data: OfferDetail) => {
    setForm({
      title: data.title ?? "",
      description: data.description ?? "",
      price: toFormNumber(data.price),
      availableQuantity: toFormNumber(data.availableQuantity),
      parcelWeightGrams: toFormNumber(data.parcelWeightGrams),
      parcelLengthCm: toFormNumber(data.parcelLengthCm),
      parcelWidthCm: toFormNumber(data.parcelWidthCm),
      parcelHeightCm: toFormNumber(data.parcelHeightCm),
      offerStatus:
        data.offerStatus === "inactive" || data.offerStatus === "draft"
          ? data.offerStatus
          : "active",
    });
  };

  useEffect(() => {
    const loadOffer = async () => {
      if (!offerId) {
        setError("Không tìm thấy mã sản phẩm");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setMediaLoaded(false);
      setMedia([]);

      try {
        const [data, mediaItems] = await Promise.all([
          fetchOfferDetail(offerId),
          fetchOfferMedia(offerId),
        ]);
        setOffer(data);
        setMedia(mediaItems);
        setMediaLoaded(true);
        fillFormFromOffer(data);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải chi tiết sản phẩm",
        );
      } finally {
        setLoading(false);
      }
    };

    loadOffer();
  }, [offerId]);

  const imageUrls = useMemo(() => {
    const images = [offer?.thumbnailUrl, ...(offer?.imageUrls ?? [])].filter(
      Boolean,
    ) as string[];
    return Array.from(new Set(images));
  }, [offer]);

  const updateField = <K extends keyof UpdateOfferForm>(
    field: K,
    value: UpdateOfferForm[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const buildPayload = (): UpdateOfferPayload => ({
    ...form,
    title: form.title.trim(),
    description: form.description.trim(),
    price: toPayloadNumber(form.price),
    availableQuantity: toPayloadNumber(form.availableQuantity),
    parcelWeightGrams: toPayloadNumber(form.parcelWeightGrams),
    parcelLengthCm: toPayloadNumber(form.parcelLengthCm),
    parcelWidthCm: toPayloadNumber(form.parcelWidthCm),
    parcelHeightCm: toPayloadNumber(form.parcelHeightCm),
  });

  const validatePayload = (payload: UpdateOfferPayload) => {
    if (!payload.title) return "Vui lòng nhập tên sản phẩm";
    if (!payload.description) return "Vui lòng nhập mô tả sản phẩm";
    if (payload.price <= 0) return "Giá sản phẩm phải lớn hơn 0";
    if (payload.availableQuantity < 0) return "Số lượng không được âm";
    if (
      payload.parcelWeightGrams <= 0 ||
      payload.parcelLengthCm <= 0 ||
      payload.parcelWidthCm <= 0 ||
      payload.parcelHeightCm <= 0
    ) {
      return "Vui lòng nhập cân nặng và kích thước hợp lệ";
    }
    return "";
  };

  const closeEditMode = () => {
    setSearchParams({});
    if (offer) fillFormFromOffer(offer);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!offerId || saving) return;

    const payload = buildPayload();
    const validationError = validatePayload(payload);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);

    try {
      const updatedOffer = await updateOffer(offerId, payload);
      const nextOffer = {
        ...offer,
        ...payload,
        ...updatedOffer,
      } as OfferDetail;

      setOffer(nextOffer);
      fillFormFromOffer(nextOffer);
      setSearchParams({});
      toast.success("Cập nhật sản phẩm thành công");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Không thể cập nhật sản phẩm",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelection = (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (selected.length === 0) return;
    const availableSlots = MAX_PRODUCT_IMAGES - media.length;
    if (selected.length > availableSlots) {
      toast.error(`Offer chỉ còn ${availableSlots} vị trí ảnh`);
      return;
    }

    const invalidFile = selected.find(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024,
    );
    if (invalidFile) {
      toast.error("Anh phai la JPG, PNG hoac WEBP va toi da 5MB");
      return;
    }

    setSelectedImages(selected);
  };

  const handleAddImages = async () => {
    if (!offerId || selectedImages.length === 0 || uploadingImages) return;
    setUploadingImages(true);
    try {
      await addOfferImages(offerId, selectedImages, media.length === 0);
      const [updatedOffer, mediaItems] = await Promise.all([
        fetchOfferDetail(offerId),
        fetchOfferMedia(offerId),
      ]);
      setOffer(updatedOffer);
      setMedia(mediaItems);
      setMediaLoaded(true);
      setSelectedImages([]);
      toast.success("Đã cập nhật ảnh sản phẩm");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không thể cập nhật ảnh sản phẩm");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (mediaItem: OfferMedia) => {
    if (!offerId || deletingMediaId || media.length <= 1) return;
    if (!window.confirm("Bạn có chắc muốn xóa ảnh này không?")) return;

    setDeletingMediaId(mediaItem.id);
    try {
      await deleteOfferImage(offerId, mediaItem.id);
      const [updatedOffer, mediaItems] = await Promise.all([
        fetchOfferDetail(offerId),
        fetchOfferMedia(offerId),
      ]);
      setOffer(updatedOffer);
      setMedia(mediaItems);
      setMediaLoaded(true);
      toast.success("Đã xóa ảnh sản phẩm");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không thể xóa ảnh sản phẩm");
    } finally {
      setDeletingMediaId(null);
    }
  };

  const handleSetPrimaryImage = async (mediaItem: OfferMedia) => {
    if (!offerId || mediaItem.mediaType === "thumbnail" || uploadingImages) return;
    setUploadingImages(true);
    try {
      await setOfferPrimaryImage(offerId, mediaItem.id);
      const [updatedOffer, mediaItems] = await Promise.all([
        fetchOfferDetail(offerId),
        fetchOfferMedia(offerId),
      ]);
      setOffer(updatedOffer);
      setMedia(mediaItems);
      setMediaLoaded(true);
      toast.success("Đã đặt ảnh đại diện");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không thể đặt ảnh đại diện");
    } finally {
      setUploadingImages(false);
    }
  };

  if (loading) {
    return (
      <div className="seller-product-page seller-product-detail-page">
        <ProductDetailLoading />
      </div>
    );
  }

  return (
    <div className="seller-product-page seller-product-detail-page">
      <Link className="seller-product-detail-back" to="/seller/products">
        <ArrowLeft size={16} />
        Quay lại quản lý sản phẩm
      </Link>

      {!loading && error && (
        <div className="seller-product-detail-state error">{error}</div>
      )}

      {!loading && !error && offer && (
        <>
          <section className="seller-product-detail-hero">
            <div className="seller-product-detail-cover">
              {offer.thumbnailUrl ? (
                <img src={offer.thumbnailUrl} alt={offer.title} />
              ) : (
                <ImageIcon size={36} />
              )}
            </div>

            <div className="seller-product-detail-summary">
              <div className="seller-product-detail-badges">
                <span
                  className={`seller-product-detail-status ${getStatusClass(
                    offer.offerStatus,
                  )}`}
                >
                  {getStatusLabel(offer.offerStatus)}
                </span>
                {/* <span
                  className={`seller-product-detail-status ${getStatusClass(
                    offer.moderationStatus,
                  )}`}
                >
                  {getStatusLabel(offer.moderationStatus)}
                </span> */}
              </div>

              <h1>{offer.title}</h1>
              <p>{offer.id}</p>
              <strong>{formatMoney(offer.price, offer.currency)}</strong>
              <button
                type="button"
                className="seller-product-detail-edit-btn"
                onClick={() => {
                  setSearchParams({ edit: "1" });
                }}
              >
                <Pencil size={16} />
                Cập nhật thông tin
              </button>
            </div>
          </section>

          {editing && (
            <section className="seller-product-detail-section">
              <div className="seller-product-detail-section-head">
                <Pencil size={18} />
                <h2>Cập nhật thông tin bán hàng</h2>
              </div>

              <form className="seller-product-update-form" onSubmit={handleSubmit}>
                <label className="seller-product-update-field wide">
                  <span>Tên sản phẩm</span>
                  <input
                    value={form.title}
                    disabled={saving}
                    onChange={(event) => updateField("title", event.target.value)}
                  />
                </label>

                <label className="seller-product-update-field wide">
                  <span>Mô tả</span>
                  <textarea
                    rows={4}
                    value={form.description}
                    disabled={saving}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                  />
                </label>

                <label className="seller-product-update-field">
                  <span>Giá bán</span>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    disabled={saving}
                    onChange={(event) => updateField("price", event.target.value)}
                  />
                </label>

                <label className="seller-product-update-field">
                  <span>Tồn kho</span>
                  <input
                    type="number"
                    min="0"
                    value={form.availableQuantity}
                    disabled={saving}
                    onChange={(event) =>
                      updateField("availableQuantity", event.target.value)
                    }
                  />
                </label>

                <label className="seller-product-update-field">
                  <span>Trạng thái bán</span>
                  <select
                    value={form.offerStatus}
                    disabled={saving}
                    onChange={(event) =>
                      updateField(
                        "offerStatus",
                        event.target.value as UpdateOfferForm["offerStatus"],
                      )
                    }
                  >
                    <option value="active">Đang bán</option>
                    <option value="inactive">Tạm ngưng</option>
                    <option value="draft">Bản nháp</option>
                  </select>
                </label>

                <label className="seller-product-update-field">
                  <span>Cân nặng (gram)</span>
                  <input
                    type="number"
                    min="0"
                    value={form.parcelWeightGrams}
                    disabled={saving}
                    onChange={(event) =>
                      updateField("parcelWeightGrams", event.target.value)
                    }
                  />
                </label>

                <label className="seller-product-update-field">
                  <span>Dài (cm)</span>
                  <input
                    type="number"
                    min="0"
                    value={form.parcelLengthCm}
                    disabled={saving}
                    onChange={(event) =>
                      updateField("parcelLengthCm", event.target.value)
                    }
                  />
                </label>

                <label className="seller-product-update-field">
                  <span>Rộng (cm)</span>
                  <input
                    type="number"
                    min="0"
                    value={form.parcelWidthCm}
                    disabled={saving}
                    onChange={(event) =>
                      updateField("parcelWidthCm", event.target.value)
                    }
                  />
                </label>

                <label className="seller-product-update-field">
                  <span>Cao (cm)</span>
                  <input
                    type="number"
                    min="0"
                    value={form.parcelHeightCm}
                    disabled={saving}
                    onChange={(event) =>
                      updateField("parcelHeightCm", event.target.value)
                    }
                  />
                </label>

                <div className="seller-product-update-actions">
                  <button type="button" className="ghost" onClick={closeEditMode}>
                    <X size={16} />
                    Hủy
                  </button>
                  <button type="submit" disabled={saving}>
                    <Save size={16} />
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="seller-product-detail-section">
            <div className="seller-product-detail-section-head">
              <Package size={18} />
              <h2>Thông tin sản phẩm</h2>
            </div>

            <p className="seller-product-detail-description">
              {offer.description || "Sản phẩm chưa có mô tả."}
            </p>

            <div className="seller-product-detail-info-grid">
              <InfoItem
                icon={<Tags size={16} />}
                label="Danh mục"
                value={offer.categoryName || offer.categoryId}
              />
              <InfoItem
                icon={<Package size={16} />}
                label="Model"
                value={offer.productModelName}
              />
              <InfoItem icon={<Barcode size={16} />} label="GTIN" value={offer.gtin} />
              <InfoItem
                icon={<Box size={16} />}
                label="Tồn kho"
                value={offer.availableQuantity}
              />
              <InfoItem
                icon={<BadgeCheck size={16} />}
                label="Đã bán"
                value={offer.soldQuantity}
              />
              <InfoItem
                icon={<CalendarDays size={16} />}
                label="Ngày tạo"
                value={formatDate(offer.createdAt)}
              />
            </div>
          </section>

          <OfferOptionsAndVariants offer={offer} />

          <section className="seller-product-detail-section">
            <div className="seller-product-detail-section-head seller-product-detail-media-head">
              <div className="seller-product-detail-section-title">
                <ImageIcon size={18} />
                <h2>Hình ảnh sản phẩm</h2>
              </div>
              <button
                type="button"
                className="seller-product-detail-media-toggle"
                onClick={() => {
                  setMediaEditorOpen((current) => !current);
                  setSelectedImages([]);
                }}
              >
                {mediaEditorOpen ? "Đóng" : "Cập nhật ảnh"}
              </button>
            </div>

            {mediaEditorOpen && (
              <div className="seller-product-detail-media-editor">
                <div className="seller-product-detail-media-editor-heading">
                  <strong>Danh sách ảnh ({media.length}/{MAX_PRODUCT_IMAGES})</strong>
                  <span>Ảnh có nhãn đại diện sẽ dùng cho sản phẩm và flash sale.</span>
                </div>

                <div className="seller-product-detail-media-grid">
                  {media.map((mediaItem) => (
                    <div className="seller-product-detail-media-card" key={mediaItem.id}>
                      <img src={mediaItem.fileUrl} alt={offer.title} />
                      <button
                        type="button"
                        className="seller-product-detail-media-remove"
                        aria-label={`Xóa ảnh ${offer.title}`}
                        title="Xóa ảnh"
                        disabled={deletingMediaId === mediaItem.id || media.length <= 1}
                        onClick={() => void handleDeleteImage(mediaItem)}
                      >
                        <X size={15} />
                      </button>
                      {mediaItem.mediaType === "thumbnail" ? (
                        <span className="seller-product-detail-media-primary">
                          <Star size={13} /> Ảnh đại diện
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="seller-product-detail-media-primary-action"
                          disabled={uploadingImages}
                          onClick={() => void handleSetPrimaryImage(mediaItem)}
                        >
                          Đặt làm đại diện
                        </button>
                      )}
                    </div>
                  ))}

                  {media.length < MAX_PRODUCT_IMAGES && (
                    <label className="seller-product-detail-media-add">
                      <Plus size={22} />
                      <span>Thêm ảnh</span>
                      <small>Còn {MAX_PRODUCT_IMAGES - media.length} vị trí</small>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        disabled={uploadingImages}
                        onChange={(event) => {
                          handleImageSelection(event.target.files);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>

                {selectedImages.length > 0 && (
                  <div className="seller-product-detail-media-selection">
                    Đã chọn {selectedImages.length} ảnh mới. Bấm cập nhật để tải lên Cloudinary.
                  </div>
                )}

                <div className="seller-product-detail-media-actions">
                  <button
                    type="button"
                    disabled={selectedImages.length === 0 || uploadingImages}
                    onClick={() => void handleAddImages()}
                  >
                    {uploadingImages ? "Đang cập nhật..." : "Cập nhật"}
                  </button>
                </div>
              </div>
            )}

            {(mediaLoaded ? media.length : imageUrls.length) > 0 ? (
              <div className="seller-product-detail-gallery">
                {mediaLoaded
                  ? media.map((mediaItem) => (
                      <a
                        key={mediaItem.id}
                        href={mediaItem.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img src={mediaItem.fileUrl} alt={offer.title} />
                      </a>
                    ))
                  : imageUrls.map((imageUrl) => (
                      <a key={imageUrl} href={imageUrl} target="_blank" rel="noreferrer">
                        <img src={imageUrl} alt={offer.title} />
                      </a>
                    ))}
              </div>
            ) : (
              <div className="seller-product-detail-empty">
                Sản phẩm chưa có hình ảnh.
              </div>
            )}
          </section>

          <section className="seller-product-detail-section">
            <div className="seller-product-detail-section-head">
              <Ruler size={18} />
              <h2>Thông số vận chuyển</h2>
            </div>

            <div className="seller-product-detail-info-grid">
              <InfoItem
                icon={<Box size={16} />}
                label="Cân nặng"
                value={displayUnit(offer.parcelWeightGrams, "gram")}
              />
              <InfoItem
                icon={<Ruler size={16} />}
                label="Dài"
                value={displayUnit(offer.parcelLengthCm, "cm")}
              />
              <InfoItem
                icon={<Ruler size={16} />}
                label="Rộng"
                value={displayUnit(offer.parcelWidthCm, "cm")}
              />
              <InfoItem
                icon={<Ruler size={16} />}
                label="Cao"
                value={displayUnit(offer.parcelHeightCm, "cm")}
              />
              <InfoItem
                icon={<Layers size={16} />}
                label="Tình trạng"
                value={offer.itemCondition}
              />
              <InfoItem
                icon={<BadgeCheck size={16} />}
                label="Chính sách xác minh"
                value={offer.verificationPolicy}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
