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
    slug: "voucher",
    title: "Áp dụng voucher khi mua hàng",
    role: "buyer",
    journey: "BUYER-VOUCHER",
    feature: "Voucher & checkout",
    summary: "Kiểm tra điều kiện voucher trước khi dùng trong checkout.",
    keywords: ["voucher", "mã giảm giá", "checkout", "điều kiện"],
    status: "SOURCE_VERIFIED",
    sourceRefs: ["Front-End/src/services/voucher.api.ts", "docs/user-guide/FEATURE_GUIDE_MATRIX.md#Voucher"],
    steps: [
      { slug: "find", title: "Tìm voucher", description: "Mở khu vực voucher hoặc dùng mã được Shop cung cấp." },
      { slug: "check-conditions", title: "Kiểm tra điều kiện", description: "Đối chiếu Shop, sản phẩm, giá trị tối thiểu và thời hạn hiển thị trên hệ thống." },
      { slug: "apply", title: "Áp dụng trong checkout", description: "Chỉ tiếp tục khi tổng tiền sau voucher được server chấp nhận." },
    ],
  },
  {
    slug: "chat-shop",
    title: "Chat với Shop",
    role: "buyer",
    journey: "BUYER-CHAT-SHOP",
    feature: "Chat",
    summary: "Mở cuộc trò chuyện với Shop và theo dõi trạng thái kết nối.",
    keywords: ["chat", "Shop", "tin nhắn", "reconnect"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/components/chat/ChatLayout.tsx", "docs/user-guide/FEATURE_GUIDE_MATRIX.md#Chat"],
    steps: [
      { slug: "open", title: "Mở Chat", description: "Từ Shop hoặc khu vực tin nhắn, mở cuộc trò chuyện phù hợp." },
      { slug: "send", title: "Gửi nội dung", description: "Kiểm tra người nhận trước khi gửi tin nhắn hoặc media được hỗ trợ." },
      { slug: "reconnect", title: "Xử lý mất kết nối", description: "Nếu tin nhắn chưa đồng bộ, chờ kết nối lại và không gửi lặp ngoài trạng thái hệ thống." },
    ],
  },
  {
    slug: "livestream",
    title: "Xem livestream và sản phẩm",
    role: "buyer",
    journey: "BUYER-LIVESTREAM",
    feature: "Livestream",
    summary: "Khám phá phiên live, xem sản phẩm ghim và tiếp tục mua hàng khi flow sẵn sàng.",
    keywords: ["livestream", "live", "sản phẩm", "mua hàng"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/pages/live/index.tsx", "docs/user-guide/FEATURE_GUIDE_MATRIX.md#Livestream"],
    steps: [
      { slug: "discover", title: "Tìm phiên live", description: "Mở danh sách livestream công khai và chọn phiên đang hiển thị." },
      { slug: "watch", title: "Xem phiên live", description: "Theo dõi nội dung và sản phẩm được ghim trong phiên." },
      { slug: "shop", title: "Mở sản phẩm", description: "Mở sản phẩm từ phiên live; provider và mutation cần trạng thái runtime tương ứng." },
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
    slug: "wallet",
    title: "Theo dõi ví và doanh thu Shop",
    role: "seller",
    journey: "SELLER-WALLET-REVENUE",
    feature: "Wallet & revenue",
    summary: "Xem số dư, giao dịch và trạng thái thanh toán theo dữ liệu của Shop.",
    keywords: ["ví", "doanh thu", "rút tiền", "giao dịch"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/pages/shop/seller/wallet/index.tsx", "docs/user-guide/FEATURE_GUIDE_MATRIX.md#Seller-wallet"],
    steps: [
      { slug: "balance", title: "Xem số dư", description: "Mở Ví Shop và đọc số dư do backend trả về." },
      { slug: "transactions", title: "Đối chiếu giao dịch", description: "Kiểm tra lịch sử, trạng thái và khoản liên quan đến đơn hàng." },
      { slug: "withdrawal", title: "Rút tiền khi đủ điều kiện", description: "Chỉ tạo yêu cầu khi tài khoản payout và số dư đáp ứng điều kiện hiện tại." },
    ],
  },
  {
    slug: "voucher",
    title: "Tạo voucher cho Shop",
    role: "seller",
    journey: "SELLER-VOUCHER",
    feature: "Shop voucher",
    summary: "Tạo ưu đãi Shop với điều kiện áp dụng do hệ thống kiểm tra.",
    keywords: ["voucher", "Shop", "khuyến mãi", "checkout"],
    status: "SOURCE_VERIFIED",
    sourceRefs: ["Front-End/src/pages/shop/seller/voucherManagement/index.tsx", "Front-End/src/services/voucher.api.ts"],
    steps: [
      { slug: "open", title: "Mở Voucher của Shop", description: "Vào Seller Center và mở mục Voucher của Shop." },
      { slug: "configure", title: "Thiết lập điều kiện", description: "Nhập loại giảm, giá trị, thời hạn và phạm vi áp dụng theo biểu mẫu." },
      { slug: "review", title: "Kiểm tra danh sách", description: "Sau khi lưu, đối chiếu voucher trong danh sách bằng dữ liệu server." },
    ],
  },
  {
    slug: "affiliate",
    title: "Quản lý Affiliate của Shop",
    role: "seller",
    journey: "SELLER-AFFILIATE",
    feature: "Affiliate",
    summary: "Theo dõi chương trình, attribution, conversion và payout theo trạng thái thật.",
    keywords: ["affiliate", "commission", "conversion", "payout"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/pages/shop/seller/affiliate/index.tsx", "docs/user-guide/FEATURE_GUIDE_MATRIX.md#Affiliate"],
    steps: [
      { slug: "program", title: "Mở chương trình", description: "Xem chương trình Affiliate được trả về cho Shop hiện tại." },
      { slug: "conversion", title: "Theo dõi chuyển đổi", description: "Đối chiếu conversion và commission với trạng thái backend." },
      { slug: "payout", title: "Kiểm tra payout", description: "Payout chỉ được coi là hoàn tất khi backend xác nhận trạng thái." },
    ],
  },
  {
    slug: "livestream",
    title: "Bán hàng qua livestream",
    role: "seller",
    journey: "SELLER-LIVESTREAM",
    feature: "Seller livestream",
    summary: "Chuẩn bị phiên live, ghim sản phẩm và theo dõi provider khi được cấu hình.",
    keywords: ["livestream", "live", "ghim sản phẩm", "Agora"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/pages/shop/seller/live/index.tsx", "docs/user-guide/FEATURE_GUIDE_MATRIX.md#Livestream"],
    steps: [
      { slug: "prepare", title: "Chuẩn bị phiên live", description: "Nhập thông tin phiên và chọn sản phẩm từ Shop." },
      { slug: "start", title: "Bắt đầu phiên", description: "Chỉ bắt đầu khi provider và quyền truy cập của môi trường đã sẵn sàng." },
      { slug: "review", title: "Đối chiếu kết quả", description: "Kiểm tra trạng thái phiên, tương tác và order từ dữ liệu thực tế." },
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
  {
    slug: "operations",
    title: "Vận hành Admin",
    role: "admin",
    journey: "ADMIN-OPERATIONS",
    feature: "Users, KYC, moderation, wallet",
    summary: "Tài liệu định hướng cho các khu vực Admin được backend cấp quyền.",
    keywords: ["Admin", "user", "KYC", "moderation", "wallet", "audit"],
    status: "UNVERIFIED",
    sourceRefs: ["Front-End/src/App.tsx", "back-end/apps/api-gateway/src/modules/admin/admin.controller.ts", "docs/UAT_TEST_MATRIX.md#AF-AD-001"],
    steps: [
      { slug: "dashboard", title: "Mở Admin Dashboard", description: "Cần tài khoản Admin active và session hợp lệ." },
      { slug: "review", title: "Chọn khu vực vận hành", description: "Mở Users, KYC, Shop, sản phẩm, voucher hoặc wallet theo quyền được cấp." },
      { slug: "audit", title: "Đối chiếu trạng thái", description: "Mọi quyết định và dữ liệu nhạy cảm phải được kiểm tra trong môi trường được phê duyệt." },
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
