import { ArrowLeft, ArrowRight, BookOpen, CircleHelp, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../css/pages/helpCenter.css";
import {
  getArticleForPath,
  getArticleUrl,
  getVisibleHelpArticles,
  helpRoleLabels,
  type HelpAudience,
  type DocumentationStatus,
  type HelpArticle,
  type HelpPlatform,
  type HelpRole,
} from "../../data/helpCenter";

const publicRoles: Array<"all" | HelpRole> = ["all", "buyer", "seller", "qr"];
const HELP_PLATFORM_PREFERENCE_KEY = "antifake.help.platform";

function detectPlatform(): HelpPlatform {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
    ? "mobile"
    : "desktop";
}

function readPlatformPreference(): HelpPlatform | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const stored = window.sessionStorage.getItem(HELP_PLATFORM_PREFERENCE_KEY);
    return stored === "desktop" || stored === "mobile" ? stored : undefined;
  } catch {
    return undefined;
  }
}

function savePlatformPreference(platform: HelpPlatform) {
  try {
    window.sessionStorage.setItem(HELP_PLATFORM_PREFERENCE_KEY, platform);
  } catch {
    // Private browsing or a blocked storage area should not disable Help Center.
  }
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

function ArticleCard({ article, audience }: { article: HelpArticle; audience: HelpAudience }) {
  return (
    <Link className="help-article-card" to={getArticleUrl(article, undefined, audience)}>
      <div className="help-article-card-topline">
        <span>{helpRoleLabels[article.role]}</span>
        <span className={`help-status help-status-${article.status.toLowerCase()}`}>
          {availability(article.status)}
        </span>
      </div>
      <h2>{article.title}</h2>
      <p>{article.summary}</p>
      <span className="help-card-link">{article.status === "NOT_IMPLEMENTED" ? "Xem trạng thái" : "Xem hành trình"} <ArrowRight size={16} aria-hidden="true" /></span>
    </Link>
  );
}

function UnavailableJourney({ article, audience }: { article: HelpArticle; audience: HelpAudience }) {
  return (
    <article className="help-journey" aria-labelledby="help-journey-title">
      <Link className="help-breadcrumb" to={audience === "admin" ? "/admin/help" : "/help"}>
        {audience === "admin" ? "Hướng dẫn Admin" : "Trung tâm trợ giúp AntiFake"}
      </Link>
      <div className="help-journey-header">
        <div>
          <p className="help-eyebrow">{helpRoleLabels[article.role]} · {article.journey}</p>
          <h2 id="help-journey-title">{article.title}</h2>
          <p>{article.summary}</p>
        </div>
      </div>
      <div className="help-progress">
        <span>Journey {article.journey}</span>
        <span>{availability(article.status)}</span>
      </div>
      <div className="help-journey-unavailable" role="status">
        <BookOpen size={28} aria-hidden="true" />
        <strong>{availability(article.status)}</strong>
        <p>Chưa có route frontend được đăng ký cho journey này. Không có bước thao tác production để làm theo.</p>
      </div>
      <div className="help-step-navigation">
        <span />
        <Link to={audience === "admin" ? "/admin/help" : "/help"}>
          {audience === "admin" ? "Về Hướng dẫn Admin" : "Về Help Center"}
        </Link>
      </div>
    </article>
  );
}

function JourneyView({ article, stepSlug, platform, audience, onPlatformChange }: {
  article: HelpArticle;
  stepSlug?: string;
  platform: HelpPlatform;
  audience: HelpAudience;
  onPlatformChange: (platform: HelpPlatform) => void;
}) {
  if (article.status === "NOT_IMPLEMENTED") {
    return <UnavailableJourney article={article} audience={audience} />;
  }

  const currentIndex = stepSlug ? article.steps.findIndex((step) => step.slug === stepSlug) : -1;
  const currentStep = currentIndex >= 0 ? article.steps[currentIndex] : undefined;
  const isOverview = !currentStep;
  const previousStep = currentStep ? article.steps[currentIndex - 1] : undefined;
  const nextStep = currentStep ? article.steps[currentIndex + 1] : undefined;
  const firstStep = article.steps[0];
  const visual = currentStep?.visual;

  return (
    <article className="help-journey" aria-labelledby="help-journey-title">
      <Link className="help-breadcrumb" to={audience === "admin" ? "/admin/help" : "/help"}>
        {audience === "admin" ? "Hướng dẫn Admin" : "Trung tâm trợ giúp AntiFake"}
      </Link>
      <div className="help-journey-header">
        <div>
          <p className="help-eyebrow">{helpRoleLabels[article.role]} · {article.journey}</p>
          <h2 id="help-journey-title">{isOverview ? article.title : currentStep.title}</h2>
          <p>{isOverview ? article.summary : currentStep.description}</p>
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

      <div
        className="help-progress"
        aria-label={isOverview ? `Tổng quan Journey ${article.journey}` : `Tiến trình bước ${currentIndex + 1} trên ${article.steps.length}`}
      >
        <span>{isOverview ? `Tổng quan · ${article.steps.length} bước` : `Bước ${currentIndex + 1}/${article.steps.length}`}</span>
        <span>{availability(article.status)}</span>
      </div>

      <div className="help-journey-body">
        <nav className="help-step-list" aria-label="Các bước trong hành trình">
          <Link className="help-overview-link" to={getArticleUrl(article, undefined, audience)} aria-current={isOverview ? "page" : undefined}>Tổng quan hành trình</Link>
          {article.steps.map((step, index) => (
            <Link
              className={index === currentIndex ? "is-current" : ""}
              key={step.slug}
              to={getArticleUrl(article, step.slug, audience)}
              aria-current={index === currentIndex ? "step" : undefined}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {step.title}
            </Link>
          ))}
        </nav>

        <section className={isOverview ? "help-step-content help-journey-overview" : "help-step-content"}>
          {isOverview ? (
            <div className="help-overview-panel" data-testid="help-overview">
              <BookOpen size={28} aria-hidden="true" />
              <h3>{article.title}</h3>
              <p>{article.summary}</p>
              <ol className="help-overview-list">
                {article.steps.map((step, index) => (
                  <li key={step.slug}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <Link to={getArticleUrl(article, step.slug, audience)}>{step.title}</Link>
                  </li>
                ))}
              </ol>
              {firstStep && (
                <Link className="help-overview-start" data-testid="help-overview-start" to={getArticleUrl(article, firstStep.slug, audience)}>
                  Bắt đầu hành trình <ArrowRight size={16} aria-hidden="true" />
                </Link>
              )}
              <div className="help-result-note">
                <strong>{availability(article.status)}</strong>
                <p>Hành trình này không thay thế bước kiểm thử hoặc quyền backend.</p>
              </div>
            </div>
          ) : (
            <>
              {visual?.markers.length ? (
                <div className="help-marker-guide" aria-label="Giải thích vị trí được đánh dấu">
                  <strong>Vị trí cần chú ý trên ảnh</strong>
                  <ol>
                    {visual.markers.map((marker) => (
                      <li key={marker.number}>
                        <span>{marker.number}</span>
                        <p>{marker.guidance}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
              {visual ? (
                <figure className="help-visual" data-testid="help-visual">
                  <img src={visual[platform]} alt={visual.alt} loading="eager" />
                  <figcaption>
                    Visual {platform === "mobile" ? "Mobile" : "Desktop"} đã đăng ký cho bước này.
                  </figcaption>
                </figure>
              ) : (
                <div className="help-visual-placeholder" role="status">
                  <BookOpen size={28} aria-hidden="true" />
                  <strong>Visual {platform === "mobile" ? "Mobile" : "Desktop"} đang chờ evidence</strong>
                  <span>Chỉ thêm screenshot sau khi đúng revision, viewport và test data được xác minh.</span>
                </div>
              )}
              {currentStep.tip && <p className="help-tip"><CircleHelp size={17} aria-hidden="true" /> {currentStep.tip}</p>}
              <div className="help-result-note">
                <strong>Kết quả mong đợi</strong>
                <p>{availability(article.status)}. Không dùng bài này để thay thế bước kiểm thử hoặc quyền backend.</p>
              </div>
            </>
          )}
        </section>
      </div>

      <div className="help-step-navigation">
        {!isOverview && previousStep ? <Link to={getArticleUrl(article, previousStep.slug, audience)}><ArrowLeft size={16} /> Trước</Link> : <span />}
        {isOverview && firstStep ? <Link to={getArticleUrl(article, firstStep.slug, audience)}>Bắt đầu <ArrowRight size={16} /></Link> : nextStep ? <Link to={getArticleUrl(article, nextStep.slug, audience)}>Tiếp theo <ArrowRight size={16} /></Link> : <Link to={audience === "admin" ? "/admin/help" : "/help"}>{audience === "admin" ? "Về Hướng dẫn Admin" : "Về Help Center"}</Link>}
      </div>
    </article>
  );
}

export default function HelpCenterPage({ mode = "public" }: { mode?: HelpAudience }) {
  const location = useLocation();
  const audience = mode;
  const { article, stepSlug } = getArticleForPath(location.pathname, audience);
  const [query, setQuery] = useState(() => new URLSearchParams(location.search).get("q") ?? "");
  const [role, setRole] = useState<"all" | HelpRole>("all");
  const [viewportPlatform, setViewportPlatform] = useState<HelpPlatform>(detectPlatform);
  const [platformOverride, setPlatformOverride] = useState<HelpPlatform | undefined>(readPlatformPreference);
  const platform = platformOverride ?? viewportPlatform;

  const handlePlatformChange = (nextPlatform: HelpPlatform) => {
    setPlatformOverride(nextPlatform);
    savePlatformPreference(nextPlatform);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 767px)");
    const handleChange = (event: MediaQueryListEvent) => setViewportPlatform(event.matches ? "mobile" : "desktop");
    media.addEventListener?.("change", handleChange);
    return () => media.removeEventListener?.("change", handleChange);
  }, []);

  const visibleArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return getVisibleHelpArticles(audience).filter((candidate) => {
      const roleMatches = audience === "admin" || role === "all" || candidate.role === role;
      const haystack = [candidate.title, candidate.summary, candidate.feature, ...candidate.keywords].join(" ").toLocaleLowerCase();
      return roleMatches && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [audience, query, role]);

  const roles = audience === "admin" ? (["admin"] as const) : publicRoles;
  const PageContainer = audience === "admin" ? "div" : "main";

  return (
    <PageContainer className={`help-center-page${audience === "admin" ? " admin-help-page" : ""}`}>
      <header className="help-center-hero">
        <div>
          <p className="help-eyebrow">{audience === "admin" ? "ANTIFAKE · ADMIN GUIDE" : "ANTIFAKE · HELP & JOURNEY"}</p>
          <h1>{audience === "admin" ? "Hướng dẫn vận hành Admin" : "Trung tâm trợ giúp AntiFake"}</h1>
          <p>{audience === "admin" ? "Tài liệu nội bộ cho các khu vực quản trị được cấp quyền và trạng thái hiện có." : "Tìm hướng dẫn theo mục tiêu, vai trò và từng bước thao tác. Journey Center tự ưu tiên Desktop hoặc Mobile theo viewport nhưng luôn cho phép bạn đổi thủ công."}</p>
        </div>
        <div className="help-hero-mark" aria-hidden="true"><CircleHelp size={48} /></div>
      </header>

      <div className="help-search-row">
        <label className="help-search-field">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Tìm trong hướng dẫn</span>
          <input
            id="help-search"
            name="query"
            type="search"
            aria-label="Tìm trong hướng dẫn"
            placeholder="Tìm theo đơn hàng, Shop, QR..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <Link className="help-ebook-link" to={audience === "admin" ? "/admin/help" : "/help"}>Mở toàn bộ hướng dẫn <ArrowRight size={16} /></Link>
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
            {visibleArticles.length > 0 ? visibleArticles.map((item) => <ArticleCard key={`${item.role}-${item.slug}`} article={item} audience={audience} />) : (
              <div className="help-empty-state" role="status"><strong>Chưa có bài phù hợp</strong><span>Thử từ khóa khác hoặc chọn vai trò khác.</span></div>
            )}
          </section>
        </>
      ) : (
        <JourneyView article={article} stepSlug={stepSlug} platform={platform} audience={audience} onPlatformChange={handlePlatformChange} />
      )}
    </PageContainer>
  );
}
