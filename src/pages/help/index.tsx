import { ArrowLeft, ArrowRight, BookOpen, CircleHelp, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../css/pages/helpCenter.css";
import {
  getArticleForPath,
  getArticleUrl,
  helpArticles,
  helpRoleLabels,
  type DocumentationStatus,
  type HelpArticle,
  type HelpPlatform,
  type HelpRole,
} from "../../data/helpCenter";

const roles: Array<"all" | HelpRole> = ["all", "buyer", "seller", "admin", "qr"];

function detectPlatform(): HelpPlatform {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
    ? "mobile"
    : "desktop";
}

function availability(status: DocumentationStatus) {
  switch (status) {
    case "VERIFIED":
      return "Đã kiểm tra trong phạm vi hiện có";
    case "PARTIAL":
      return "Đang hoàn thiện thêm bước";
    case "SOURCE_VERIFIED":
      return "Đang chờ kiểm tra đầy đủ";
    case "NOT_IMPLEMENTED":
      return "Tính năng chưa sẵn sàng";
    default:
      return "Chưa đủ bằng chứng để xác nhận";
  }
}

function ArticleCard({ article }: { article: HelpArticle }) {
  return (
    <Link className="help-article-card" to={getArticleUrl(article)}>
      <div className="help-article-card-topline">
        <span>{helpRoleLabels[article.role]}</span>
        <span className={`help-status help-status-${article.status.toLowerCase()}`}>
          {availability(article.status)}
        </span>
      </div>
      <h2>{article.title}</h2>
      <p>{article.summary}</p>
      <span className="help-card-link">Xem hành trình <ArrowRight size={16} aria-hidden="true" /></span>
    </Link>
  );
}

function JourneyView({ article, stepSlug, platform, onPlatformChange }: {
  article: HelpArticle;
  stepSlug?: string;
  platform: HelpPlatform;
  onPlatformChange: (platform: HelpPlatform) => void;
}) {
  const currentIndex = Math.max(0, article.steps.findIndex((step) => step.slug === stepSlug));
  const currentStep = article.steps[currentIndex];
  const previousStep = article.steps[currentIndex - 1];
  const nextStep = article.steps[currentIndex + 1];

  return (
    <article className="help-journey" aria-labelledby="help-journey-title">
      <Link className="help-breadcrumb" to="/help">Trung tâm trợ giúp AntiFake</Link>
      <div className="help-journey-header">
        <div>
          <p className="help-eyebrow">{helpRoleLabels[article.role]} · {article.journey}</p>
          <h2 id="help-journey-title">{currentStep.title}</h2>
          <p>{currentStep.description}</p>
        </div>
        <div className="help-platform-switcher" aria-label="Chọn nền tảng hướng dẫn">
          <span className="help-platform-label" data-testid="help-platform-label">Hướng dẫn {platform === "mobile" ? "Mobile" : "Desktop"}</span>
          <div className="help-platform-buttons">
            {(["desktop", "mobile"] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={platform === option ? "is-active" : ""}
                aria-pressed={platform === option}
                onClick={() => onPlatformChange(option)}
              >
                {option === "desktop" ? "Desktop" : "Mobile"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="help-progress" aria-label={`Tiến trình bước ${currentIndex + 1} trên ${article.steps.length}`}>
        <span>Bước {currentIndex + 1}/{article.steps.length}</span>
        <span>{availability(article.status)}</span>
      </div>

      <div className="help-journey-body">
        <nav className="help-step-list" aria-label="Các bước trong hành trình">
          <Link className="help-overview-link" to={getArticleUrl(article)}>Tổng quan hành trình</Link>
          {article.steps.map((step, index) => (
            <Link
              className={index === currentIndex ? "is-current" : ""}
              key={step.slug}
              to={getArticleUrl(article, step.slug)}
              aria-current={index === currentIndex ? "step" : undefined}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {step.title}
            </Link>
          ))}
        </nav>

        <section className="help-step-content">
          <div className="help-visual-placeholder" role="status">
            <BookOpen size={28} aria-hidden="true" />
            <strong>Visual {platform === "mobile" ? "Mobile" : "Desktop"} đang chờ evidence</strong>
            <span>Chỉ thêm screenshot sau khi đúng revision, viewport và test data được xác minh.</span>
          </div>
          {currentStep.tip && <p className="help-tip"><CircleHelp size={17} aria-hidden="true" /> {currentStep.tip}</p>}
          <div className="help-result-note">
            <strong>Kết quả mong đợi</strong>
            <p>{availability(article.status)}. Không dùng bài này để thay thế bước kiểm thử hoặc quyền backend.</p>
          </div>
        </section>
      </div>

      <div className="help-step-navigation">
        {previousStep ? <Link to={getArticleUrl(article, previousStep.slug)}><ArrowLeft size={16} /> Trước</Link> : <span />}
        {nextStep ? <Link to={getArticleUrl(article, nextStep.slug)}>Tiếp theo <ArrowRight size={16} /></Link> : <Link to="/help">Về Help Center</Link>}
      </div>
    </article>
  );
}

export default function HelpCenterPage() {
  const location = useLocation();
  const { article, stepSlug } = getArticleForPath(location.pathname);
  const [query, setQuery] = useState(() => new URLSearchParams(location.search).get("q") ?? "");
  const [role, setRole] = useState<"all" | HelpRole>("all");
  const [viewportPlatform, setViewportPlatform] = useState<HelpPlatform>(detectPlatform);
  const [platformOverride, setPlatformOverride] = useState<HelpPlatform>();
  const platform = platformOverride ?? viewportPlatform;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 767px)");
    const handleChange = (event: MediaQueryListEvent) => setViewportPlatform(event.matches ? "mobile" : "desktop");
    media.addEventListener?.("change", handleChange);
    return () => media.removeEventListener?.("change", handleChange);
  }, []);

  const visibleArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return helpArticles.filter((candidate) => {
      const roleMatches = role === "all" || candidate.role === role;
      const haystack = [candidate.title, candidate.summary, candidate.feature, ...candidate.keywords].join(" ").toLocaleLowerCase();
      return roleMatches && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [query, role]);

  return (
    <main className="help-center-page">
      <header className="help-center-hero">
        <div>
          <p className="help-eyebrow">ANTIFAKE · HELP & JOURNEY</p>
          <h1>Trung tâm trợ giúp AntiFake</h1>
          <p>Tìm hướng dẫn theo mục tiêu, vai trò và từng bước thao tác. Journey Center tự ưu tiên Desktop hoặc Mobile theo viewport nhưng luôn cho phép bạn đổi thủ công.</p>
        </div>
        <div className="help-hero-mark" aria-hidden="true"><CircleHelp size={48} /></div>
      </header>

      <div className="help-search-row">
        <label className="help-search-field">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Tìm trong hướng dẫn</span>
          <input
            type="search"
            aria-label="Tìm trong hướng dẫn"
            placeholder="Tìm theo đơn hàng, Shop, QR..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <Link className="help-ebook-link" to="/help">Mở toàn bộ hướng dẫn <ArrowRight size={16} /></Link>
      </div>

      {!article ? (
        <>
          <section className="help-role-filter" aria-label="Lọc theo vai trò">
            {roles.map((option) => (
              <button key={option} type="button" aria-pressed={role === option} className={role === option ? "is-active" : ""} onClick={() => setRole(option)}>
                {helpRoleLabels[option]}
              </button>
            ))}
          </section>
          <section className="help-article-grid" aria-label="Danh sách hướng dẫn">
            {visibleArticles.length > 0 ? visibleArticles.map((item) => <ArticleCard key={`${item.role}-${item.slug}`} article={item} />) : (
              <div className="help-empty-state" role="status"><strong>Chưa có bài phù hợp</strong><span>Thử từ khóa khác hoặc chọn vai trò khác.</span></div>
            )}
          </section>
        </>
      ) : (
        <JourneyView article={article} stepSlug={stepSlug} platform={platform} onPlatformChange={setPlatformOverride} />
      )}
    </main>
  );
}
