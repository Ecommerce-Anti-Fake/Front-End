import { useState } from "react";
import {
  CalendarClock,
  CircleDollarSign,
  Info,
  Layers3,
  Percent,
  Save,
  ShieldCheck,
  Tag,
  Ticket,
  Truck,
  UsersRound,
} from "lucide-react";
import type {
  VoucherCreatePayload,
  VoucherDiscountType,
  VoucherFormErrors,
  VoucherFormState,
  VoucherScopeType,
} from "./form";
import {
  buildVoucherPayload,
  createInitialVoucherForm,
  formatVoucherAmount,
  validateVoucherForm,
} from "./form";

type VoucherFormProps = {
  onSubmit: (payload: VoucherCreatePayload) => Promise<boolean>;
};

const discountOptions: Array<{
  value: VoucherDiscountType;
  label: string;
  description: string;
}> = [
  {
    value: "PERCENTAGE",
    label: "Giảm theo phần trăm",
    description: "Giảm theo giá trị đơn, có thể đặt mức giảm tối đa.",
  },
  {
    value: "FIXED_AMOUNT",
    label: "Giảm số tiền cố định",
    description: "Trừ trực tiếp một số tiền trên đơn đủ điều kiện.",
  },
  {
    value: "FREE_SHIPPING",
    label: "Miễn phí vận chuyển",
    description: "Hỗ trợ phí ship, có thể giới hạn số tiền được hỗ trợ.",
  },
];

const scopeOptions: Array<{ value: VoucherScopeType; label: string }> = [
  { value: "ALL", label: "Toàn sàn" },
  { value: "SHOP", label: "Shop được chỉ định" },
  { value: "OFFER", label: "Sản phẩm / offer" },
  { value: "VARIANT", label: "Phân loại sản phẩm" },
];

function formatDateTime(value: string) {
  if (!value) return "Chưa chọn thời gian";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa chọn thời gian";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function fieldId(name: keyof VoucherFormState) {
  return `voucher-${name}`;
}

function FieldError({ name, errors }: { name: keyof VoucherFormState; errors: VoucherFormErrors }) {
  const message = errors[name];
  return message ? <small className="voucher-field-error" id={`${fieldId(name)}-error`}>{message}</small> : null;
}

export default function VoucherForm({ onSubmit }: VoucherFormProps) {
  const [form, setForm] = useState<VoucherFormState>(createInitialVoucherForm);
  const [errors, setErrors] = useState<VoucherFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = <K extends keyof VoucherFormState>(field: K, value: VoucherFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateVoucherForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const created = await onSubmit(buildVoucherPayload(form));
      if (created) {
        setForm(createInitialVoucherForm());
        setErrors({});
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDiscount = discountOptions.find((option) => option.value === form.discountType);
  const scopeLabel = scopeOptions.find((option) => option.value === form.scopeType)?.label;
  const discountPreview =
    form.discountType === "PERCENTAGE"
      ? `${form.percentage || "0"}% giá trị đơn`
      : form.discountType === "FIXED_AMOUNT"
        ? formatVoucherAmount(Number(form.fixedAmount || 0))
        : "Hỗ trợ phí vận chuyển";

  return (
    <form className="voucher-create-card" onSubmit={submit} noValidate>
      <div className="voucher-card-heading">
        <div>
          <span className="voucher-eyebrow"><Ticket size={15} /> ƯU ĐÃI PLATFORM</span>
          <h2>Tạo voucher hệ thống</h2>
          <p>Thiết lập đầy đủ điều kiện áp dụng trước khi kích hoạt cho người mua.</p>
        </div>
        <div className="voucher-heading-icon" aria-hidden="true"><ShieldCheck size={24} /></div>
      </div>

      <div className="voucher-form-layout">
        <div className="voucher-form-main">
          <fieldset className="voucher-fieldset">
            <legend>Thông tin cơ bản</legend>
            <div className="voucher-form-grid voucher-form-grid--two">
              <label className="voucher-field">
                <span>Mã voucher <b>*</b></span>
                <input
                  id={fieldId("code")}
                  value={form.code}
                  onChange={(event) => update("code", event.target.value.toUpperCase())}
                  placeholder="VD: WELCOME10"
                  autoComplete="off"
                  maxLength={40}
                  required
                  aria-invalid={Boolean(errors.code)}
                  aria-describedby={errors.code ? `${fieldId("code")}-error` : undefined}
                />
                <small>Mã sẽ được chuẩn hóa thành chữ in hoa.</small>
                <FieldError name="code" errors={errors} />
              </label>
              <label className="voucher-field">
                <span>Tên chương trình <b>*</b></span>
                <input
                  id={fieldId("name")}
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="VD: Ưu đãi chào mừng thành viên mới"
                  maxLength={120}
                  required
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? `${fieldId("name")}-error` : undefined}
                />
                <small>Tên này hiển thị trong danh sách và checkout.</small>
                <FieldError name="name" errors={errors} />
              </label>
            </div>
          </fieldset>

          <fieldset className="voucher-fieldset">
            <legend>Giá trị ưu đãi</legend>
            <div className="voucher-form-grid voucher-form-grid--two">
              <label className="voucher-field">
                <span>Loại giảm <b>*</b></span>
                <select
                  id={fieldId("discountType")}
                  value={form.discountType}
                  onChange={(event) => update("discountType", event.target.value as VoucherDiscountType)}
                >
                  {discountOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <small>{selectedDiscount?.description}</small>
              </label>
              {form.discountType === "PERCENTAGE" && (
                <label className="voucher-field">
                  <span>Mức giảm (%) <b>*</b></span>
                  <span className="voucher-input-with-icon"><Percent size={16} /><input id={fieldId("percentage")} type="number" min="0.01" max="100" step="0.01" value={form.percentage} onChange={(event) => update("percentage", event.target.value)} placeholder="10" required aria-invalid={Boolean(errors.percentage)} aria-describedby={errors.percentage ? `${fieldId("percentage")}-error` : undefined} /></span>
                  <small>Nhập từ 0,01% đến 100%.</small>
                  <FieldError name="percentage" errors={errors} />
                </label>
              )}
              {form.discountType === "FIXED_AMOUNT" && (
                <label className="voucher-field">
                  <span>Số tiền giảm (VNĐ) <b>*</b></span>
                  <span className="voucher-input-with-icon"><CircleDollarSign size={16} /><input id={fieldId("fixedAmount")} type="number" min="1" step="1000" value={form.fixedAmount} onChange={(event) => update("fixedAmount", event.target.value)} placeholder="50000" required aria-invalid={Boolean(errors.fixedAmount)} aria-describedby={errors.fixedAmount ? `${fieldId("fixedAmount")}-error` : undefined} /></span>
                  <small>Không vượt quá giá trị đơn đủ điều kiện.</small>
                  <FieldError name="fixedAmount" errors={errors} />
                </label>
              )}
              {form.discountType === "FREE_SHIPPING" && (
                <label className="voucher-field">
                  <span>Giới hạn hỗ trợ ship (VNĐ)</span>
                  <span className="voucher-input-with-icon"><Truck size={16} /><input id={fieldId("maxDiscountAmount")} type="number" min="1" step="1000" value={form.maxDiscountAmount} onChange={(event) => update("maxDiscountAmount", event.target.value)} placeholder="Để trống = miễn toàn bộ phí ship" aria-invalid={Boolean(errors.maxDiscountAmount)} aria-describedby={errors.maxDiscountAmount ? `${fieldId("maxDiscountAmount")}-error` : undefined} /></span>
                  <small>Để trống nếu platform hỗ trợ toàn bộ phí vận chuyển.</small>
                  <FieldError name="maxDiscountAmount" errors={errors} />
                </label>
              )}
              {form.discountType === "PERCENTAGE" && (
                <label className="voucher-field">
                  <span>Giảm tối đa (VNĐ)</span>
                  <span className="voucher-input-with-icon"><CircleDollarSign size={16} /><input id={fieldId("maxDiscountAmount")} type="number" min="1" step="1000" value={form.maxDiscountAmount} onChange={(event) => update("maxDiscountAmount", event.target.value)} placeholder="Để trống = không giới hạn" aria-invalid={Boolean(errors.maxDiscountAmount)} aria-describedby={errors.maxDiscountAmount ? `${fieldId("maxDiscountAmount")}-error` : undefined} /></span>
                  <small>Giúp kiểm soát ngân sách voucher phần trăm.</small>
                  <FieldError name="maxDiscountAmount" errors={errors} />
                </label>
              )}
              <label className="voucher-field">
                <span>Giá trị đơn tối thiểu (VNĐ) <b>*</b></span>
                <span className="voucher-input-with-icon"><CircleDollarSign size={16} /><input id={fieldId("minOrderAmount")} type="number" min="0" step="1000" value={form.minOrderAmount} onChange={(event) => update("minOrderAmount", event.target.value)} placeholder="0" required aria-invalid={Boolean(errors.minOrderAmount)} aria-describedby={errors.minOrderAmount ? `${fieldId("minOrderAmount")}-error` : undefined} /></span>
                <small>Nhập 0 nếu voucher áp dụng cho mọi giá trị đơn.</small>
                <FieldError name="minOrderAmount" errors={errors} />
              </label>
            </div>
          </fieldset>

          <fieldset className="voucher-fieldset">
            <legend>Phạm vi và giới hạn sử dụng</legend>
            <div className="voucher-form-grid voucher-form-grid--two">
              <label className="voucher-field">
                <span>Phạm vi áp dụng <b>*</b></span>
                <span className="voucher-input-with-icon"><Layers3 size={16} /><select id={fieldId("scopeType")} value={form.scopeType} onChange={(event) => update("scopeType", event.target.value as VoucherScopeType)}>{scopeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></span>
                <small>{form.scopeType === "ALL" ? "Voucher dùng được cho mọi shop và sản phẩm." : "Chọn mã ở ô bên cạnh, phân tách bằng dấu phẩy hoặc xuống dòng."}</small>
              </label>
              <label className={`voucher-field ${form.scopeType === "ALL" ? "is-disabled" : ""}`}>
                <span>Mã đối tượng áp dụng {form.scopeType !== "ALL" && <b>*</b>}</span>
                <textarea id={fieldId("scopeIds")} value={form.scopeIds} onChange={(event) => update("scopeIds", event.target.value)} placeholder={form.scopeType === "ALL" ? "Không cần nhập khi chọn Toàn sàn" : "offer-1, offer-2"} rows={2} disabled={form.scopeType === "ALL"} aria-invalid={Boolean(errors.scopeIds)} aria-describedby={errors.scopeIds ? `${fieldId("scopeIds")}-error` : undefined} />
                <small>{form.scopeType === "ALL" ? "" : "Backend sẽ kiểm tra lại scope khi báo giá và checkout."}</small>
                <FieldError name="scopeIds" errors={errors} />
              </label>
              <label className="voucher-field">
                <span>Tổng lượt sử dụng</span>
                <span className="voucher-input-with-icon"><UsersRound size={16} /><input id={fieldId("totalUsageLimit")} type="number" min="1" step="1" value={form.totalUsageLimit} onChange={(event) => update("totalUsageLimit", event.target.value)} placeholder="Để trống = không giới hạn" aria-invalid={Boolean(errors.totalUsageLimit)} aria-describedby={errors.totalUsageLimit ? `${fieldId("totalUsageLimit")}-error` : undefined} /></span>
                <small>Giới hạn trên toàn hệ thống.</small>
                <FieldError name="totalUsageLimit" errors={errors} />
              </label>
              <label className="voucher-field">
                <span>Lượt dùng mỗi người</span>
                <span className="voucher-input-with-icon"><UsersRound size={16} /><input id={fieldId("userUsageLimit")} type="number" min="1" step="1" value={form.userUsageLimit} onChange={(event) => update("userUsageLimit", event.target.value)} placeholder="Để trống = không giới hạn" aria-invalid={Boolean(errors.userUsageLimit)} aria-describedby={errors.userUsageLimit ? `${fieldId("userUsageLimit")}-error` : undefined} /></span>
                <small>Giúp tránh một tài khoản dùng hết ngân sách.</small>
                <FieldError name="userUsageLimit" errors={errors} />
              </label>
            </div>
          </fieldset>

          <fieldset className="voucher-fieldset">
            <legend>Thời gian hiệu lực</legend>
            <div className="voucher-form-grid voucher-form-grid--two">
              <label className="voucher-field">
                <span>Bắt đầu <b>*</b></span>
                <span className="voucher-input-with-icon"><CalendarClock size={16} /><input id={fieldId("startsAt")} type="datetime-local" value={form.startsAt} onChange={(event) => update("startsAt", event.target.value)} required aria-invalid={Boolean(errors.startsAt)} aria-describedby={errors.startsAt ? `${fieldId("startsAt")}-error` : undefined} /></span>
                <FieldError name="startsAt" errors={errors} />
              </label>
              <label className="voucher-field">
                <span>Kết thúc <b>*</b></span>
                <span className="voucher-input-with-icon"><CalendarClock size={16} /><input id={fieldId("endsAt")} type="datetime-local" value={form.endsAt} onChange={(event) => update("endsAt", event.target.value)} required aria-invalid={Boolean(errors.endsAt)} aria-describedby={errors.endsAt ? `${fieldId("endsAt")}-error` : undefined} /></span>
                <FieldError name="endsAt" errors={errors} />
              </label>
            </div>
          </fieldset>

          <div className="voucher-form-actions">
            <p><Info size={16} /> Voucher mới tạo ở trạng thái <strong>Bản nháp</strong>. Hãy kiểm tra lại trước khi kích hoạt.</p>
            <button type="submit" className="admin-primary-btn" disabled={isSubmitting}>
              <Save size={17} /> {isSubmitting ? "Đang tạo..." : "Tạo voucher"}
            </button>
          </div>
        </div>

        <aside className="voucher-preview-card" aria-label="Xem trước voucher">
          <div className="voucher-preview-icon"><Tag size={20} /></div>
          <span className="voucher-eyebrow">XEM TRƯỚC</span>
          <strong className="voucher-preview-code">{form.code.trim().toUpperCase() || "MÃ VOUCHER"}</strong>
          <h3>{form.name.trim() || "Tên chương trình ưu đãi"}</h3>
          <div className="voucher-preview-discount">{discountPreview}</div>
          <dl className="voucher-preview-meta">
            <div><dt>Điều kiện đơn</dt><dd>{formatVoucherAmount(Number(form.minOrderAmount || 0))}</dd></div>
            <div><dt>Phạm vi</dt><dd>{scopeLabel}</dd></div>
            <div><dt>Hiệu lực từ</dt><dd>{formatDateTime(form.startsAt)}</dd></div>
            <div><dt>Đến</dt><dd>{formatDateTime(form.endsAt)}</dd></div>
          </dl>
          <div className="voucher-preview-note"><Info size={15} /> Backend sẽ revalidate mọi điều kiện tại quote và checkout.</div>
        </aside>
      </div>
    </form>
  );
}
