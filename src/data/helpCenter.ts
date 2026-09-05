export type DocumentationStatus =
  | "VERIFIED"
  | "SOURCE_VERIFIED"
  | "PARTIAL"
  | "UNVERIFIED"
  | "NOT_IMPLEMENTED";

export type HelpPlatform = "desktop" | "mobile";
export type HelpRole = "buyer" | "seller" | "admin" | "qr";
export type HelpAudience = "public" | "admin";

export type HelpMarker = {
  number: number;
  guidance: string;
};

export type HelpMarkerSet = {
  desktop: HelpMarker[];
  mobile: HelpMarker[];
};

export type HelpStep = {
  slug: string;
  title: string;
  description: string;
  tip?: string;
  visual?: HelpVisual;
};

export type HelpVisual = {
  desktop: string;
  mobile: string;
  alt: string;
  markers: HelpMarkerSet;
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
    journey: "B04",
    feature: "Catalog, cart, checkout và order",
    summary: "Từ lúc tìm sản phẩm đến khi theo dõi đơn hàng.",
    keywords: ["mua hàng", "sản phẩm", "giỏ hàng", "checkout", "đơn hàng"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/App.tsx", "docs/UAT_TEST_MATRIX.md#AF-B-003"],
    steps: [
      {
        slug: "discover",
        title: "Tìm sản phẩm",
        description: "Mở catalog hoặc tìm kiếm để chọn sản phẩm công khai phù hợp.",
        visual: {
          desktop: "/journey-visuals/b02-discovery-desktop.png",
          mobile: "/journey-visuals/b02-discovery-mobile.png",
          alt: "Màn hình khám phá catalog sản phẩm trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Chọn danh mục phù hợp với sản phẩm cần tìm." },
              { number: 2, guidance: "Xem khu vực giới thiệu và khám phá sản phẩm." },
              { number: 3, guidance: "Mở khu vực Flash Sale để xem sản phẩm đang giảm giá." },
            ],
            mobile: [
              { number: 1, guidance: "Chọn danh mục phù hợp với sản phẩm cần tìm." },
              { number: 2, guidance: "Xem khu vực giới thiệu và khám phá sản phẩm." },
              { number: 3, guidance: "Mở khu vực Flash Sale để xem sản phẩm đang giảm giá." },
            ],
          },
        },
      },
      {
        slug: "product-detail",
        title: "Xem chi tiết",
        description: "Kiểm tra thông tin sản phẩm, shop, giá, tồn kho và biến thể.",
        visual: {
          desktop: "/journey-visuals/b02-product-detail-desktop.png",
          mobile: "/journey-visuals/b02-product-detail-mobile.png",
          alt: "Màn hình chi tiết sản phẩm và biến thể trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Xem hình ảnh và thông tin nhận diện sản phẩm." },
              { number: 2, guidance: "Chọn biến thể và số lượng còn khả dụng." },
              { number: 3, guidance: "Đọc khu vực xác thực sản phẩm chính hãng." },
            ],
            mobile: [
              { number: 1, guidance: "Xem hình ảnh sản phẩm để nhận diện mặt hàng." },
              { number: 2, guidance: "Đối chiếu tên và giá sản phẩm." },
              { number: 3, guidance: "Chọn dung tích hoặc biến thể phù hợp." },
            ],
          },
        },
      },
      { slug: "add-to-cart", title: "Thêm vào giỏ", description: "Chọn biến thể và số lượng, sau đó thêm sản phẩm vào giỏ hàng." },
      {
        slug: "cart",
        title: "Kiểm tra giỏ hàng",
        description: "Chọn sản phẩm cần mua và kiểm tra số lượng trước khi tiếp tục.",
        visual: {
          desktop: "/journey-visuals/b04-cart-desktop.png",
          mobile: "/journey-visuals/b04-cart-mobile.png",
          alt: "Giỏ hàng với huy hiệu tổng số lượng và điều khiển số lượng sản phẩm trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Kiểm tra tổng số lượng trên biểu tượng giỏ hàng." },
              { number: 2, guidance: "Dùng nút -/+ để thay đổi số lượng sản phẩm." },
            ],
            mobile: [
              { number: 1, guidance: "Kiểm tra tổng số lượng trên biểu tượng giỏ hàng." },
              { number: 2, guidance: "Dùng nút -/+ để thay đổi số lượng sản phẩm." },
            ],
          },
        },
      },
      { slug: "checkout", title: "Chuẩn bị thanh toán", description: "Chọn địa chỉ và phương thức vận chuyển. Tổng tiền phải đến từ báo giá server." },
      { slug: "order", title: "Theo dõi đơn hàng", description: "Sau khi đặt hàng thành công, mở đơn hàng để theo dõi trạng thái và các bước tiếp theo." },
    ],
  },
  {
    slug: "orders",
    title: "Theo dõi đơn hàng",
    role: "buyer",
    journey: "B05",
    feature: "Orders",
    summary: "Xem danh sách, chi tiết và trạng thái các đơn thuộc tài khoản của bạn.",
    keywords: ["đơn hàng", "trạng thái", "nhận hàng", "đánh giá"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/pages/profile/ordersPage.tsx", "docs/UAT_TEST_MATRIX.md#AF-B-004"],
    steps: [
      {
        slug: "list",
        title: "Mở danh sách đơn",
        description: "Vào Tài khoản rồi chọn Đơn mua để xem các đơn của bạn.",
        visual: {
          desktop: "/journey-visuals/b05-orders-desktop.png",
          mobile: "/journey-visuals/b05-orders-mobile.png",
          alt: "Danh sách đơn hàng Buyer với dữ liệu DOCS_UAT trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Khu vực danh sách đơn mua của tài khoản Buyer." },
              { number: 2, guidance: "Thông tin người nhận và đơn hàng DOCS_UAT." },
              { number: 3, guidance: "Mở chi tiết đơn hàng bằng nút xem chi tiết." },
            ],
            mobile: [
              { number: 1, guidance: "Khu vực danh sách đơn mua của tài khoản Buyer." },
              { number: 2, guidance: "Thông tin người nhận và đơn hàng DOCS_UAT." },
              { number: 3, guidance: "Mở chi tiết đơn hàng bằng nút xem chi tiết." },
            ],
          },
        },
      },
      {
        slug: "detail",
        title: "Xem chi tiết",
        description: "Chọn một đơn để xem sản phẩm, thanh toán và tiến trình giao hàng.",
        visual: {
          desktop: "/journey-visuals/b05-order-detail-desktop.png",
          mobile: "/journey-visuals/b05-order-detail-mobile.png",
          alt: "Chi tiết đơn hàng Buyer với thông tin tổng hợp DOCS_UAT trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Tiêu đề và trạng thái của đơn hàng DOCS_UAT." },
              { number: 2, guidance: "Thông tin sản phẩm, người nhận và vận chuyển tổng hợp." },
              { number: 3, guidance: "Tóm tắt thanh toán của đơn hàng UAT." },
            ],
            mobile: [
              { number: 1, guidance: "Tiêu đề và trạng thái của đơn hàng DOCS_UAT." },
              { number: 2, guidance: "Thông tin sản phẩm, người nhận và vận chuyển tổng hợp." },
              { number: 3, guidance: "Tóm tắt thanh toán của đơn hàng UAT." },
            ],
          },
        },
      },
      { slug: "next-action", title: "Thực hiện bước tiếp theo", description: "Chỉ chọn hành động được hiển thị cho trạng thái hiện tại của đơn." },
    ],
  },
  {
    slug: "account-start",
    title: "Tạo tài khoản và bắt đầu sử dụng",
    role: "buyer",
    journey: "B01",
    feature: "Authentication, profile and address",
    summary: "Đăng ký, đăng nhập và chuẩn bị hồ sơ trước khi mua hàng.",
    keywords: ["đăng ký", "đăng nhập", "hồ sơ", "địa chỉ"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/pages/auth/index.tsx", "Front-End/src/pages/profile/index.tsx", "docs/UAT_TEST_MATRIX.md#AF-API-001"],
    steps: [
      {
        slug: "register",
        title: "Đăng ký hoặc đăng nhập",
        description: "Dùng luồng xác thực đang được hệ thống cung cấp và chờ xác minh nếu tài khoản yêu cầu.",
        visual: {
          desktop: "/journey-visuals/b01-registration-desktop.png",
          mobile: "/journey-visuals/b01-registration-mobile.png",
          alt: "Màn hình đăng ký tài khoản Buyer trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Xác nhận bạn đang ở màn hình Tạo tài khoản." },
              { number: 2, guidance: "Điền họ tên, email, số điện thoại và mật khẩu." },
              { number: 3, guidance: "Đồng ý điều khoản, rồi chọn Đăng ký ngay." },
            ],
            mobile: [
              { number: 1, guidance: "Xác nhận bạn đang ở màn hình Tạo tài khoản." },
              { number: 2, guidance: "Điền họ tên, email, số điện thoại và mật khẩu." },
              { number: 3, guidance: "Đồng ý điều khoản, rồi chọn Đăng ký ngay." },
            ],
          },
        },
      },
      { slug: "profile", title: "Hoàn thiện hồ sơ", description: "Kiểm tra thông tin tài khoản sau khi đăng nhập thành công." },
      { slug: "address", title: "Thêm địa chỉ", description: "Thêm địa chỉ giao hàng trước khi bắt đầu checkout." },
    ],
  },
  {
    slug: "discover",
    title: "Tìm kiếm và khám phá sản phẩm",
    role: "buyer",
    journey: "B02",
    feature: "Search, catalog and product detail",
    summary: "Tìm sản phẩm, xem Shop, biến thể, tồn kho và thông tin đánh giá hiện có.",
    keywords: ["tìm kiếm", "danh mục", "Shop", "sản phẩm", "biến thể"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/pages/search/index.tsx", "Front-End/src/pages/product/productDetail.tsx", "Front-End/src/App.tsx"],
    steps: [
      {
        slug: "search",
        title: "Tìm sản phẩm",
        description: "Dùng tìm kiếm hoặc danh mục để mở sản phẩm công khai.",
        visual: {
          desktop: "/journey-visuals/b02-discovery-desktop.png",
          mobile: "/journey-visuals/b02-discovery-mobile.png",
          alt: "Màn hình khám phá catalog sản phẩm trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Chọn danh mục phù hợp với sản phẩm cần tìm." },
              { number: 2, guidance: "Xem khu vực giới thiệu và khám phá sản phẩm." },
              { number: 3, guidance: "Mở khu vực Flash Sale để xem sản phẩm đang giảm giá." },
            ],
            mobile: [
              { number: 1, guidance: "Chọn danh mục phù hợp với sản phẩm cần tìm." },
              { number: 2, guidance: "Xem khu vực giới thiệu và khám phá sản phẩm." },
              { number: 3, guidance: "Mở khu vực Flash Sale để xem sản phẩm đang giảm giá." },
            ],
          },
        },
      },
      {
        slug: "detail",
        title: "Kiểm tra chi tiết",
        description: "Đối chiếu Shop, giá, tồn kho, biến thể và nội dung đang hiển thị.",
        visual: {
          desktop: "/journey-visuals/b02-product-detail-desktop.png",
          mobile: "/journey-visuals/b02-product-detail-mobile.png",
          alt: "Màn hình chi tiết sản phẩm và biến thể trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Xem hình ảnh và thông tin nhận diện sản phẩm." },
              { number: 2, guidance: "Chọn biến thể và số lượng còn khả dụng." },
              { number: 3, guidance: "Đọc khu vực xác thực sản phẩm chính hãng." },
            ],
            mobile: [
              { number: 1, guidance: "Xem hình ảnh sản phẩm để nhận diện mặt hàng." },
              { number: 2, guidance: "Đối chiếu tên và giá sản phẩm." },
              { number: 3, guidance: "Chọn dung tích hoặc biến thể phù hợp." },
            ],
          },
        },
      },
      {
        slug: "choose",
        title: "Chọn biến thể phù hợp",
        description: "Chỉ tiếp tục với biến thể còn khả dụng và thông tin phù hợp với nhu cầu.",
        visual: {
          desktop: "/journey-visuals/b02-product-detail-desktop.png",
          mobile: "/journey-visuals/b02-product-detail-mobile.png",
          alt: "Màn hình chọn biến thể sản phẩm trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Xem hình ảnh và thông tin nhận diện sản phẩm." },
              { number: 2, guidance: "Chọn biến thể phù hợp trước khi tiếp tục." },
              { number: 3, guidance: "Đọc khu vực xác thực sản phẩm chính hãng." },
            ],
            mobile: [
              { number: 1, guidance: "Xem hình ảnh sản phẩm để nhận diện mặt hàng." },
              { number: 2, guidance: "Đối chiếu tên và giá sản phẩm trước khi chọn." },
              { number: 3, guidance: "Chọn dung tích hoặc biến thể phù hợp." },
            ],
          },
        },
      },
    ],
  },
  {
    slug: "community",
    title: "Community",
    role: "buyer",
    journey: "B08",
    feature: "Community feed, post and moderation",
    summary: "Khám phá nội dung cộng đồng và sử dụng các tương tác được cấp quyền.",
    keywords: ["community", "feed", "bài viết", "bình luận", "báo cáo"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/pages/community/index.tsx", "Front-End/src/pages/community/liveFeed.tsx", "Front-End/src/App.tsx"],
    steps: [
      {
        slug: "feed",
        title: "Mở Community",
        description: "Mở feed công khai và đọc nội dung được hệ thống trả về.",
        visual: {
          desktop: "/journey-visuals/b08-community-feed-desktop.png",
          mobile: "/journey-visuals/b08-community-feed-mobile.png",
          alt: "Màn hình feed cộng đồng DOCS_UAT trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Khu vực feed cộng đồng hiển thị bài viết." },
              { number: 2, guidance: "Tác giả demo DOCS_UAT của bài viết." },
              { number: 3, guidance: "Các nút tương tác của bài viết." },
            ],
            mobile: [
              { number: 1, guidance: "Khu vực feed cộng đồng hiển thị bài viết." },
              { number: 2, guidance: "Tác giả demo DOCS_UAT của bài viết." },
              { number: 3, guidance: "Các nút tương tác của bài viết." },
            ],
          },
        },
      },
      { slug: "interact", title: "Tương tác", description: "Chỉ dùng bình luận, reaction hoặc hành động khác khi control và quyền tương ứng hiển thị." },
      { slug: "report", title: "Báo cáo nội dung", description: "Hiện chưa có bề mặt báo cáo trong Community; không thực hiện thao tác gửi báo cáo." },
    ],
  },
  {
    slug: "voucher",
    title: "Áp dụng voucher khi mua hàng",
    role: "buyer",
    journey: "B06",
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
    journey: "B07",
    feature: "Chat",
    summary: "Mở cuộc trò chuyện với Shop và theo dõi trạng thái kết nối.",
    keywords: ["chat", "Shop", "tin nhắn", "reconnect"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/components/chat/ChatLayout.tsx", "docs/user-guide/FEATURE_GUIDE_MATRIX.md#Chat"],
    steps: [
      {
        slug: "open",
        title: "Mở Chat",
        description: "Từ Shop hoặc khu vực tin nhắn, mở cuộc trò chuyện phù hợp.",
        visual: {
          desktop: "/journey-visuals/b07-chat-open-desktop.png",
          mobile: "/journey-visuals/b07-chat-open-mobile.png",
          alt: "Lịch sử Chat tổng hợp giữa Buyer và Shop DOCS_UAT trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Khu vực Chat của tài khoản Buyer." },
              { number: 2, guidance: "Danh sách phòng trò chuyện đã lọc theo DOCS_UAT." },
              { number: 3, guidance: "Lịch sử tin nhắn tổng hợp giữa Buyer và Shop." },
            ],
            mobile: [
              { number: 1, guidance: "Khu vực nội dung của cuộc trò chuyện DOCS_UAT." },
              { number: 2, guidance: "Tiêu đề phòng và người trò chuyện tổng hợp." },
              { number: 3, guidance: "Các tin nhắn kiểm thử đã được seed an toàn." },
            ],
          },
        },
      },
      { slug: "send", title: "Gửi nội dung", description: "Kiểm tra người nhận trước khi gửi tin nhắn hoặc media được hỗ trợ." },
      { slug: "reconnect", title: "Xử lý mất kết nối", description: "Nếu tin nhắn chưa đồng bộ, chờ kết nối lại và không gửi lặp ngoài trạng thái hệ thống." },
    ],
  },
  {
    slug: "livestream",
    title: "Xem livestream và sản phẩm",
    role: "buyer",
    journey: "B09",
    feature: "Livestream",
    summary: "Khám phá phiên live, xem sản phẩm ghim và tiếp tục mua hàng khi flow sẵn sàng.",
    keywords: ["livestream", "live", "sản phẩm", "mua hàng"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/pages/live/index.tsx", "docs/user-guide/FEATURE_GUIDE_MATRIX.md#Livestream"],
    steps: [
      {
        slug: "discover",
        title: "Tìm phiên live",
        description: "Mở danh sách livestream công khai và chọn phiên đang hiển thị.",
        visual: {
          desktop: "/journey-visuals/b09-live-discovery-desktop.png",
          mobile: "/journey-visuals/b09-live-discovery-mobile.png",
          alt: "Màn hình khám phá livestream công khai trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Mở khu vực Mua sắm trực tiếp để xem livestream." },
              { number: 2, guidance: "Tìm phiên live theo tiêu đề hoặc tên Shop." },
              { number: 3, guidance: "Chọn thẻ phiên live đang phát để xem chi tiết." },
            ],
            mobile: [
              { number: 1, guidance: "Mở khu vực Mua sắm trực tiếp để xem livestream." },
              { number: 2, guidance: "Tìm phiên live theo tiêu đề hoặc tên Shop." },
              { number: 3, guidance: "Chọn thẻ phiên live đang phát để xem chi tiết." },
            ],
          },
        },
      },
      { slug: "watch", title: "Xem phiên live", description: "Theo dõi nội dung và sản phẩm được ghim trong phiên." },
      {
        slug: "shop",
        title: "Mở sản phẩm",
        description: "Mở sản phẩm từ phiên live; provider và mutation cần trạng thái runtime tương ứng.",
        visual: {
          desktop: "/journey-visuals/b02-product-detail-desktop.png",
          mobile: "/journey-visuals/b02-product-detail-mobile.png",
          alt: "Màn hình chi tiết sản phẩm và biến thể trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Xem hình ảnh và thông tin nhận diện sản phẩm." },
              { number: 2, guidance: "Chọn biến thể và số lượng còn khả dụng." },
              { number: 3, guidance: "Đọc khu vực xác thực sản phẩm chính hãng." },
            ],
            mobile: [
              { number: 1, guidance: "Xem hình ảnh sản phẩm để nhận diện mặt hàng." },
              { number: 2, guidance: "Đối chiếu tên và giá sản phẩm." },
              { number: 3, guidance: "Chọn dung tích hoặc biến thể phù hợp." },
            ],
          },
        },
      },
    ],
  },
  {
    slug: "verify-product",
    title: "Kiểm tra sản phẩm bằng QR",
    role: "qr",
    journey: "B03",
    feature: "QR verification",
    summary: "Nhập mã, liên kết hoặc tải ảnh QR để nhận kết quả xác thực do máy chủ trả về.",
    keywords: ["QR", "xác thực", "nguồn gốc", "provenance"],
    status: "PARTIAL",
    sourceRefs: [
      "Front-End/src/pages/qr/index.tsx",
      "back-end/prisma/schema.prisma#VerificationLabel",
      "back-end/prisma/schema.prisma#ProvenanceEvent",
      "back-end/prisma/seeds/05-batches-qr.seed.ts",
      "Front-End/src/services/verification.api.ts",
      "back-end/apps/api-gateway/src/modules/verification/verification.controller.ts",
      "back-end/libs/catalog-metadata/src/application/use-cases/verify-product.use-case.ts",
      "docs/UAT_ISSUES.md#AF-Q-001",
    ],
    steps: [
      {
        slug: "open",
        title: "Mở xác thực QR",
        description: "Mở trang Xác thực QR từ menu công khai.",
        visual: {
          desktop: "/journey-visuals/b03-open-desktop.png",
          mobile: "/journey-visuals/b03-open-mobile.png",
          alt: "Màn hình mở trình xác thực QR trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Thanh chọn phương thức kiểm tra, với QR Code đang được chọn." },
              { number: 2, guidance: "Khu vực tải ảnh QR Code để bắt đầu kiểm tra." },
              { number: 3, guidance: "Nút Kiểm tra ngay để gửi dữ liệu xác thực sau khi nhập." },
            ],
            mobile: [
              { number: 1, guidance: "Thanh chọn phương thức kiểm tra, với QR Code đang được chọn." },
              { number: 2, guidance: "Khu vực tải ảnh QR Code để bắt đầu kiểm tra." },
              { number: 3, guidance: "Nút Kiểm tra ngay để gửi dữ liệu xác thực sau khi nhập." },
            ],
          },
        },
      },
      {
        slug: "enter-code",
        title: "Nhập thông tin kiểm tra",
        description: "Chọn Mã xác thực, nhập mã được cấp và nhấn Kiểm tra ngay; ảnh PNG, JPEG hoặc WebP và liên kết dùng các phương thức tương ứng.",
        visual: {
          desktop: "/journey-visuals/b03-enter-code-desktop.png",
          mobile: "/journey-visuals/b03-enter-code-mobile.png",
          alt: "Màn hình nhập mã xác thực trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Tab Mã xác thực đang được chọn." },
              { number: 2, guidance: "Trường nhập mã xác thực." },
              { number: 3, guidance: "Nút Kiểm tra ngay để gửi mã sau khi nhập." },
            ],
            mobile: [
              { number: 1, guidance: "Tab Mã xác thực đang được chọn." },
              { number: 2, guidance: "Trường nhập mã xác thực." },
              { number: 3, guidance: "Nút Kiểm tra ngay để gửi mã sau khi nhập." },
            ],
          },
        },
      },
      {
        slug: "result",
        title: "Đọc kết quả",
        description: "Đọc trạng thái và dữ liệu nguồn gốc do máy chủ trả về; nếu ảnh không đọc được, hãy thử ảnh rõ hơn hoặc dùng liên kết/mã.",
        visual: {
          desktop: "/journey-visuals/b03-positive-result-desktop.png",
          mobile: "/journey-visuals/b03-positive-result-mobile.png",
          alt: "Màn hình hiển thị kết quả xác thực sản phẩm thành công trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Tiêu đề trang xác thực QR và trạng thái đang được kiểm tra." },
              { number: 2, guidance: "Thông báo sản phẩm đã được xác minh từ kết quả máy chủ." },
              { number: 3, guidance: "Các trường dữ liệu thương hiệu, sản phẩm, mẫu và mã lô trong kết quả nguồn gốc." },
            ],
            mobile: [
              { number: 1, guidance: "Tiêu đề trang xác thực QR và trạng thái đang được kiểm tra." },
              { number: 2, guidance: "Thông báo sản phẩm đã được xác minh từ kết quả máy chủ." },
              { number: 3, guidance: "Các trường dữ liệu thương hiệu, sản phẩm, mẫu và mã lô trong kết quả nguồn gốc." },
            ],
          },
        },
      },
    ],
  },
  {
    slug: "register-shop",
    title: "Đăng ký trở thành Shop",
    role: "seller",
    journey: "S01",
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
    journey: "S03",
    feature: "Product management",
    summary: "Tạo sản phẩm, thêm media, biến thể, giá và tồn kho để gửi duyệt.",
    keywords: ["sản phẩm", "media", "biến thể", "SKU", "tồn kho"],
    status: "PARTIAL",
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
    journey: "S05",
    feature: "Seller orders",
    summary: "Kiểm tra đơn, xác nhận, chuẩn bị và hoàn tất xử lý theo trạng thái thực tế.",
    keywords: ["đơn hàng", "seller", "xác nhận", "chuẩn bị", "giao hàng"],
    status: "PARTIAL",
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
    slug: "shop-setup",
    title: "Thiết lập Shop",
    role: "seller",
    journey: "S02",
    feature: "Shop profile and business settings",
    summary: "Hoàn thiện thông tin Shop, địa chỉ và cấu hình được hệ thống hỗ trợ.",
    keywords: ["Shop", "thông tin", "địa chỉ", "business", "thiết lập"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/pages/shop/seller/shopInfo/index.tsx", "Front-End/src/pages/shop/seller/businessInfo.tsx", "back-end/libs/shops/src/presentation/rpc/shops.rpc-controller.ts"],
    steps: [
      { slug: "profile", title: "Mở thông tin Shop", description: "Vào Seller Center và kiểm tra Shop đang được gắn với tài khoản hiện tại." },
      { slug: "business", title: "Cập nhật thông tin kinh doanh", description: "Chỉ nhập thông tin hợp lệ theo các trường và điều kiện đang hiển thị." },
      { slug: "save", title: "Lưu và đối chiếu trạng thái", description: "Tải lại hoặc kiểm tra phản hồi server để xác nhận thay đổi; quyền backend là nguồn sự thật." },
    ],
  },
  {
    slug: "manage-products",
    title: "Quản lý sản phẩm",
    role: "seller",
    journey: "S04",
    feature: "Product management",
    summary: "Sửa sản phẩm, biến thể, tồn kho và xử lý các trạng thái duyệt hiện có.",
    keywords: ["sản phẩm", "sửa", "tồn kho", "biến thể", "từ chối", "gửi duyệt"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/pages/shop/seller/productManagement/index.tsx", "Front-End/src/pages/shop/seller/productManagement/detail.tsx", "back-end/libs/offers/src/presentation/rpc/offers.rpc-controller.ts"],
    steps: [
      { slug: "open", title: "Mở danh sách sản phẩm", description: "Lọc và chọn sản phẩm thuộc Shop hiện tại." },
      { slug: "edit", title: "Cập nhật thông tin", description: "Sửa trường, media, biến thể hoặc tồn kho theo control được hiển thị." },
      { slug: "moderation", title: "Theo dõi duyệt", description: "Đọc offerStatus và moderationStatus thực tế; không coi bản nháp hoặc đang chờ là đã publish." },
    ],
  },
  {
    slug: "wallet",
    title: "Theo dõi ví và doanh thu Shop",
    role: "seller",
    journey: "S08",
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
    journey: "S06",
    feature: "Shop voucher",
    summary: "Tạo ưu đãi Shop với điều kiện áp dụng do hệ thống kiểm tra.",
    keywords: ["voucher", "Shop", "khuyến mãi", "checkout"],
    status: "PARTIAL",
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
    journey: "S07",
    feature: "Affiliate",
    summary: "Theo dõi chương trình, attribution, conversion và payout theo trạng thái thật.",
    keywords: ["affiliate", "commission", "conversion", "payout"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/pages/shop/seller/affiliate/index.tsx", "docs/user-guide/FEATURE_GUIDE_MATRIX.md#Affiliate"],
    steps: [
      {
        slug: "program",
        title: "Mở chương trình",
        description: "Xem chương trình Affiliate được trả về cho Shop hiện tại.",
        visual: {
          desktop: "/journey-visuals/affiliate-program-desktop.png",
          mobile: "/journey-visuals/affiliate-program-mobile.png",
          alt: "Màn hình chương trình Affiliate trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Mở tab Khám phá chương trình." },
              { number: 2, guidance: "Đọc thông tin chương trình và mức hoa hồng." },
              { number: 3, guidance: "Nhập mã giới thiệu nếu có, rồi chọn Tham gia khi đủ điều kiện." },
            ],
            mobile: [
              { number: 1, guidance: "Mở tab Khám phá chương trình." },
              { number: 2, guidance: "Đọc thông tin chương trình và mức hoa hồng." },
              { number: 3, guidance: "Nhập mã giới thiệu nếu có, rồi chọn Tham gia khi đủ điều kiện." },
            ],
          },
        },
      },
      { slug: "conversion", title: "Theo dõi chuyển đổi", description: "Đối chiếu conversion và commission với trạng thái backend." },
      { slug: "payout", title: "Kiểm tra payout", description: "Payout chỉ được coi là hoàn tất khi backend xác nhận trạng thái." },
    ],
  },
  {
    slug: "livestream",
    title: "Bán hàng qua livestream",
    role: "seller",
    journey: "S09",
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
    slug: "admin-dashboard",
    title: "Admin Dashboard",
    role: "admin",
    journey: "A01",
    feature: "Admin dashboard",
    summary: "Mở các chỉ số và khu vực vận hành được cấp cho tài khoản Admin.",
    keywords: ["Admin", "dashboard", "KPI", "vận hành"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/pages/admin/index.tsx", "Front-End/src/App.tsx", "docs/UAT_TEST_MATRIX.md#AF-AD-001"],
    steps: [
      {
        slug: "open",
        title: "Mở Dashboard",
        description: "Cần tài khoản Admin active và session hợp lệ; tài khoản bị suspended không được dùng để xác minh.",
        visual: {
          desktop: "/journey-visuals/admin-dashboard-desktop.png",
          mobile: "/journey-visuals/admin-dashboard-mobile.png",
          alt: "Màn hình Dashboard quản trị AntiFake trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Xác nhận mục Dashboard đang được chọn trong thanh điều hướng Admin." },
              { number: 2, guidance: "Đọc khu vực điều phối chính của Admin Dashboard." },
              { number: 3, guidance: "Kiểm tra các control trên header và danh tính tài khoản Admin." },
            ],
            mobile: [
              { number: 1, guidance: "Xác nhận mục Dashboard đang được chọn trong thanh điều hướng Admin." },
              { number: 2, guidance: "Đọc khu vực điều phối chính của Admin Dashboard." },
              { number: 3, guidance: "Kiểm tra các control trên header và danh tính tài khoản Admin." },
            ],
          },
        },
      },
      { slug: "read", title: "Đọc chỉ số", description: "Đối chiếu số liệu với backend và revision đang chạy trước khi đưa ra quyết định." },
    ],
  },
  {
    slug: "admin-users",
    title: "Quản lý người dùng",
    role: "admin",
    journey: "A02",
    feature: "Admin users",
    summary: "Tìm kiếm và xem trạng thái tài khoản trong phạm vi quyền Admin.",
    keywords: ["Admin", "user", "tài khoản", "suspended", "active"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/pages/admin/users/index.tsx", "back-end/libs/auth/src/presentation/rpc/auth.rpc-controller.ts", "docs/UAT_TEST_MATRIX.md#AF-AD-001"],
    steps: [
      {
        slug: "search",
        title: "Tìm người dùng",
        description: "Mở danh sách và tìm theo control đang có; không truy cập dữ liệu ngoài phạm vi được cấp.",
        visual: {
          desktop: "/journey-visuals/admin-users-desktop.png",
          mobile: "/journey-visuals/admin-users-mobile.png",
          alt: "Danh sách người dùng Admin đã lọc theo DOCS_UAT trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Tiêu đề khu vực quản lý người dùng trong Admin." },
              { number: 2, guidance: "Các chỉ số tổng quan do server trả về." },
              { number: 3, guidance: "Bảng người dùng chỉ hiển thị bản ghi DOCS_UAT đã lọc." },
            ],
            mobile: [
              { number: 1, guidance: "Thanh công cụ của hàng đợi người dùng Admin." },
              { number: 2, guidance: "Trường tìm kiếm đang lọc theo DOCS_UAT." },
              { number: 3, guidance: "Bảng kết quả với người dùng kiểm thử tổng hợp." },
            ],
          },
        },
      },
      {
        slug: "detail",
        title: "Xem chi tiết",
        description: "Đối chiếu role và accountStatus từ server trước mọi thao tác nhạy cảm.",
        visual: {
          desktop: "/journey-visuals/admin-user-detail-desktop.png",
          mobile: "/journey-visuals/admin-user-detail-mobile.png",
          alt: "Chi tiết người dùng kiểm thử DOCS_UAT trong Admin trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Thẻ hồ sơ của bản ghi người dùng DOCS_UAT." },
              { number: 2, guidance: "Tên hiển thị và role do server cung cấp." },
              { number: 3, guidance: "Ma trận thông tin tổng hợp để đối chiếu trước thao tác." },
            ],
            mobile: [
              { number: 1, guidance: "Thẻ hồ sơ của bản ghi người dùng DOCS_UAT." },
              { number: 2, guidance: "Tên hiển thị và role do server cung cấp." },
              { number: 3, guidance: "Ma trận thông tin tổng hợp để đối chiếu trước thao tác." },
            ],
          },
        },
      },
    ],
  },
  {
    slug: "admin-kyc",
    title: "Xử lý KYC",
    role: "admin",
    journey: "A03",
    feature: "KYC review",
    summary: "Xem hồ sơ KYC và xử lý theo quyền, trạng thái và lý do được hệ thống hỗ trợ.",
    keywords: ["Admin", "KYC", "xác minh", "duyệt", "từ chối"],
    status: "NOT_IMPLEMENTED",
    sourceRefs: ["Front-End/src/pages/admin/shopRegistrations/index.tsx", "back-end/libs/shops/src/presentation/rpc/shops.rpc-controller.ts", "docs/UAT_TEST_MATRIX.md#AF-AD-001"],
    steps: [
      { slug: "pending", title: "Mở hồ sơ chờ xử lý", description: "Chỉ dùng danh sách và hồ sơ do backend trả về." },
      { slug: "decision", title: "Ghi quyết định", description: "Chỉ approve hoặc reject khi quyền, dữ liệu và môi trường kiểm thử được phê duyệt." },
    ],
  },
  {
    slug: "admin-shop-review",
    title: "Duyệt Shop",
    role: "admin",
    journey: "A04",
    feature: "Shop review",
    summary: "Kiểm tra hồ sơ đăng ký Shop và trạng thái phê duyệt.",
    keywords: ["Admin", "Shop", "duyệt Shop", "hồ sơ"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/pages/admin/shopRegistrations/index.tsx", "back-end/libs/shops/src/presentation/rpc/shops.rpc-controller.ts", "docs/UAT_TEST_MATRIX.md#AF-AD-001"],
    steps: [
      { slug: "inspect", title: "Kiểm tra hồ sơ", description: "Đối chiếu thông tin Shop, tài liệu và KYC theo dữ liệu thật." },
      { slug: "decision", title: "Duyệt hoặc từ chối", description: "Ghi lý do và chỉ dùng transition mà backend cho phép." },
    ],
  },
  {
    slug: "admin-product-review",
    title: "Duyệt sản phẩm",
    role: "admin",
    journey: "A05",
    feature: "Product moderation",
    summary: "Xem sản phẩm chờ duyệt và xử lý trạng thái moderation.",
    keywords: ["Admin", "sản phẩm", "moderation", "approve", "reject"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/pages/admin/productRegistrations/index.tsx", "back-end/libs/offers/src/presentation/rpc/offers.rpc-controller.ts", "docs/UAT_TEST_MATRIX.md#AF-AD-001"],
    steps: [
      {
        slug: "pending",
        title: "Lọc sản phẩm chờ duyệt",
        description: "Dùng bộ lọc và dữ liệu server để chọn hồ sơ cần xem.",
        visual: {
          desktop: "/journey-visuals/admin-product-review-desktop.png",
          mobile: "/journey-visuals/admin-product-review-mobile.png",
          alt: "Màn hình duyệt sản phẩm AntiFake trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Mở khu vực đăng ký sản phẩm trong thanh điều hướng Admin." },
              { number: 2, guidance: "Đọc tiêu đề và bộ lọc của hàng đợi sản phẩm." },
              { number: 3, guidance: "Kiểm tra danh sách hoặc trạng thái trống do hệ thống trả về." },
            ],
            mobile: [
              { number: 1, guidance: "Mở khu vực đăng ký sản phẩm trong thanh điều hướng Admin." },
              { number: 2, guidance: "Đọc tiêu đề và bộ lọc của hàng đợi sản phẩm." },
              { number: 3, guidance: "Kiểm tra danh sách hoặc trạng thái trống do hệ thống trả về." },
            ],
          },
        },
      },
      { slug: "decision", title: "Ghi kết quả duyệt", description: "Đối chiếu lý do và trạng thái sau khi backend xác nhận." },
    ],
  },
  {
    slug: "admin-moderation",
    title: "Moderation nội dung",
    role: "admin",
    journey: "A06",
    feature: "Reports and moderation",
    summary: "Xem các khu vực moderation được backend cấp quyền.",
    keywords: ["Admin", "moderation", "report", "nội dung"],
    status: "NOT_IMPLEMENTED",
    sourceRefs: ["Front-End/src/pages/admin/index.tsx", "back-end/libs/orders/src/presentation/rpc/orders.rpc-controller.ts", "docs/UAT_TEST_MATRIX.md#AF-AD-001"],
    steps: [
      { slug: "queue", title: "Mở hàng đợi", description: "Chỉ xử lý report hoặc case xuất hiện trong giao diện được cấp quyền." },
      { slug: "review", title: "Đối chiếu bằng chứng", description: "Ghi nhận quyết định theo dữ liệu và audit rule của hệ thống." },
    ],
  },
  {
    slug: "admin-orders",
    title: "Theo dõi Order và Payment",
    role: "admin",
    journey: "A07",
    feature: "Order and payment oversight",
    summary: "Theo dõi order, payment và đối soát trong phạm vi quyền Admin.",
    keywords: ["Admin", "order", "payment", "đối soát"],
    status: "NOT_IMPLEMENTED",
    sourceRefs: ["Front-End/src/pages/admin/index.tsx", "back-end/libs/orders/src/presentation/rpc/orders.rpc-controller.ts", "docs/UAT_TEST_MATRIX.md#AF-AD-001"],
    steps: [
      { slug: "find", title: "Tìm giao dịch", description: "Dùng dữ liệu server để tìm order hoặc payment cần kiểm tra." },
      { slug: "audit", title: "Đối chiếu trạng thái", description: "Không suy diễn tiền hoặc trạng thái từ giao diện nếu backend chưa xác nhận." },
    ],
  },
  {
    slug: "admin-wallet",
    title: "Wallet và vận hành tài chính",
    role: "admin",
    journey: "A08",
    feature: "Wallet and financial operations",
    summary: "Xem ví, đối soát và xử lý tài khoản payout trong môi trường được phê duyệt.",
    keywords: ["Admin", "wallet", "payout", "đối soát", "tài chính"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/pages/admin/wallet/index.tsx", "back-end/libs/wallet/src/presentation/rpc/wallet.rpc-controller.ts", "docs/UAT_TEST_MATRIX.md#AF-AD-001"],
    steps: [
      { slug: "reconciliation", title: "Mở đối soát", description: "Đọc số dư và báo cáo do backend trả về." },
      { slug: "payout", title: "Kiểm tra payout", description: "Không thực hiện mutation production chỉ để lấy screenshot hoặc hoàn thành tài liệu." },
    ],
  },
  {
    slug: "admin-promotions",
    title: "Voucher và khuyến mãi nền tảng",
    role: "admin",
    journey: "A09",
    feature: "Platform promotion",
    summary: "Quản lý voucher hệ thống theo trạng thái và quyền được cấp.",
    keywords: ["Admin", "voucher", "khuyến mãi", "platform"],
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/pages/admin/vouchers/index.tsx", "back-end/libs/orders/src/presentation/rpc/orders.rpc-controller.ts", "docs/UAT_TEST_MATRIX.md#AF-AD-001"],
    steps: [
      {
        slug: "list",
        title: "Mở danh sách voucher",
        description: "Đối chiếu mã, thời hạn, phạm vi và status từ server.",
        visual: {
          desktop: "/journey-visuals/admin-promotions-desktop.png",
          mobile: "/journey-visuals/admin-promotions-mobile.png",
          alt: "Màn hình voucher hệ thống AntiFake trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Mở khu vực mã giảm giá trong thanh điều hướng Admin." },
              { number: 2, guidance: "Đọc các chỉ số và trạng thái voucher hiện có." },
              { number: 3, guidance: "Kiểm tra biểu mẫu tạo voucher và phần xem trước trước khi thao tác." },
            ],
            mobile: [
              { number: 1, guidance: "Mở khu vực mã giảm giá trong thanh điều hướng Admin." },
              { number: 2, guidance: "Đọc các chỉ số và trạng thái voucher hiện có." },
              { number: 3, guidance: "Kiểm tra biểu mẫu tạo voucher và phần xem trước trước khi thao tác." },
            ],
          },
        },
      },
      { slug: "change", title: "Cập nhật status", description: "Chỉ thay đổi khi có fixture và quyền Admin được phê duyệt." },
    ],
  },
  {
    slug: "admin-audit",
    title: "Audit và monitoring",
    role: "admin",
    journey: "A10",
    feature: "Audit and monitoring",
    summary: "Theo dõi audit evidence và health signals có trong hệ thống.",
    keywords: ["Admin", "audit", "monitoring", "health", "evidence"],
    status: "NOT_IMPLEMENTED",
    sourceRefs: ["Front-End/src/pages/admin/wallet/index.tsx", "docs/UAT_REPORT.md", "docs/UAT_TEST_MATRIX.md#AF-AD-001"],
    steps: [
      { slug: "observe", title: "Quan sát chỉ số", description: "Ghi lại revision, thời điểm và phạm vi dữ liệu khi kiểm tra." },
      { slug: "record", title: "Lưu evidence", description: "Tách evidence UAT khỏi ảnh hướng dẫn và không đưa secret hoặc PII vào tài liệu." },
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
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/App.tsx", "back-end/apps/api-gateway/src/modules/admin/admin.controller.ts", "docs/UAT_TEST_MATRIX.md#AF-AD-001"],
    steps: [
      {
        slug: "dashboard",
        title: "Mở Admin Dashboard",
        description: "Cần tài khoản Admin active và session hợp lệ để truy cập.",
        visual: {
          desktop: "/journey-visuals/admin-dashboard-desktop.png",
          mobile: "/journey-visuals/admin-dashboard-mobile.png",
          alt: "Màn hình Dashboard quản trị AntiFake trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Xác nhận mục Dashboard đang được chọn trong thanh điều hướng Admin." },
              { number: 2, guidance: "Đọc khu vực điều phối chính của Admin Dashboard." },
              { number: 3, guidance: "Kiểm tra các control trên header và danh tính tài khoản Admin." },
            ],
            mobile: [
              { number: 1, guidance: "Xác nhận mục Dashboard đang được chọn trong thanh điều hướng Admin." },
              { number: 2, guidance: "Đọc khu vực điều phối chính của Admin Dashboard." },
              { number: 3, guidance: "Kiểm tra các control trên header và danh tính tài khoản Admin." },
            ],
          },
        },
      },
      { slug: "shop-review", title: "Xem hồ sơ Shop", description: "Kiểm tra hồ sơ và chỉ dùng các hành động được backend cho phép." },
      {
        slug: "product-review",
        title: "Xem sản phẩm chờ duyệt",
        description: "Đối chiếu thông tin trước khi approve hoặc reject.",
        visual: {
          desktop: "/journey-visuals/admin-product-review-desktop.png",
          mobile: "/journey-visuals/admin-product-review-mobile.png",
          alt: "Màn hình duyệt sản phẩm AntiFake trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Mở khu vực đăng ký sản phẩm trong thanh điều hướng Admin." },
              { number: 2, guidance: "Đọc tiêu đề và bộ lọc của hàng đợi sản phẩm." },
              { number: 3, guidance: "Kiểm tra danh sách hoặc trạng thái trống do hệ thống trả về." },
            ],
            mobile: [
              { number: 1, guidance: "Mở khu vực đăng ký sản phẩm trong thanh điều hướng Admin." },
              { number: 2, guidance: "Đọc tiêu đề và bộ lọc của hàng đợi sản phẩm." },
              { number: 3, guidance: "Kiểm tra danh sách hoặc trạng thái trống do hệ thống trả về." },
            ],
          },
        },
      },
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
    status: "PARTIAL",
    sourceRefs: ["Front-End/src/App.tsx", "back-end/apps/api-gateway/src/modules/admin/admin.controller.ts", "docs/UAT_TEST_MATRIX.md#AF-AD-001"],
    steps: [
      {
        slug: "dashboard",
        title: "Mở Admin Dashboard",
        description: "Cần tài khoản Admin active và session hợp lệ.",
        visual: {
          desktop: "/journey-visuals/admin-dashboard-desktop.png",
          mobile: "/journey-visuals/admin-dashboard-mobile.png",
          alt: "Màn hình Dashboard quản trị AntiFake trên Desktop hoặc Mobile",
          markers: {
            desktop: [
              { number: 1, guidance: "Xác nhận mục Dashboard đang được chọn trong thanh điều hướng Admin." },
              { number: 2, guidance: "Đọc khu vực điều phối chính của Admin Dashboard." },
              { number: 3, guidance: "Kiểm tra các control trên header và danh tính tài khoản Admin." },
            ],
            mobile: [
              { number: 1, guidance: "Xác nhận mục Dashboard đang được chọn trong thanh điều hướng Admin." },
              { number: 2, guidance: "Đọc khu vực điều phối chính của Admin Dashboard." },
              { number: 3, guidance: "Kiểm tra các control trên header và danh tính tài khoản Admin." },
            ],
          },
        },
      },
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

export function getVisibleHelpArticles(audience: HelpAudience) {
  return helpArticles.filter((article) =>
    audience === "admin" ? article.role === "admin" : article.role !== "admin",
  );
}

export function getArticleUrl(
  article: HelpArticle,
  stepSlug?: string,
  audience: HelpAudience = article.role === "admin" ? "admin" : "public",
) {
  const basePath = audience === "admin" ? "/admin/help" : "/help";
  return `${basePath}/${article.role}/${article.slug}${stepSlug ? `/${stepSlug}` : ""}`;
}

export function getArticleForPath(
  pathname: string,
  audience: HelpAudience = "public",
) {
  const basePath = audience === "admin" ? "/admin/help" : "/help";
  const parts = pathname
    .replace(new RegExp(`^${basePath}/?`), "")
    .split("/")
    .filter(Boolean);
  if (parts.length < 2) return { article: undefined, stepSlug: undefined };

  const article = getVisibleHelpArticles(audience).find(
    (candidate) => candidate.role === parts[0] && candidate.slug === parts[1],
  );

  return { article, stepSlug: parts[2] };
}
