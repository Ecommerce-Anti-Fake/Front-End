import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Package, Truck } from "lucide-react";
import {
  fetchShopOrderStatusSummary,
  type ShopOrderStatusSummary,
} from "../../services/order.api";
import "../../css/components/orderManagement/orderStats.css";

type OrderStatsProps = {
  shopId?: string;
};

const emptySummary: ShopOrderStatusSummary = {
  totalOrders: 0,
  pendingOrders: 0,
  shippingOrders: 0,
  deliveredOrders: 0,
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value);

export default function OrderStats({ shopId }: OrderStatsProps) {
  const [summary, setSummary] =
    useState<ShopOrderStatusSummary>(emptySummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shopId) return;

    let ignore = false;

    const loadSummary = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchShopOrderStatusSummary(shopId);
        if (!ignore) setSummary(data);
      } catch (err: unknown) {
        if (!ignore) {
          setSummary(emptySummary);
          setError(err instanceof Error ? err.message : "Khong the tai thong ke don hang");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadSummary();

    return () => {
      ignore = true;
    };
  }, [shopId]);

  const stats = [
    {
      label: "Tổng đơn hàng",
      value: summary.totalOrders,
      icon: <Package size={20} />,
      className: "",
    },
    {
      label: "Đang xử lý",
      value: summary.pendingOrders,
      icon: <Clock3 size={20} />,
      className: "processing",
    },
    {
      label: "Đang giao",
      value: summary.shippingOrders,
      icon: <Truck size={20} />,
      className: "shipping",
    },
    {
      label: "Đã giao",
      value: summary.deliveredOrders,
      icon: <CheckCircle2 size={20} />,
      className: "completed",
    },
  ];

  return (
    <div
      className="seller-order-stats"
      aria-busy={loading}
      title={error || undefined}
    >
      {stats.map((item) => (
        <div className="seller-order-stat-card" key={item.label}>
          <div className={`icon ${item.className}`.trim()}>{item.icon}</div>

          <span>{item.label}</span>
          <h2>{loading ? "..." : formatNumber(item.value)}</h2>
        </div>
      ))}
    </div>
  );
}
