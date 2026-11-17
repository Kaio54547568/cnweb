import React, { useState, useEffect, useRef } from "react";
import {
  Home,
  Library,
  BookOpen,
  Play,
  Pause,
  Heart,
  SkipBack,
  SkipForward,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import {
  Brand,
  SidebarItem,
  Header,
  MobileNavigation,
  Button,
  TextField,
  SearchField,
  FilterChip,
  ContentCard,
  EpisodeRow,
  ProgressBar,
  Tab,
  TranscriptRow,
  RubyText,
  DictionaryPopover,
  SavedWordCard,
  SavedSentenceCard,
  EmptyState,
  Toggle,
  getInitials,
} from "./DesignSystem";
import {
  SERIES_LIST,
  EPISODES_LIST,
  ORDER_DRINK_TRANSCRIPT,
  DICTIONARY_ENTRIES,
  SeriesItem,
  Episode,
  TranscriptItem,
  WordEntry,
} from "../data/mockData";

export type ScreenId = "Home" | "Library" | "Watch" | "Auth" | "Notebook";

export interface MVPSharedState {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  selectedEpisode: Episode;
  onSelectEpisode: (ep: Episode, resume?: boolean, startAt?: number) => void;
  currentTimeSec: number;
  onSeekTime: (sec: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  savedSeriesIds: string[];
  onToggleSaveSeries: (id: string) => void;
  savedWordIds: string[];
  onToggleSaveWord: (entry: WordEntry) => void;
  savedSentenceIds: string[];
  onToggleSaveSentence: (item: TranscriptItem) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  levelFilter: string;
  onLevelFilterChange: (lvl: string) => void;
  isLoggedIn: boolean;
  userName: string;
  onLoginSuccess: (email: string) => void;
  onLogout: () => void;
  showAnnotation?: boolean;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

const formatMMSS = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const LEVELS = ["ALL", "N5", "N4", "N3", "N2"] as const;

/* ============================================================================
 * SIDEBAR DESKTOP 240px — Trang chủ, Kho nội dung, Sổ tay
 * Thẻ "Đang học dở" chỉ hiện ở các màn không tự có nút Xem tiếp (Home, Watch)
 * ========================================================================== */
const DesktopSidebar: React.FC<{
  currentScreen: ScreenId;
  onNavigate: (s: ScreenId) => void;
  savedTotalCount: number;
  onResumeEpisode: () => void;
  resumeEpisode: Episode;
}> = ({ currentScreen, onNavigate, savedTotalCount, onResumeEpisode, resumeEpisode }) => {
  const showResume = currentScreen !== "Home" && currentScreen !== "Watch";
  return (
    <aside
      aria-label="Điều hướng chính"
      className="w-[240px] shrink-0 bg-canvas border-r border-line flex flex-col justify-between p-4 select-none sticky top-0 h-screen overflow-y-auto"
    >
      <div className="flex flex-col gap-6">
        <div className="px-2 pt-1">
          <Brand size="md" onClick={() => onNavigate("Home")} />
        </div>

        <nav className="flex flex-col gap-1" aria-label="Menu chính">
          <SidebarItem
            icon={<Home className="w-4 h-4" />}
            label="Trang chủ"
            selected={currentScreen === "Home"}
            onClick={() => onNavigate("Home")}
          />
          <SidebarItem
            icon={<Library className="w-4 h-4" />}
            label="Kho nội dung"
            selected={currentScreen === "Library" || currentScreen === "Watch"}
            onClick={() => onNavigate("Library")}
          />
          <SidebarItem
            icon={<BookOpen className="w-4 h-4" />}
            label="Sổ tay"
            selected={currentScreen === "Notebook"}
            badgeCount={savedTotalCount}
            onClick={() => onNavigate("Notebook")}
          />
        </nav>
      </div>

      {showResume && (
        <div className="p-3 rounded-[12px] bg-surface border border-line flex flex-col gap-2.5">
          <div className="text-xs text-muted">Đang học dở</div>
          <div className="text-sm font-semibold text-fg truncate">{resumeEpisode.title}</div>
          <ProgressBar percent={resumeEpisode.progressPercent} />
          <Button
            size="sm"
            variant="primary"
            fullWidth
            iconLeft={<Play className="w-3.5 h-3.5 fill-current" />}
            onClick={onResumeEpisode}
          >
            Xem tiếp từ {formatMMSS(resumeEpisode.lastWatchedSecond)}
          </Button>
        </div>
      )}
    </aside>
  );
};

/* ============================================================================
 * NỘI DUNG 5 MÀN HÌNH (Dùng chung cho Desktop & Mobile)
 * ========================================================================== */
export const ScreenViewport: React.FC<{
  screen: ScreenId;
  device?: "Desktop" | "Mobile";
  state: MVPSharedState;
}> = ({ screen, device, state }) => {
  const [isMobileWidth, setIsMobileWidth] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileWidth(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = device ? device === "Mobile" : isMobileWidth;
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [activeDictId, setActiveDictId] = useState<string | null>(null);
  const [showFurigana, setShowFurigana] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [notebookTab, setNotebookTab] = useState<"words" | "sentences" | "series">("words");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [passError, setPassError] = useState("");
  const transcriptRef = useRef<HTMLDivElement>(null);

  const savedTotalCount =
    state.savedWordIds.length + state.savedSentenceIds.length + state.savedSeriesIds.length;

  const focusEpisode = EPISODES_LIST[0];

  /* ---- Phụ đề đang phát: câu cuối cùng có mốc bắt đầu <= thời gian hiện tại ---- */
  const transcript = ORDER_DRINK_TRANSCRIPT;
  const activeIndex = transcript.reduce(
    (acc, t, i) => (state.currentTimeSec >= t.seconds ? i : acc),
    0,
  );
  const activeSub = transcript[activeIndex];
  const currentWordEntry = activeDictId ? DICTIONARY_ENTRIES[activeDictId] : null;

  const goPrevSentence = () => {
    const target =
      state.currentTimeSec - activeSub.seconds > 3
        ? activeSub.seconds
        : transcript[Math.max(0, activeIndex - 1)].seconds;
    state.onSeekTime(target);
  };
  const goNextSentence = () => {
    state.onSeekTime(transcript[Math.min(transcript.length - 1, activeIndex + 1)].seconds);
  };

  /* ---- Rời màn Xem tập thì đóng hộp tra từ ---- */
  useEffect(() => {
    if (screen !== "Watch") setActiveDictId(null);
  }, [screen]);

  /* ---- Tự cuộn danh sách phụ đề tới câu đang phát ---- */
  useEffect(() => {
    if (screen !== "Watch") return;
    const box = transcriptRef.current;
    if (!box) return;
    const el = box.querySelector<HTMLElement>(`#sub-${activeSub.id}`);
    if (!el || box.scrollHeight <= box.clientHeight) return;
    box.scrollTo({ top: Math.max(0, el.offsetTop - 8), behavior: "smooth" });
  }, [screen, activeSub.id]);

  /* ---- Phím tắt trên màn Xem tập: Space phát/dừng, ←/→ đổi câu ---- */
  useEffect(() => {
    if (screen !== "Watch") return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === " " && tag !== "BUTTON") {
        e.preventDefault();
        state.onTogglePlay();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrevSentence();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNextSentence();
      } else if (e.key === "Escape") {
        setActiveDictId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ---- Tìm kiếm: gõ ở bất kỳ màn nào cũng đưa tới Kho nội dung để thấy kết quả ---- */
  const handleSearchChange = (q: string) => {
    state.onSearchChange(q);
    if (q.trim() && screen !== "Library") state.onNavigate("Library");
  };

  const query = state.searchQuery.trim();
  const filteredSeries = SERIES_LIST.filter((s) => {
    const matchLevel = state.levelFilter === "ALL" || s.level === state.levelFilter;
    const q = query.toLowerCase();
    const matchQuery =
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.level.toLowerCase().includes(q);
    return matchLevel && matchQuery;
  });

  const handleWatchSeries = (series: SeriesItem) => {
    const ep = EPISODES_LIST.find((e) => e.id === series.featuredEpisodeId) || EPISODES_LIST[0];
    state.onSelectEpisode(ep, true);
  };

  const submitAuth = (e: React.FormEvent) => {
    e.preventDefault();
    let ok = true;
    if (!/^\S+@\S+\.\S+$/.test(authEmail.trim())) {
      setAuthError("Nhập email hợp lệ, ví dụ ten@gmail.com.");
      ok = false;
    } else {
      setAuthError("");
    }
    if (authPassword.length < 8) {
      setPassError("Mật khẩu cần ít nhất 8 ký tự.");
      ok = false;
    } else {
      setPassError("");
    }
    if (ok) {
      state.onLoginSuccess(authEmail.trim());
      setAuthPassword("");
    }
  };

  const dictionaryCard = currentWordEntry ? (
    <DictionaryPopover
      entry={currentWordEntry}
      saved={state.savedWordIds.includes(currentWordEntry.id)}
      onToggleSaveWord={state.onToggleSaveWord}
      onClose={() => setActiveDictId(null)}
      showAnnotation={state.showAnnotation}
    />
  ) : null;

  const containerPad = isMobile ? "p-4" : "p-6";

  const renderMainBody = () => {
    switch (screen) {
      /* ----------------------------------------------------------------------
       * 1. TRANG CHỦ — một việc chính: học tiếp
       * -------------------------------------------------------------------- */
      case "Home": {
        const focusSeries = SERIES_LIST.find((s) => s.id === focusEpisode.seriesId) ?? SERIES_LIST[0];
        const sample = transcript[0];
        const inProgress = EPISODES_LIST.filter(
          (e) => e.id !== focusEpisode.id && e.progressPercent > 0 && e.progressPercent < 100,
        );
        return (
          <div
            className={`${containerPad} ${isMobile ? "gap-8" : "gap-10"} flex flex-col w-full max-w-[1280px] mx-auto`}
          >
            <section
              aria-labelledby="continue-title"
              className={`grid gap-6 items-center ${
                isMobile ? "grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]"
              }`}
            >
              <div className="flex flex-col gap-4 order-last lg:order-first">
                <p className="text-sm text-muted">Tiếp tục học · {focusSeries.title}</p>
                <h1
                  id="continue-title"
                  className="text-2xl md:text-3xl font-bold text-fg leading-tight"
                >
                  Tập {focusEpisode.number}: {focusEpisode.title}
                </h1>

                <figure className="border-l-2 border-brand pl-4 flex flex-col gap-1">
                  <RubyText
                    segments={sample.segments}
                    size={isMobile ? "md" : "lg"}
                    onSelectWord={(dictId) => {
                      setActiveDictId(dictId);
                      state.onSelectEpisode(focusEpisode, true);
                    }}
                  />
                  <figcaption className="text-sm text-muted">{sample.vi}</figcaption>
                </figure>

                <div className="max-w-md">
                  <ProgressBar
                    percent={focusEpisode.progressPercent}
                    label={`${formatMMSS(focusEpisode.lastWatchedSecond)} / ${focusEpisode.duration}`}
                    showValue
                  />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="primary"
                    size="lg"
                    iconLeft={<Play className="w-4 h-4 fill-current" />}
                    onClick={() => state.onSelectEpisode(focusEpisode, true)}
                  >
                    Xem tiếp từ {formatMMSS(focusEpisode.lastWatchedSecond)}
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => state.onSelectEpisode(focusEpisode, false)}
                  >
                    Xem từ đầu
                  </Button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => state.onSelectEpisode(focusEpisode, true)}
                aria-label={`Xem tiếp tập ${focusEpisode.number}: ${focusEpisode.title}`}
                className="group relative block aspect-video w-full overflow-hidden rounded-[16px] border border-line bg-canvas cursor-pointer"
              >
                <img src={focusEpisode.thumbnail} alt="" className="w-full h-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
                  <span className="w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </span>
                </span>
                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-[8px] bg-black/70 text-white text-xs font-mono">
                  {focusEpisode.duration}
                </span>
              </button>
            </section>

            <section className="flex flex-col gap-4" aria-labelledby="series-title">
              <div className="flex items-end justify-between gap-3">
                <h2 id="series-title" className="text-lg font-bold text-fg">
                  Khám phá series
                </h2>
                <button
                  type="button"
                  onClick={() => state.onNavigate("Library")}
                  className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-fg cursor-pointer"
                >
                  Xem tất cả <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div
                className={`grid gap-4 ${
                  isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
                }`}
              >
                {SERIES_LIST.map((series) => (
                  <ContentCard
                    key={series.id}
                    series={series}
                    saved={state.savedSeriesIds.includes(series.id)}
                    onToggleSave={state.onToggleSaveSeries}
                    onWatch={handleWatchSeries}
                    showAnnotation={state.showAnnotation}
                  />
                ))}
              </div>
            </section>

            {inProgress.length > 0 && (
              <section className="flex flex-col gap-3" aria-labelledby="progress-title">
                <h2 id="progress-title" className="text-lg font-bold text-fg">
                  Đang học dở
                </h2>
                <div
                  className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}
                >
                  {inProgress.map((ep) => (
                    <EpisodeRow
                      key={ep.id}
                      episode={ep}
                      onWatch={(chosen) => state.onSelectEpisode(chosen, true)}
                      showAnnotation={state.showAnnotation}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        );
      }

      /* ----------------------------------------------------------------------
       * 2. KHO NỘI DUNG — lọc một chỗ, thấy số kết quả
       * -------------------------------------------------------------------- */
      case "Library": {
        const cafeSeries = SERIES_LIST.find((s) => s.id === "series-cafe") ?? SERIES_LIST[0];
        const showCafeEpisodes = filteredSeries.some((s) => s.id === cafeSeries.id);
        const hasFilter = state.levelFilter !== "ALL" || query !== "";
        return (
          <div
            className={`${containerPad} ${isMobile ? "gap-5" : "gap-6"} flex flex-col w-full max-w-[1280px] mx-auto`}
          >
            <header className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-fg">Kho nội dung</h1>
              <p className="text-sm text-muted" aria-live="polite">
                {query
                  ? `${filteredSeries.length} kết quả cho “${query}”`
                  : `${SERIES_LIST.length} series video Nhật – Việt, từ N5 đến N2`}
              </p>
            </header>

            <div className="flex items-center gap-2 flex-wrap">
              {LEVELS.map((lvl) => {
                const count =
                  lvl === "ALL" ? SERIES_LIST.length : SERIES_LIST.filter((s) => s.level === lvl).length;
                return (
                  <FilterChip
                    key={lvl}
                    label={`${lvl === "ALL" ? "Tất cả" : lvl} (${count})`}
                    selected={state.levelFilter === lvl}
                    onClick={() => state.onLevelFilterChange(lvl)}
                  />
                );
              })}
              {hasFilter && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    state.onLevelFilterChange("ALL");
                    state.onSearchChange("");
                  }}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>

            {filteredSeries.length === 0 ? (
              <EmptyState
                title="Không có series phù hợp"
                description="Thử chọn trình độ khác hoặc tìm bằng từ khóa ngắn hơn."
                actionLabel="Xóa bộ lọc"
                onAction={() => {
                  state.onLevelFilterChange("ALL");
                  state.onSearchChange("");
                }}
              />
            ) : (
              <div
                className={`grid gap-4 ${
                  isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
                }`}
              >
                {filteredSeries.map((series) => (
                  <ContentCard
                    key={series.id}
                    series={series}
                    saved={state.savedSeriesIds.includes(series.id)}
                    onToggleSave={state.onToggleSaveSeries}
                    onWatch={handleWatchSeries}
                    showAnnotation={state.showAnnotation}
                  />
                ))}
              </div>
            )}

            {showCafeEpisodes && (
              <section className="flex flex-col gap-3 pt-2" aria-labelledby="episodes-title">
                <div>
                  <h2 id="episodes-title" className="text-lg font-bold text-fg">
                    Các tập: {cafeSeries.title}
                  </h2>
                  <p className="text-sm text-muted">{cafeSeries.episodeCount} tập · {cafeSeries.level}</p>
                </div>
                <div className="flex flex-col gap-2.5">
                  {EPISODES_LIST.map((ep) => (
                    <EpisodeRow
                      key={ep.id}
                      episode={ep}
                      active={state.selectedEpisode.id === ep.id}
                      onWatch={(chosen) => state.onSelectEpisode(chosen, true)}
                      showAnnotation={state.showAnnotation}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        );
      }

      /* ----------------------------------------------------------------------
       * 3. XEM TẬP — video, phụ đề lớn bên dưới, tra từ ngay cạnh danh sách câu
       * -------------------------------------------------------------------- */
      case "Watch": {
        const ep = state.selectedEpisode;
        const total = ep.durationSeconds;
        const now = Math.min(state.currentTimeSec, total);
        const epSeries = SERIES_LIST.find((s) => s.id === ep.seriesId);
        const sentenceSaved = state.savedSentenceIds.includes(activeSub.id);

        const ctrlBtn =
          "w-9 h-9 rounded-full inline-flex items-center justify-center text-white hover:bg-white/15 cursor-pointer transition-colors";

        return (
          <div className={`${containerPad} ${isMobile ? "gap-4" : "gap-5"} flex flex-col`}>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => state.onNavigate("Library")}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-fg self-start cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kho nội dung</span>
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-fg leading-tight">{ep.title}</h1>
                <p className="text-sm text-muted mt-0.5">
                  {epSeries ? `${epSeries.title} · ` : ""}Tập {ep.number} · {ep.level}
                </p>
              </div>
            </div>

            <div
              className={`grid gap-6 ${
                isMobile ? "grid-cols-1" : "xl:grid-cols-[minmax(0,1fr)_400px] items-start"
              }`}
            >
              {/* Cột trái: video + phụ đề đang phát */}
              <div className="flex flex-col gap-4 min-w-0">
                <div className="rounded-[16px] bg-surface border border-line overflow-hidden">
                  <div className="group relative aspect-video w-full bg-black overflow-hidden">
                    <img src={ep.thumbnail} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={state.onTogglePlay}
                      aria-label={state.isPlaying ? "Tạm dừng" : "Phát"}
                      className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    >
                      <span
                        className={`w-16 h-16 rounded-full bg-brand text-white flex items-center justify-center shadow-lg transition-opacity ${
                          state.isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                        }`}
                      >
                        {state.isPlaying ? (
                          <Pause className="w-7 h-7 fill-current" />
                        ) : (
                          <Play className="w-7 h-7 fill-current ml-1" />
                        )}
                      </span>
                    </button>

                    <div className="absolute inset-x-0 bottom-0 px-3 pb-2 pt-10 bg-gradient-to-t from-black/85 to-transparent text-white">
                      <input
                        type="range"
                        className="seek w-full cursor-pointer"
                        min={0}
                        max={total}
                        step={1}
                        value={now}
                        onChange={(e) => state.onSeekTime(Number(e.target.value))}
                        aria-label="Tua video"
                        aria-valuetext={`${formatMMSS(now)} trên ${ep.duration}`}
                      />
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          type="button"
                          className={ctrlBtn}
                          onClick={goPrevSentence}
                          aria-label="Câu trước"
                          title="Câu trước (←)"
                        >
                          <SkipBack className="w-4 h-4 fill-current" />
                        </button>
                        <button
                          type="button"
                          className={ctrlBtn}
                          onClick={state.onTogglePlay}
                          aria-label={state.isPlaying ? "Tạm dừng" : "Phát"}
                          title="Phát / dừng (Phím cách)"
                        >
                          {state.isPlaying ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          className={ctrlBtn}
                          onClick={goNextSentence}
                          aria-label="Câu sau"
                          title="Câu sau (→)"
                        >
                          <SkipForward className="w-4 h-4 fill-current" />
                        </button>
                        <span className="ml-2 text-xs font-mono">
                          {formatMMSS(now)} / {ep.duration}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 md:p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-xs font-mono text-muted">
                        Câu {activeIndex + 1}/{transcript.length} · {activeSub.startTime}
                      </span>
                      <div className="flex items-center gap-4">
                        <Toggle label="Furigana" checked={showFurigana} onChange={setShowFurigana} />
                        <Toggle
                          label="Nghĩa tiếng Việt"
                          checked={showTranslation}
                          onChange={setShowTranslation}
                        />
                      </div>
                    </div>

                    <div className="min-h-[104px] flex flex-col gap-1.5">
                      <RubyText
                        segments={activeSub.segments}
                        activeDictId={activeDictId}
                        onSelectWord={(id) => setActiveDictId(id)}
                        size={isMobile ? "lg" : "xl"}
                        showFurigana={showFurigana}
                      />
                      {showTranslation && <p className="text-base text-muted">{activeSub.vi}</p>}
                    </div>

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-xs text-muted">
                        Chạm vào từ gạch chân để tra nghĩa
                        {!isMobile && " · Phím cách: phát/dừng · ← →: đổi câu"}
                      </p>
                      <Button
                        size="sm"
                        variant="secondary"
                        iconLeft={
                          <Heart className={`w-4 h-4 ${sentenceSaved ? "fill-brand text-brand" : ""}`} />
                        }
                        onClick={() => state.onToggleSaveSentence(activeSub)}
                      >
                        {sentenceSaved ? "Đã lưu câu" : "Lưu câu này"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Màn vừa (chưa đủ rộng cho cột phải): hộp tra từ nằm ngay dưới phụ đề */}
                {!isMobile && dictionaryCard && <div className="xl:hidden">{dictionaryCard}</div>}
              </div>

              {/* Cột phải: hộp tra từ + danh sách câu (cuộn riêng trên màn rộng) */}
              <aside
                className={`flex flex-col gap-3 min-h-0 ${
                  isMobile ? "" : "xl:sticky xl:top-[96px] xl:h-[calc(100vh-120px)]"
                }`}
              >
                {!isMobile && dictionaryCard && (
                  <div className="hidden xl:block shrink-0">{dictionaryCard}</div>
                )}
                <div className="rounded-[16px] bg-surface border border-line flex flex-col min-h-0 flex-1">
                  <div className="px-4 py-3 border-b border-line flex items-center justify-between shrink-0">
                    <h2 className="text-sm font-semibold text-fg">Phụ đề · {transcript.length} câu</h2>
                    <span className="text-xs text-muted">Chạm câu để tua</span>
                  </div>
                  <div
                    ref={transcriptRef}
                    className="relative flex-1 min-h-0 xl:overflow-y-auto p-3 flex flex-col gap-2"
                  >
                    {transcript.map((item) => (
                      <TranscriptRow
                        key={item.id}
                        item={item}
                        active={activeSub.id === item.id}
                        saved={state.savedSentenceIds.includes(item.id)}
                        activeDictId={activeDictId}
                        onSeek={(sec) => state.onSeekTime(sec)}
                        onToggleSaveSentence={state.onToggleSaveSentence}
                        onSelectWord={(dictId) => setActiveDictId(dictId)}
                        showAnnotation={state.showAnnotation}
                        showFurigana={showFurigana}
                        showTranslation={showTranslation}
                      />
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        );
      }

      /* ----------------------------------------------------------------------
       * 4. TÀI KHOẢN / ĐĂNG NHẬP
       * -------------------------------------------------------------------- */
      case "Auth":
        return (
          <div className="p-6 flex-1 flex items-center justify-center">
            <div className="w-full max-w-md rounded-[16px] bg-surface border border-line p-6 flex flex-col gap-5 shadow-lg">
              <button
                type="button"
                onClick={() => state.onNavigate("Home")}
                className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg self-start cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Trang chủ</span>
              </button>

              {state.isLoggedIn ? (
                <>
                  <div className="flex items-center gap-4">
                    <span className="w-14 h-14 rounded-full bg-brand-tint border border-brand text-lg font-bold text-fg flex items-center justify-center shrink-0">
                      {getInitials(state.userName)}
                    </span>
                    <div className="min-w-0">
                      <h1 className="text-xl font-bold text-fg truncate">{state.userName}</h1>
                      <p className="text-sm text-muted">Tiến độ và Sổ tay đã được đồng bộ</p>
                    </div>
                  </div>

                  <dl className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: "Từ vựng", value: state.savedWordIds.length },
                      { label: "Câu", value: state.savedSentenceIds.length },
                      { label: "Series", value: state.savedSeriesIds.length },
                    ].map((stat) => (
                      <div key={stat.label} className="p-3 rounded-[12px] bg-canvas border border-line">
                        <dd className="text-xl font-bold text-fg">{stat.value}</dd>
                        <dt className="text-xs text-muted">{stat.label}</dt>
                      </div>
                    ))}
                  </dl>

                  {state.onToggleTheme && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-sm text-fg">Giao diện</span>
                      <Toggle
                        label="Chế độ sáng"
                        checked={state.theme === "light"}
                        onChange={() => state.onToggleTheme?.()}
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <Button variant="primary" size="lg" fullWidth onClick={() => state.onNavigate("Notebook")}>
                      Mở Sổ tay
                    </Button>
                    <Button variant="ghost" size="md" fullWidth onClick={state.onLogout}>
                      Đăng xuất
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <Brand size="md" />
                    <h1 className="text-xl font-bold text-fg mt-2">
                      {authMode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
                    </h1>
                    <p className="text-sm text-muted">
                      Lưu từ vựng, câu phụ đề và tiến độ xem để học tiếp trên mọi thiết bị.
                    </p>
                  </div>

                  <Tab
                    tabs={[
                      { id: "login", label: "Đăng nhập" },
                      { id: "register", label: "Đăng ký" },
                    ]}
                    activeId={authMode}
                    onChange={(id) => {
                      setAuthMode(id as "login" | "register");
                      setAuthError("");
                      setPassError("");
                    }}
                  />

                  <form onSubmit={submitAuth} className="flex flex-col gap-4" noValidate>
                    <TextField
                      id="auth-email"
                      label="Email"
                      type="email"
                      value={authEmail}
                      onChange={setAuthEmail}
                      placeholder="ten@gmail.com"
                      errorText={authError}
                    />
                    <TextField
                      id="auth-password"
                      label="Mật khẩu"
                      type="password"
                      value={authPassword}
                      onChange={setAuthPassword}
                      placeholder="Ít nhất 8 ký tự"
                      errorText={passError}
                    />
                    <Button type="submit" variant="primary" size="lg" fullWidth>
                      {authMode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        );

      /* ----------------------------------------------------------------------
       * 5. SỔ TAY — từ vựng, câu, series đã lưu
       * -------------------------------------------------------------------- */
      case "Notebook": {
        const savedWords = Object.values(DICTIONARY_ENTRIES).filter((w) =>
          state.savedWordIds.includes(w.id),
        );
        const savedSentences = transcript.filter((s) => state.savedSentenceIds.includes(s.id));
        const savedSeries = SERIES_LIST.filter((sr) => state.savedSeriesIds.includes(sr.id));

        return (
          <div
            className={`${containerPad} ${isMobile ? "gap-5" : "gap-6"} flex flex-col w-full max-w-[1280px] mx-auto`}
          >
            <header className="flex flex-col gap-3">
              <div>
                <h1 className="text-2xl font-bold text-fg">Sổ tay</h1>
                <p className="text-sm text-muted">Những gì bạn đã lưu khi xem video</p>
              </div>
              <Tab
                tabs={[
                  { id: "words", label: "Từ vựng", count: savedWords.length },
                  { id: "sentences", label: "Câu", count: savedSentences.length },
                  { id: "series", label: "Series", count: savedSeries.length },
                ]}
                activeId={notebookTab}
                onChange={(id) => setNotebookTab(id as "words" | "sentences" | "series")}
              />
            </header>

            {notebookTab === "words" &&
              (savedWords.length === 0 ? (
                <EmptyState
                  title="Chưa có từ vựng nào"
                  description="Khi xem video, chạm vào từ gạch chân rồi bấm trái tim để lưu."
                  actionLabel="Xem tập Gọi đồ uống"
                  onAction={() => state.onSelectEpisode(focusEpisode, true)}
                />
              ) : (
                <div
                  className={`grid gap-4 ${
                    isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                  }`}
                >
                  {savedWords.map((entry) => (
                    <SavedWordCard
                      key={entry.id}
                      entry={entry}
                      onRemove={() => state.onToggleSaveWord(entry)}
                      onJumpToEpisode={() => state.onSelectEpisode(focusEpisode, true)}
                      showAnnotation={state.showAnnotation}
                    />
                  ))}
                </div>
              ))}

            {notebookTab === "sentences" &&
              (savedSentences.length === 0 ? (
                <EmptyState
                  title="Chưa có câu nào"
                  description="Bấm “Lưu câu này” hoặc trái tim ở dòng phụ đề khi xem video."
                  actionLabel="Xem tập Gọi đồ uống"
                  onAction={() => state.onSelectEpisode(focusEpisode, true)}
                />
              ) : (
                <div
                  className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}
                >
                  {savedSentences.map((sentence) => (
                    <SavedSentenceCard
                      key={sentence.id}
                      sentence={sentence}
                      onRemove={() => state.onToggleSaveSentence(sentence)}
                      onWatchSentence={(sec) => state.onSelectEpisode(focusEpisode, false, sec)}
                      showAnnotation={state.showAnnotation}
                    />
                  ))}
                </div>
              ))}

            {notebookTab === "series" &&
              (savedSeries.length === 0 ? (
                <EmptyState
                  title="Chưa lưu series nào"
                  description="Bấm trái tim trên thẻ series để thêm vào danh sách của bạn."
                  actionLabel="Khám phá Kho nội dung"
                  onAction={() => state.onNavigate("Library")}
                />
              ) : (
                <div
                  className={`grid gap-4 ${
                    isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
                  }`}
                >
                  {savedSeries.map((series) => (
                    <ContentCard
                      key={series.id}
                      series={series}
                      saved={true}
                      onToggleSave={state.onToggleSaveSeries}
                      onWatch={handleWatchSeries}
                      showAnnotation={state.showAnnotation}
                    />
                  ))}
                </div>
              ))}
          </div>
        );
      }
    }
  };

  if (isMobile) {
    const sheetOpen = screen === "Watch" && Boolean(dictionaryCard);
    return (
      <div className="flex-1 flex flex-col justify-between bg-canvas relative">
        <Header
          isMobile
          searchQuery={state.searchQuery}
          onSearchChange={handleSearchChange}
          onOpenMobileSearch={() => setMobileSearchOpen((v) => !v)}
          isLoggedIn={state.isLoggedIn}
          userName={state.userName}
          onOpenAuth={() => state.onNavigate("Auth")}
          onNavigateHome={() => state.onNavigate("Home")}
          showAnnotation={state.showAnnotation}
          theme={state.theme}
          onToggleTheme={state.onToggleTheme}
        />

        {mobileSearchOpen && (
          <div className="p-3 bg-surface border-b border-line flex items-center gap-2">
            <SearchField
              autoFocus
              value={state.searchQuery}
              onChange={handleSearchChange}
              placeholder="Tìm series hoặc chủ đề…"
            />
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="text-sm font-medium text-brand px-2 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        <main className={`flex-1 ${sheetOpen ? "pb-80" : ""}`}>{renderMainBody()}</main>

        {sheetOpen && (
          <div className="fixed inset-x-0 bottom-16 z-40 p-3">{dictionaryCard}</div>
        )}

        <MobileNavigation
          activeTab={
            screen === "Notebook"
              ? "notebook"
              : screen === "Library" || screen === "Watch"
                ? "library"
                : "home"
          }
          onSelectTab={(tab) => {
            if (tab === "home") state.onNavigate("Home");
            if (tab === "library") state.onNavigate("Library");
            if (tab === "notebook") state.onNavigate("Notebook");
          }}
          savedCount={savedTotalCount}
        />
      </div>
    );
  }

  // Desktop: Sidebar 240px + Header 72px + nội dung
  return (
    <div className="flex-1 flex bg-canvas w-full">
      <DesktopSidebar
        currentScreen={screen}
        onNavigate={state.onNavigate}
        savedTotalCount={savedTotalCount}
        resumeEpisode={focusEpisode}
        onResumeEpisode={() => state.onSelectEpisode(focusEpisode, true)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          searchQuery={state.searchQuery}
          onSearchChange={handleSearchChange}
          isLoggedIn={state.isLoggedIn}
          userName={state.userName}
          onOpenAuth={() => state.onNavigate("Auth")}
          onNavigateHome={() => state.onNavigate("Home")}
          showAnnotation={state.showAnnotation}
          theme={state.theme}
          onToggleTheme={state.onToggleTheme}
        />
        <main className="flex-1">{renderMainBody()}</main>
      </div>
    </div>
  );
};
