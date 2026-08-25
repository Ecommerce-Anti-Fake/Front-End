import { useCallback, useEffect, useState } from "react";
import { Building2, MapPin, Plus } from "lucide-react";

import "../../css/pages/profile/address.css";
import {
  deleteAddress,
  getUserAddresses,
  setDefaultAddress,
} from "../../services/address.api";
import CreateAddress from "../../components/address/createAddress";
import { toast } from "sonner";
import ConfirmModal from "../../components/common/confirmModal";
import "../../css/components/dataSkeleton.css";
import UpdateAddress from "../../components/address/updateAddress";
import EmptyState from "../../components/common/emptyState";
import { useGlobalLoadingStore } from "../../store/globalLoadingStore";

interface Address {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfileAddress() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const showLoading = useGlobalLoadingStore((state) => state.showLoading);
  const hideLoading = useGlobalLoadingStore((state) => state.hideLoading);

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUserAddresses();
      setAddresses(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void loadAddresses();
    });
    return () => {
      active = false;
    };
  }, [loadAddresses]);

  const handleDelete = async (id: string) => {
    try {
      showLoading("Đang xóa địa chỉ...");
      await deleteAddress(id);
      loadAddresses();
      setShowDelete(false);
      toast.success("Xóa địa chỉ thành công!");
    } catch (error) {
      console.error(error);
      setShowDelete(false);
      toast.error("Xóa địa chỉ thất bại!");
    } finally {
      hideLoading();
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      showLoading("Đang cập nhật địa chỉ...");
      await setDefaultAddress(id);
      loadAddresses();

      toast.success("Cập nhật địa chỉ mặc định thành công!");
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật thất bại!");
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="profile-address-page">
      <div className="profile-address-top">
        <div>
          <h1 className="profile-address-title">Địa chỉ của tôi</h1>

          <p className="profile-address-subtitle">
            Quản lý các địa chỉ nhận hàng của bạn một cách an toàn.
          </p>
        </div>

        <button
          className="profile-address-add-btn"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} />
          Thêm địa chỉ mới
        </button>
      </div>

      <div className="profile-address-divider" />

      {loading ? (
        <div className="profile-address-loading"><div className="data-skeleton data-skeleton-address" role="status" aria-label="Đang tải địa chỉ">{Array.from({ length: 3 }, (_, i) => <div className="data-skeleton-row" key={i}><span className="data-skeleton-thumbnail" /><span className="data-skeleton-lines"><span /><span /><span /></span></div>)}</div></div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin size={30} />}
          title="Bạn chưa có địa chỉ nào"
          description="Thêm địa chỉ nhận hàng để việc thanh toán và giao hàng nhanh hơn."
          className="profile-address-empty"
          action={
            <button type="button" onClick={() => setShowModal(true)}>
              <Plus size={18} />
              Thêm địa chỉ mới
            </button>
          }
        />
      ) : (
        <div className="profile-address-list">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`profile-address-card ${
                address.isDefault ? "profile-address-card-default" : ""
              }`}
            >
              <div className="profile-address-header">
                <div className="profile-address-user">
                  <span className="profile-address-name">
                    {address.recipientName}
                  </span>

                  <span className="profile-address-phone">{address.phone}</span>

                  {address.isDefault && (
                    <span className="profile-address-default-badge">
                      MẶC ĐỊNH
                    </span>
                  )}
                </div>

                <div className="profile-address-actions">
                  <button onClick={() => setEditingAddress(address)}>
                    Sửa
                  </button>

                  <button onClick={() => setShowDelete(true)}>Xóa</button>
                </div>
                <ConfirmModal
                  open={showDelete}
                  title="Xóa địa chỉ"
                  message="Bạn có chắc muốn xóa địa chỉ này không?"
                  confirmText="Xóa"
                  cancelText="Hủy"
                  danger={true}
                  loading={loading}
                  onConfirm={() => handleDelete(address.id)}
                  onCancel={() => setShowDelete(false)}
                />
              </div>

              <div className="profile-address-line">{address.addressLine}</div>

              {!address.isDefault && (
                <button
                  className="profile-address-default-btn"
                  onClick={() => handleSetDefault(address.id)}
                >
                  Thiết lập mặc định
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="profile-address-footer">
        <Building2 size={42} />

        <p>
          Bạn có thể lưu tối đa 10 địa chỉ khác nhau để thuận tiện hơn trong quá
          trình mua sắm.
        </p>
      </div>
      {showModal && (
        <CreateAddress
          onClose={() => setShowModal(false)}
          onSuccess={loadAddresses}
        />
      )}

      {editingAddress && (
        <UpdateAddress
          address={editingAddress}
          onClose={() => setEditingAddress(null)}
          onSuccess={async () => {
            await loadAddresses();
            setEditingAddress(null);
          }}
        />
      )}
    </div>
  );
}
