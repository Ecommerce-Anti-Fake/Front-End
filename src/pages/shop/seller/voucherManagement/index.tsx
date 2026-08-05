import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getMyShop } from "../../../../services/shop.api";
import { createShopVoucher, fetchShopVouchers } from "../../../../services/voucher.api";
import type { VoucherCreatePayload } from "../../../../type/voucher";
import "../../../../css/pages/adminStyles/vouchers.css";
import VoucherForm from "../../../admin/vouchers/voucherForm";

type ShopVoucherItem = {
  id: string;
  code: string;
  name: string;
  status: string;
};

export default function SellerVoucherManagement() {
  const [shopId, setShopId] = useState("");
  const [items, setItems] = useState<ShopVoucherItem[]>([]);

  const load = useCallback(async (id: string) => {
    try {
      setItems(await fetchShopVouchers(id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải voucher shop");
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void getMyShop()
        .then((shops) => {
          const id = shops?.find((shop) => shop.shopStatus === "verified")?.id ?? shops?.[0]?.id;
          if (id) {
            setShopId(id);
            void load(id);
          } else {
            toast.error("Chưa tìm thấy shop để tạo voucher");
          }
        })
        .catch((error) => toast.error(error instanceof Error ? error.message : "Không thể tải thông tin shop"));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  const create = async (payload: VoucherCreatePayload) => {
    if (!shopId) {
      toast.error("Chưa tìm thấy shop để tạo voucher");
      return false;
    }

    try {
      await createShopVoucher(shopId, payload);
      toast.success("Tạo voucher shop thành công");
      await load(shopId);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo voucher shop");
      return false;
    }
  };

  return (
    <section className="admin-page voucher-page">
      <div className="admin-page-heading voucher-page-heading">
        <div>
          <span className="voucher-eyebrow">KHUYẾN MÃI CỦA SHOP</span>
          <h1>Voucher của shop</h1>
          <p>Tạo ưu đãi riêng và kiểm soát điều kiện áp dụng cho khách hàng của shop.</p>
        </div>
      </div>

      <VoucherForm owner="SHOP" onSubmit={create} />

      <section className="admin-table-card voucher-list-card" aria-labelledby="seller-voucher-list-title">
        <div className="voucher-list-heading">
          <div>
            <span className="voucher-eyebrow">MÃ ĐANG QUẢN LÝ</span>
            <h2 id="seller-voucher-list-title">Voucher đang có</h2>
            <p>Các voucher này có thể được dùng trong checkout và phiên livestream của shop.</p>
          </div>
          <span className="voucher-count">{items.length} voucher</span>
        </div>
        {items.length === 0 ? (
          <div className="voucher-list-empty" role="status">
            <strong>Shop chưa có voucher</strong>
            <p>Tạo voucher đầu tiên ở biểu mẫu phía trên.</p>
          </div>
        ) : (
          <div className="voucher-simple-list" role="list">
            {items.map((item) => (
              <div className="voucher-simple-item" role="listitem" key={item.id}>
                <strong>{item.code}</strong>
                <span>{item.name}</span>
                <span>{item.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
