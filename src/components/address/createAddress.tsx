import { useEffect, useState } from "react";
import { User, Phone, MapPin } from "lucide-react";

import "../../css/components/address/createAddress.css";
import {
  createAddress,
  getAddressProvinces,
  getAddressWards,
} from "../../services/address.api";
import { toast } from "sonner";
import type { AddressProvince, AddressWard } from "../../type/address";
import { useGlobalLoadingStore } from "../../store/globalLoadingStore";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreateAddress({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const showLoading = useGlobalLoadingStore((state) => state.showLoading);
  const hideLoading = useGlobalLoadingStore((state) => state.hideLoading);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [provinces, setProvinces] = useState<AddressProvince[]>([]);
  const [wards, setWards] = useState<AddressWard[]>([]);

  const [form, setForm] = useState({
    recipientName: "",
    phone: "",
    addressLine: "",
    provinceCode: "",
    provinceName: "",
    wardCode: "",
    wardName: "",
    isDefault: false,
  });

  const [errors, setErrors] = useState({
    recipientName: "",
    phone: "",
    addressLine: "",
    provinceCode: "",
    wardCode: "",
  });

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoadingProvinces(true);
        setProvinces(await getAddressProvinces());
      } catch (error) {
        console.error(error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách tỉnh/thành",
        );
      } finally {
        setLoadingProvinces(false);
      }
    };

    loadProvinces();
  }, []);

  useEffect(() => {
    if (!form.provinceCode) {
      return;
    }

    const loadWards = async () => {
      try {
        setLoadingWards(true);
        setWards(await getAddressWards(form.provinceCode));
      } catch (error) {
        console.error(error);
        setWards([]);
        toast.error(
          error instanceof Error
            ? error.message
            : "Không thể tải danh sách phường/xã",
        );
      } finally {
        setLoadingWards(false);
      }
    };

    loadWards();
  }, [form.provinceCode]);

  const visibleWards = form.provinceCode ? wards : [];

  const validate = () => {
    const newErrors = {
      recipientName: "",
      phone: "",
      addressLine: "",
      provinceCode: "",
      wardCode: "",
    };

    let isValid = true;

    if (!form.recipientName.trim()) {
      newErrors.recipientName = "Vui lòng nhập họ tên người nhận";
      isValid = false;
    }

    const phoneRegex = /^0(3|5|7|8|9)[0-9]{8}$/;

    if (!form.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
      isValid = false;
    } else if (!phoneRegex.test(form.phone.trim())) {
      newErrors.phone = "Số điện thoại không hợp lệ";
      isValid = false;
    }

    if (!form.addressLine.trim()) {
      newErrors.addressLine = "Vui lòng nhập địa chỉ";
      isValid = false;
    }

    if (!form.provinceCode) {
      newErrors.provinceCode = "Vui lòng chọn tỉnh/thành";
      isValid = false;
    }

    if (!form.wardCode) {
      newErrors.wardCode = "Vui lòng chọn phường/xã";
      isValid = false;
    }

    setErrors(newErrors);

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      showLoading("Đang lưu địa chỉ...");

      const data = await createAddress({
        recipientName: form.recipientName.trim(),
        phone: form.phone.trim(),
        addressLine: form.addressLine.trim(),
        provinceCode: form.provinceCode,
        provinceName: form.provinceName,
        wardCode: form.wardCode,
        wardName: form.wardName,
        isDefault: form.isDefault,
      });
      if (data != null) {
        toast.success("Thêm địa chỉ thành công");
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error ? error.message : "Tạo địa chỉ thất bại",
      );
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  return (
    <div className="address-modal-overlay" onClick={onClose}>
      <div className="address-modal" onClick={(e) => e.stopPropagation()}>
        <div className="address-modal-header">
          <h3>Thêm địa chỉ mới</h3>

          <button
            type="button"
            className="address-modal-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="address-form-grid">
            <div className="address-input-group">
              <label>Họ và tên người nhận</label>

              <div className="address-input-wrapper">
                <input
                  type="text"
                  placeholder="Nhập họ tên"
                  value={form.recipientName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      recipientName: e.target.value,
                    })
                  }
                />

                <User size={16} />
              </div>

              {errors.recipientName && (
                <span className="address-error">{errors.recipientName}</span>
              )}
            </div>

            <div className="address-input-group">
              <label>Số điện thoại</label>

              <div className="address-input-wrapper">
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="0987654321"
                  value={form.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");

                    setForm({
                      ...form,
                      phone: value,
                    });
                  }}
                />

                <Phone size={16} />
              </div>

              {errors.phone && (
                <span className="address-error">{errors.phone}</span>
              )}
            </div>
          </div>

          <div className="address-form-grid">
            <div className="address-input-group">
              <label>Tỉnh/Thành phố</label>

              <div className="address-input-wrapper">
                <select
                  value={form.provinceCode}
                  disabled={loadingProvinces}
                  onChange={(e) => {
                    const selectedProvince = provinces.find(
                      (province) => province.provinceCode === e.target.value,
                    );

                    setForm({
                      ...form,
                      provinceCode: selectedProvince?.provinceCode ?? "",
                      provinceName: selectedProvince?.provinceName ?? "",
                      wardCode: "",
                      wardName: "",
                    });
                  }}
                >
                  <option value="">
                    {loadingProvinces ? "Đang tải..." : "Chọn tỉnh/thành"}
                  </option>
                  {provinces.map((province) => (
                    <option
                      key={province.provinceCode}
                      value={province.provinceCode}
                    >
                      {province.provinceName}
                    </option>
                  ))}
                </select>
              </div>

              {errors.provinceCode && (
                <span className="address-error">{errors.provinceCode}</span>
              )}
            </div>

            <div className="address-input-group">
              <label>Phường/Xã</label>

              <div className="address-input-wrapper">
                <select
                  value={form.wardCode}
                  disabled={!form.provinceCode || loadingWards}
                  onChange={(e) => {
                    const selectedWard = visibleWards.find(
                      (ward) => ward.wardCode === e.target.value,
                    );

                    setForm({
                      ...form,
                      wardCode: selectedWard?.wardCode ?? "",
                      wardName: selectedWard?.wardName ?? "",
                    });
                  }}
                >
                  <option value="">
                    {loadingWards ? "Đang tải..." : "Chọn phường/xã"}
                  </option>
                  {visibleWards.map((ward) => (
                    <option key={ward.wardCode} value={ward.wardCode}>
                      {ward.wardName}
                    </option>
                  ))}
                </select>
              </div>

              {errors.wardCode && (
                <span className="address-error">{errors.wardCode}</span>
              )}
            </div>
          </div>

          <div className="address-input-group">
            <label>Địa chỉ cụ thể</label>

            <div className="address-textarea-wrapper">
              <textarea
                rows={4}
                placeholder="Nhập địa chỉ chi tiết..."
                value={form.addressLine}
                onChange={(e) =>
                  setForm({
                    ...form,
                    addressLine: e.target.value,
                  })
                }
              />

              <MapPin size={16} />
            </div>

            {errors.addressLine && (
              <span className="address-error">{errors.addressLine}</span>
            )}
          </div>

          <div className="address-default-box">
            <div>
              <h4>Đặt làm địa chỉ mặc định</h4>

              <p>Địa chỉ này sẽ được ưu tiên sử dụng khi đặt hàng.</p>
            </div>

            <label className="address-switch">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) =>
                  setForm({
                    ...form,
                    isDefault: e.target.checked,
                  })
                }
              />

              <span></span>
            </label>
          </div>

          <div className="address-modal-footer">
            <button
              type="button"
              className="address-cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>

            <button
              type="submit"
              className="address-save-btn"
              disabled={loading}
            >
              {loading ? "Đang lưu..." : "Lưu địa chỉ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
