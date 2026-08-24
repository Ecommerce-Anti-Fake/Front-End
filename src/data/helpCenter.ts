export type DocumentationStatus =
  | "VERIFIED"
  | "SOURCE_VERIFIED"
  | "PARTIAL"
  | "UNVERIFIED"
  | "NOT_IMPLEMENTED";

export type HelpPlatform = "desktop" | "mobile";
export type HelpRole = "buyer" | "seller" | "admin" | "qr";

export type HelpStep = {
  slug: string;
  title: string;
  description: string;
  tip?: string;
};

export type HelpArticle = {
  slug: string;
  title: string;
  role: HelpRole;
  journey: string;
  feature: string;
  summary: string;
  keywords: string[];
  status: DocumentationStatus;
  sourceRefs: string[];
  steps: HelpStep[];
};

export const helpArticles: HelpArticle[] = [
  {
    slug: "first-purchase",
    title: "Mua sản phẩm đầu tiên",
    role: "buyer",
    journey: "BUYER-FIRST-PURCHASE",
    feature: "Catalog, cart, checkout và order",
    summary: "Từ lúc tìm sản phẩm đến khi theo dõi đơn hàng.",
    keywords: ["mua hàng", "sản phẩm", "giỏ hàng", "checkout", "đơn hàng"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/App.tsx", "docs/UAT_TEST_MATRIX.md#AF-B-003"],
    steps: [
      { slug: "discover", title: "Tìm sản phẩm", description: "Mở catalog hoặc tìm kiếm để chọn sản phẩm công khai phù hợp." },
      { slug: "product-detail", title: "Xem chi tiết", description: "Kiểm tra thông tin sản phẩm, shop, giá, tồn kho và biến thể." },
      { slug: "add-to-cart", title: "Thêm vào giỏ", description: "Chọn biến thể và số lượng, sau đó thêm sản phẩm vào giỏ hàng." },
      { slug: "cart", title: "Kiểm tra giỏ hàng", description: "Chọn sản phẩm cần mua và kiểm tra số lượng trước khi tiếp tục." },
      { slug: "checkout", title: "Chuẩn bị thanh toán", description: "Chọn địa chỉ và phương thức vận chuyển. Tổng tiền phải đến từ báo giá server." },
      { slug: "order", title: "Theo dõi đơn hàng", description: "Sau khi đặt hàng thành công, mở đơn hàng để theo dõi trạng thái và các bước tiếp theo." },
    ],
  },
  {
    slug: "orders",
    title: "Theo dõi đơn hàng",
    role: "buyer",
    journey: "BUYER-ORDER",
    feature: "Orders",
    summary: "Xem danh sách, chi tiết và trạng thái các đơn thuộc tài khoản của bạn.",
    keywords: ["đơn hàng", "trạng thái", "nhận hàng", "đánh giá"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/pages/profile/ordersPage.tsx", "docs/UAT_TEST_MATRIX.md#AF-B-004"],
    steps: [
      { slug: "list", title: "Mở danh sách đơn", description: "Vào Tài khoản rồi chọn Đơn mua để xem các đơn của bạn." },
      { slug: "detail", title: "Xem chi tiết", description: "Chọn một đơn để xem sản phẩm, thanh toán và tiến trình giao hàng." },
      { slug: "next-action", title: "Thực hiện bước tiếp theo", description: "Chỉ chọn hành động được hiển thị cho trạng thái hiện tại của đơn." },
    ],
  },
  {
    slug: "verify-product",
    title: "Kiểm tra sản phẩm bằng QR",
    role: "qr",
    journey: "BUYER-QR-VERIFY",
    feature: "QR verification",
    summary: "Giao diện QR hiện có để nhập hoặc quét thông tin kiểm tra.",
    keywords: ["QR", "xác thực", "nguồn gốc", "provenance"],
    status: "NOT_IMPLEMENTED",
    sourceRefs: ["Front-End/src/pages/qr/index.tsx", "docs/UAT_ISSUES.md#AF-Q-001"],
    steps: [
      { slug: "open", title: "Mở xác thực QR", description: "Mở trang Xác thực QR từ menu công khai." },
      { slug: "enter-code", title: "Nhập thông tin kiểm tra", description: "Nhập dữ liệu test được cấp khi có môi trường xác minh phù hợp." },
      { slug: "result", title: "Đọc kết quả", description: "Kết quả risk và provenance chỉ được hướng dẫn sau khi execution path được triển khai và kiểm thử." },
    ],
  },
  {
    slug: "register-shop",
    title: "Đăng ký trở thành Shop",
    role: "seller",
    journey: "SELLER-ONBOARDING",
    feature: "Shop registration, KYC và approval",
    summary: "Chuẩn bị hồ sơ, gửi xét duyệt và thiết lập Shop sau khi được duyệt.",
    keywords: ["Shop", "đăng ký", "KYC", "duyệt", "seller"],
    status: "SOURCE_VERIFIED",
    sourceRefs: ["Front-End/src/components/sellerRegistration/sellerRegistration.tsx", "docs/UAT_TEST_MATRIX.md#AF-S-001"],
    steps: [
      { slug: "prepare", title: "Chuẩn bị thông tin", description: "Chuẩn bị thông tin Shop và hồ sơ theo biểu mẫu đang hiển thị." },
      { slug: "submit", title: "Gửi xét duyệt", description: "Kiểm tra lại thông tin trước khi gửi hồ sơ cho Admin." },
      { slug: "approval", title: "Chờ kết quả", description: "Trạng thái duyệt hoặc từ chối phải được đọc từ dữ liệu thực tế của tài khoản." },
      { slug: "setup", title: "Thiết lập Shop", description: "Sau khi được duyệt, hoàn thiện thông tin Shop trước khi đăng sản phẩm." },
    ],
  },
  {
    slug: "create-product",
    title: "Đăng sản phẩm đầu tiên",
    role: "seller",
    journey: "SELLER-FIRST-PRODUCT",
    feature: "Product management",
    summary: "Tạo sản phẩm, thêm media, biến thể, giá và tồn kho để gửi duyệt.",
    keywords: ["sản phẩm", "media", "biến thể", "SKU", "tồn kho"],
    status: "SOURCE_VERIFIED",
    sourceRefs: ["Front-End/src/pages/shop/seller/productManagement/index.tsx", "back-end/apps/api-gateway/src/modules/offer/offer.controller.ts", "docs/UAT_TEST_MATRIX.md#AF-S-002"],
    steps: [
      { slug: "basic-info", title: "Nhập thông tin cơ bản", description: "Nhập tên, danh mục và mô tả theo biểu mẫu tạo sản phẩm." },
      { slug: "media", title: "Thêm hình ảnh", description: "Chỉ sử dụng media test/sanitized khi tạo evidence hoặc screenshot." },
      { slug: "variant", title: "Thiết lập biến thể", description: "Khai báo SKU, giá và tồn kho cho từng biến thể." },
      { slug: "submit", title: "Gửi duyệt", description: "Gửi sản phẩm để chuyển sang bước kiểm duyệt phù hợp." },
    ],
  },
  {
    slug: "process-order",
    title: "Xử lý đơn hàng đầu tiên",
    role: "seller",
    journey: "SELLER-FIRST-ORDER",
    feature: "Seller orders",
    summary: "Kiểm tra đơn, xác nhận, chuẩn bị và hoàn tất xử lý theo trạng thái thực tế.",
    keywords: ["đơn hàng", "seller", "xác nhận", "chuẩn bị", "giao hàng"],
    status: "SOURCE_VERIFIED",
    sourceRefs: ["Front-End/src/pages/shop/seller/orderManagement/index.tsx", "back-end/apps/api-gateway/src/modules/order/order.controller.ts", "docs/UAT_TEST_MATRIX.md#AF-S-003"],
    steps: [
      { slug: "orders", title: "Mở danh sách đơn", description: "Vào Seller Dashboard và mở mục đơn hàng của Shop." },
      { slug: "confirm-order", title: "Xác nhận đơn hàng", description: "Mở chi tiết đơn và chỉ xác nhận khi đơn thuộc Shop của bạn và đủ điều kiện chuyển trạng thái." },
      { slug: "prepare-order", title: "Chuẩn bị hàng", description: "Đóng gói theo thông tin đơn và kiểm tra sản phẩm trước khi bàn giao." },
      { slug: "ship-order", title: "Bàn giao vận chuyển", description: "Chọn hành động vận chuyển được backend cho phép ở trạng thái hiện tại." },
      { slug: "complete-order", title: "Hoàn tất", description: "Theo dõi trạng thái giao hàng và hoàn tất khi hệ thống xác nhận bước cuối." },
      { slug: "revenue", title: "Kiểm tra doanh thu", description: "Đối chiếu doanh thu và ví sau khi trạng thái đơn được xác nhận." },
    ],
  },
  {
    slug: "admin-review",
    title: "Duyệt Shop và sản phẩm",
    role: "admin",
    journey: "ADMIN-REVIEW",
    feature: "Admin review",
    summary: "Tài liệu nội bộ cho việc xem và xử lý hồ sơ trong quyền Admin.",
    keywords: ["Admin", "KYC", "Shop", "sản phẩm", "duyệt"],
    status: "UNVERIFIED",
    sourceRefs: ["Front-End/src/App.tsx", "back-end/apps/api-gateway/src/modules/admin/admin.controller.ts", "docs/UAT_TEST_MATRIX.md#AF-AD-001"],
    steps: [
      { slug: "dashboard", title: "Mở Admin Dashboard", description: "Cần tài khoản Admin active và session hợp lệ để truy cập." },
      { slug: "shop-review", title: "Xem hồ sơ Shop", description: "Kiểm tra hồ sơ và chỉ dùng các hành động được backend cho phép." },
      { slug: "product-review", title: "Xem sản phẩm chờ duyệt", description: "Đối chiếu thông tin trước khi approve hoặc reject." },
    ],
  },
];

export const helpRoleLabels: Record<HelpRole | "all", string> = {
  all: "Tất cả",
  buyer: "Người mua",
  seller: "Shop",
  admin: "Quản trị viên",
  qr: "Xác thực QR",
};

export function getArticleUrl(article: HelpArticle, stepSlug?: string) {
  return `/help/${article.role}/${article.slug}${stepSlug ? `/${stepSlug}` : ""}`;
}

export function getArticleForPath(pathname: string) {
  const parts = pathname.replace(/^\/help\/?/, "").split("/").filter(Boolean);
  if (parts.length < 2) return { article: undefined, stepSlug: undefined };

  const article = helpArticles.find(
    (candidate) => candidate.role === parts[0] && candidate.slug === parts[1],
  );

  return { article, stepSlug: parts[2] };
}
