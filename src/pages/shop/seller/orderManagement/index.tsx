import { useEffect, useMemo, useState } from "react";
import OrderFilters from "../../../../components/orderManagement/orderFilters";
import OrderPagination from "../../../../components/orderManagement/orderPagination";
import OrderStats from "../../../../components/orderManagement/orderStats";
import OrderTable from "../../../../components/orderManagement/orderTable";
import "../../../../css/pages/orderManagement.css";
import OrderCard from "../../../../components/orderManagement/orderCard";
import {
  fetchSellerOrders,
  type SellerOrder,
} from "../../../../services/order.api";
import { getMyShop } from "../../../../services/shop.api";
import { formatVnd } from "../../../../ultil/currency";
import ContextualHelpLink from "../../../../components/help/contextualHelpLink";

type ViewOrder = {
  id: string;
  customerId: string;
  customer: string;
  email: string;
  date: string;
  total: string;
  status: string;
};

const PAGE_SIZE = 20;

const normalizeMyShop = (data: any) => {
  const payload = data?.data ?? data?.items ?? data;
  if (Array.isArray(payload)) return payload[0] ?? null;
  return payload && typeof payload === "object" ? payload : null;
};

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
  customerId: order.customer?.id || "",
  customer: order.customer?.name || "Khach hang",
  email: order.customer?.email || "",
  date: formatDate(order.createdAt || order.orderDate || order.createdDate),
  total: formatVnd(order.orderAmount),
  status: order.orderStatus,
});

function OrderLoading() {
  return (
    <div
      className="seller-order-loading"
      role="status"
      aria-live="polite"
      aria-label="Dang tai don hang"
    >
      <div className="seller-order-loading-list" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="seller-order-loading-row" key={index}>
            <span />
            <span />
            <span />
            <span />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrderManagement() {
  const [activeStatus, setActiveStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<ViewOrder[]>([]);
  const [shopId, setShopId] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadShop = async () => {
      try {
        const shopData = await getMyShop();
        const shop = normalizeMyShop(shopData);
        const nextShopId = shop?.shopId || shop?.id;

        if (!nextShopId) {
          setError("Khong tim thay cua hang cua ban");
          setLoading(false);
          return;
        }

        setShopId(String(nextShopId));
      } catch (err: any) {
        setError(err.message || "Khong the tai thong tin cua hang");
        setLoading(false);
      }
    };

    loadShop();
  }, []);

  useEffect(() => {
    if (!shopId) return;

    const loadOrders = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchSellerOrders({
          shopId,
          orderStatus: activeStatus,
          page,
          pageSize: PAGE_SIZE,
        });

        setOrders(data.items.map(mapOrder));
        setTotal(data.total);
      } catch (err: any) {
        setOrders([]);
        setTotal(0);
        setError(err.message || "Khong the tai danh sach don hang");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [shopId, activeStatus, page]);

  useEffect(() => {
    setPage(1);
  }, [activeStatus, search]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const keyword = search.trim().toLowerCase();

      const matchSearch =
        keyword === "" ||
        order.id.toLowerCase().includes(keyword) ||
        order.customer.toLowerCase().includes(keyword);

      return matchSearch;
    });
  }, [orders, search]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="seller-order-page">
      <div className="seller-order-top">
        <div>
          <h1>Quản lý đơn hàng</h1>
          <p>Theo dõi và xử lý đơn hàng của bạn với độ chính xác cao.</p>
        </div>
        <ContextualHelpLink to="/help/seller/process-order">Quy trình xử lý đơn hàng</ContextualHelpLink>
      </div>

      <OrderStats shopId={shopId} />

      <div className="seller-order-table-card">
        <OrderFilters
          activeStatus={activeStatus}
          setActiveStatus={setActiveStatus}
          search={search}
          setSearch={setSearch}
        />
        <div className="seller-laptop-orders-table">
          {loading && <OrderLoading />}
          {!loading && error && (
            <div className="seller-order-empty">{error}</div>
          )}
          {!loading && !error && <OrderTable orders={filteredOrders} />}
        </div>

        <div className="seller-mobile-orders-card">
          {loading && <OrderLoading />}
          {!loading && error && (
            <div className="seller-order-empty">{error}</div>
          )}
          {!loading &&
            !error &&
            filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
        </div>
        <OrderPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
