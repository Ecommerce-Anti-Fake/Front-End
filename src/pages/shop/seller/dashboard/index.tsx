import { useEffect, useState } from "react";
import SellerRevenueChart from "../../../../components/dashboard/sellerRevenueChart";
import SellerStats from "../../../../components/dashboard/sellerStats";
import SellerTopProducts from "../../../../components/dashboard/sellerTopProducts";
import SellerGettingStarted from "../../../../components/dashboard/sellerGettingStarted";
import OrderCard from "../../../../components/orderManagement/orderCard";
import OrderTable from "../../../../components/orderManagement/orderTable";
import "../../../../css/components/dataSkeleton.css";
import "../../../../css/pages/sellerDashboard.css";
import {
  fetchSellerOrders,
  type SellerOrder,
} from "../../../../services/order.api";
import { getMyShop, type MyShop } from "../../../../services/shop.api";
import { formatVnd } from "../../../../ultil/currency";

type ViewOrder = {
  id: string;
  customer: string;
  email: string;
  date: string;
  total: string;
  status: string;
};

const normalizeMyShop = (data: MyShop[] | null): MyShop | null => data?.[0] ?? null;

const formatDate = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const mapOrder = (order: SellerOrder): ViewOrder => ({
  id: order.orderId,
  customer: order.customer?.name || "Khach hang",
  email: order.customer?.email || "",
  date: formatDate(order.createdAt || order.orderDate || order.createdDate),
  total: formatVnd(order.orderAmount),
  status: order.orderStatus.toLowerCase(),
});

export default function SellerDashboard() {
  const [shopId, setShopId] = useState("");
  const [shopStatus, setShopStatus] = useState("");
  const [orders, setOrders] = useState<ViewOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    const loadPendingOrders = async () => {
      try {
        setLoadingOrders(true);
        setOrdersError("");

        const shopData = await getMyShop();
        const shop = normalizeMyShop(shopData);
        const nextShopId = shop?.id;

        if (!nextShopId) {
          setShopId("");
          setShopStatus("");
          setOrders([]);
          setOrdersError("Khong tim thay cua hang cua ban");
          return;
        }

        setShopId(String(nextShopId));
        setShopStatus(String(shop?.shopStatus ?? ""));

        const data = await fetchSellerOrders({
          shopId: String(nextShopId),
          orderStatus: "pending",
          page: 1,
          pageSize: 5,
        });

        setOrders(data.items.map(mapOrder));
      } catch (error) {
        console.error(error);
        setOrders([]);
        setOrdersError(
          error instanceof Error
            ? error.message
            : "Khong the tai don hang moi",
        );
      } finally {
        setLoadingOrders(false);
      }
    };

    loadPendingOrders();
  }, []);

  const orderContent = () => {
    if (loadingOrders) {
      return (
        <div className="seller-dashboard-orders-state">
          <div className="data-skeleton data-skeleton-table data-skeleton-compact" role="status" aria-label="Đang tải đơn hàng mới">{Array.from({ length: 4 }, (_, i) => <div className="data-skeleton-row" key={i}><span className="data-skeleton-thumbnail" /><span className="data-skeleton-lines"><span /><span /><span /></span><span className="data-skeleton-cell" /><span className="data-skeleton-cell" /><span className="data-skeleton-action" /></div>)}</div>
        </div>
      );
    }

    if (ordersError) {
      return (
        <div className="seller-dashboard-orders-state error">
          {ordersError}
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div className="seller-dashboard-orders-state">
          Không có đơn hàng mới để xác nhận
        </div>
      );
    }

    return null;
  };

  return (
    <div className="seller-dashboard">
      <SellerStats shopId={shopId} />
      {shopId && <SellerGettingStarted shopId={shopId} shopStatus={shopStatus} />}

      <div className="seller-dashboard-middle">
        <SellerRevenueChart shopId={shopId} />
        <SellerTopProducts shopId={shopId} />
      </div>

      <div className="seller-orders-card">
        <h3>Đơn đặt hàng mới</h3>

        <div className="seller-laptop-orders-table">
          {orderContent() || <OrderTable orders={orders} />}
        </div>

        <div className="seller-mobile-orders-card">
          {orderContent() ||
            orders.map((order) => <OrderCard key={order.id} order={order} />)}
        </div>
      </div>
    </div>
  );
}
