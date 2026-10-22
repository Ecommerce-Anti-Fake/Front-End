import { useNavigate } from "react-router-dom";
import { paymentPath } from "../payment/payosCheckoutState";
export default function ResumePayment({ order }: { order: { id: string; paymentMethod: string; paymentStatus?: string; status?: string } }) {
 const navigate = useNavigate();
 const eligible = order.paymentMethod.toUpperCase() === "PAYOS" && ["PENDING", "UNPAID", "EXPIRED", "FAILED"].includes((order.paymentStatus || "PENDING").toUpperCase()) && !["CANCELLED", "CANCELED"].includes((order.status || "").toUpperCase());
 if (!eligible) return null;
 return <button type="button" className="order-detail-btn" onClick={() => navigate(paymentPath({ flow: "ORDER", reference: order.id }))}>Tiếp tục thanh toán</button>;
}
