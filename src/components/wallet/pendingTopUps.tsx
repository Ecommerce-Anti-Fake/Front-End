import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWalletTopUps, type PayOSPayment } from "../../services/payos.api";
import { paymentPath } from "../payment/payosCheckoutState";
import { formatVnd } from "../../ultil/currency";

export default function PendingTopUps({ shopId }: { shopId?: string }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<PayOSPayment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await fetchWalletTopUps(shopId);
        if (active) { setItems(data); setError(""); }
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Không thể tải giao dịch"); }
      finally { if (active) setLoading(false); }
    };
    void load();
    const timer = window.setInterval(load, 15000);
    window.addEventListener("focus", load);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", load); };
  }, [shopId]);
  const pending = items.filter(item => ["PENDING", "PROCESSING"].includes(item.status));
  return <section className="pending-top-ups" aria-label="Yêu cầu nạp tiền đang chờ">
    <h2>Yêu cầu nạp tiền đang chờ</h2>
    {loading ? <p role="status">Đang tải yêu cầu nạp tiền...</p> : null}
    {error ? <p role="alert">{error}</p> : null}
    {!loading && !error && !pending.length ? <p>Không có yêu cầu nạp tiền đang chờ.</p> : null}
    {pending.map(item => <div className="pending-top-up-row" key={item.paymentLinkId}>
      <div><strong>{formatVnd(Number(item.amount))}</strong><small>{item.expiresAt ? "Hết hạn: " + new Date(item.expiresAt).toLocaleString("vi-VN") : "Đang đối soát thời hạn"}</small></div>
      <button type="button" onClick={() => navigate(paymentPath({ flow: shopId ? "SHOP_WALLET_TOP_UP" : "USER_WALLET_TOP_UP", reference: item.paymentLinkId, shopId }))}>Tiếp tục thanh toán</button>
    </div>)}
  </section>;
}
