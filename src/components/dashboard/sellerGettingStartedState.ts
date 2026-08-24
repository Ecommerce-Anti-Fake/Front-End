import type { ShopOffer } from "../../services/shop.api";

export type SellerGettingStartedSnapshot = {
  shopStatus?: string | null;
  offers: Array<Pick<ShopOffer, "offerStatus" | "moderationStatus">>;
  voucherCount: number;
  totalOrders: number;
  deliveredOrders: number;
};

export type SellerGettingStartedItem = {
  id: string;
  title: string;
  href: string;
  complete: boolean;
};

const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();

export function deriveSellerGettingStartedItems(
  snapshot: SellerGettingStartedSnapshot,
): SellerGettingStartedItem[] {
  const shopStatus = normalize(snapshot.shopStatus);
  const offers = snapshot.offers ?? [];
  const kycComplete = ["pending_document", "pending_verification", "verified"].includes(shopStatus);
  const hasCreatedProduct = offers.length > 0;
  const hasSubmittedProduct = offers.some((offer) =>
    normalize(offer.offerStatus) !== "draft" &&
      ["pending", "approved", "rejected", "banned"].includes(normalize(offer.moderationStatus)),
  );
  const hasPublishedProduct = offers.some(
    (offer) => normalize(offer.offerStatus) === "active" && normalize(offer.moderationStatus) === "approved",
  );

  return [
    { id: "complete-shop", title: "Hoàn thiện Shop", href: "/seller/shop-info", complete: shopStatus === "verified" },
    { id: "verify-kyc", title: "Xác minh/KYC nếu cần", href: "/register", complete: kycComplete },
    { id: "create-product", title: "Tạo sản phẩm đầu tiên", href: "/seller/products", complete: hasCreatedProduct },
    { id: "submit-product", title: "Gửi duyệt sản phẩm", href: "/seller/products", complete: hasSubmittedProduct },
    { id: "publish-product", title: "Đăng sản phẩm", href: "/seller/products", complete: hasPublishedProduct },
    { id: "create-voucher", title: "Tạo voucher", href: "/seller/vouchers", complete: snapshot.voucherCount > 0 },
    { id: "receive-order", title: "Nhận đơn đầu tiên", href: "/seller/orders", complete: snapshot.totalOrders > 0 },
    { id: "process-order", title: "Xử lý đơn đầu tiên", href: "/seller/orders", complete: snapshot.deliveredOrders > 0 },
  ];
}
