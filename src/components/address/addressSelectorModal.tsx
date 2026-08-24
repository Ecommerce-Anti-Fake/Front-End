import { useEffect, useState } from "react";
import { MapPin, Plus, X } from "lucide-react";

import "../../css/components/address/addressSelectorModal.css";

import type { Address } from "../../type/address";
import {
  getUserAddresses,
  setDefaultAddress,
} from "../../services/address.api";
import CreateAddress from "./createAddress";
import { useGlobalLoadingStore } from "../../store/globalLoadingStore";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

export default function AddressSelectorModal({
  open,
  onClose,
  onSuccess,
}: Props) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const showLoading = useGlobalLoadingStore((state) => state.showLoading);
  const hideLoading = useGlobalLoadingStore((state) => state.hideLoading);

  const [openCreate, setOpenCreate] = useState(false);

  const fetchAddresses = async () => {
    try {
      const data = await getUserAddresses();

      setAddresses(data);

      const current = data.find((x: Address) => x.isDefault);

      if (current) {
        setSelectedId(current.id);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void fetchAddresses();
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      showLoading("Đang lưu địa chỉ...");

      await setDefaultAddress(selectedId);

      await onSuccess();

      onClose();
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  return (
    <>
      <div className="address-selector-overlay" onClick={onClose}>
        <div
          className="address-selector-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="address-selector-header">
            <h2>Chọn địa chỉ nhận hàng</h2>

            <button onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="address-selector-list">
            {addresses.map((item) => (
              <div
                key={item.id}
                className={`address-selector-item ${
                  selectedId === item.id ? "active" : ""
                }`}
                onClick={() => setSelectedId(item.id)}
              >
                <div className="address-selector-content">
                  <div className="address-selector-top">
                    <strong>{item.recipientName}</strong>

                    <span>{item.phone}</span>

                    {item.isDefault && <label>Mặc định</label>}
                  </div>

                  <div className="address-selector-address">
                    <MapPin size={15} />
                    {item.addressLine}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="address-selector-bottom">
            <button
              className="address-add-btn"
              onClick={() => setOpenCreate(true)}
            >
              <Plus size={18} />
              Thêm địa chỉ
            </button>

            <div className="address-selector-action">
              <button className="cancel-btn" onClick={onClose}>
                Hủy
              </button>

              <button
                className="confirm-btn"
                disabled={loading}
                onClick={handleConfirm}
              >
                {loading ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {openCreate && (
        <CreateAddress
          onClose={() => setOpenCreate(false)}
          onSuccess={async () => {
            setOpenCreate(false);

            await fetchAddresses();

            onSuccess();
          }}
        />
      )}
    </>
  );
}
