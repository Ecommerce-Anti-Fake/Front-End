import { CheckCircle2, Circle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../css/components/sellerGettingStarted.css";
import { fetchShopOffers } from "../../services/shop.api";
import { fetchShopVouchers } from "../../services/voucher.api";
import { fetchShopOrderStatusSummary } from "../../services/order.api";
import {
  deriveSellerGettingStartedItems,
  type SellerGettingStartedItem,
} from "./sellerGettingStartedState";

type Props = {
  shopId: string;
  shopStatus: string;
};

export default function SellerGettingStarted({ shopId, shopStatus }: Props) {
  const [items, setItems] = useState<SellerGettingStartedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [offers, vouchers, orders] = await Promise.all([
        fetchShopOffers(shopId, { page: 1, pageSize: 100 }),
        fetchShopVouchers(shopId),
        fetchShopOrderStatusSummary(shopId),
      ]);

      setItems(
        deriveSellerGettingStartedItems({
          shopStatus,
          offers: offers.items,
          voucherCount: vouchers.length,
          totalOrders: orders.totalOrders,
          deliveredOrders: orders.deliveredOrders,
        }),
      );
    } catch (requestError) {
      setItems([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tải tiến độ bắt đầu bán hàng",
      );
    } finally {
      setLoading(false);
    }
  }, [shopId, shopStatus]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [load]);

  if (loading) {
    return (
      <section className="seller-getting-started" aria-busy="true" aria-labelledby="seller-getting-started-title">
        <div className="seller-getting-started-heading">
          <div>
            <span className="seller-getting-started-eyebrow">Bắt đầu bán hàng</span>
            <h2 id="seller-getting-started-title">Đang tải tiến độ của Shop</h2>
          </div>
        </div>
        <div className="seller-getting-started-loading" role="status">Đang đối chiếu dữ liệu Shop, sản phẩm, voucher và đơn hàng…</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="seller-getting-started" aria-labelledby="seller-getting-started-title">
        <div className="seller-getting-started-heading">
          <div>
            <span className="seller-getting-started-eyebrow">Bắt đầu bán hàng</span>
            <h2 id="seller-getting-started-title">Chưa thể tải checklist</h2>
          </div>
          <button type="button" className="seller-getting-started-retry" onClick={() => void load()}>
            <RefreshCw size={16} aria-hidden="true" /> Thử lại
          </button>
        </div>
        <p className="seller-getting-started-error" role="alert">{error}</p>
      </section>
    );
  }

  const completedCount = items.filter((item) => item.complete).length;

  return (
    <section className="seller-getting-started" aria-labelledby="seller-getting-started-title">
      <div className="seller-getting-started-heading">
        <div>
          <span className="seller-getting-started-eyebrow">Bắt đầu bán hàng</span>
          <h2 id="seller-getting-started-title">Checklist của Shop</h2>
          <p>Tiến độ được tính từ trạng thái thật của Shop, sản phẩm, voucher và đơn hàng.</p>
        </div>
        <strong className="seller-getting-started-progress">{completedCount}/{items.length}</strong>
      </div>

      <progress className="seller-getting-started-bar" max={items.length} value={completedCount} aria-label={`Đã hoàn thành ${completedCount} trên ${items.length} mục`} />

      <ul className="seller-getting-started-list">
        {items.map((item) => (
          <li key={item.id} className={item.complete ? "is-complete" : ""}>
            <Link to={item.href}>
              {item.complete ? <CheckCircle2 size={19} aria-hidden="true" /> : <Circle size={19} aria-hidden="true" />}
              <span>{item.title}</span>
              <small>{item.complete ? "Đã xong" : "Cần làm"}</small>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
