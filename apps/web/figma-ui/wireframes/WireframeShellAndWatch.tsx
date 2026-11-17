import React, { useState } from "react";
import {
  Search,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Bookmark,
  ArrowLeft,
  X,
  AlertTriangle,
  ArrowDownCircle,
  User,
  Home,
  Library,
  BookOpen,
} from "lucide-react";
import {
  WFScreenKey,
  WFDevice,
  WFSubState,
  WF_SERIES,
  WF_EPISODES,
  WF_TRANSCRIPT_LINES,
  WF_DICTIONARY,
  WFDictItem,
  WFSubtitleLine,
  WFEpisodeItem,
} from "./wfData";

export interface WFInteractiveContext {
  screen: WFScreenKey;
  device: WFDevice;
  subState: WFSubState;
  isLoggedIn: boolean;
  userName: string;
  activeSeriesId: string;
  activeEpisodeId: string;
  activeLineId: string;
  activeDictKey: string | null;
  savedWordKeys: string[];
  savedSentenceIds: string[];
  searchQuery: string;
  levelFilter: string;
  genreFilter: string;
  channelFilter: string;
  sortBy: string;
  returnToWatchAfterAuth: boolean;
  onNavigate: (target: WFScreenKey) => void;
  onSelectSeries: (seriesId: string) => void;
  onSelectEpisode: (episodeId: string, seekLineId?: string) => void;
  onSeekLine: (lineId: string) => void;
  onOpenDict: (dictKey: string | null) => void;
  onToggleSaveWord: (dictKey: string) => void;
  onToggleSaveSentence: (lineId: string) => void;
  onSetSearchQuery: (q: string) => void;
  onSetLevelFilter: (lvl: string) => void;
  onSetGenreFilter: (g: string) => void;
  onSetChannelFilter: (c: string) => void;
  onSetSortBy: (s: string) => void;
  onResetFilters: () => void;
  onLoginComplete: (email?: string) => void;
  onLogout: () => void;
  onTriggerUndoToast: (label: string, restoreFn: () => void) => void;
}

/* ============================================================================
 * WIREFRAME SHELL CHUNG (DESKTOP 1440px & MOBILE 390px)
 * Chỉ dùng trắng (#FFFFFF), đen (#111111) và các mức xám (#F5F5F5, #E5E5E5, #D4D4D4, #525252)
 * ========================================================================== */
export const WireframeShell: React.FC<{
  ctx: WFInteractiveContext;
  children: React.ReactNode;
}> = ({ ctx, children }) => {
  const { screen, device, isLoggedIn, userName } = ctx;

  // Màn hình Đăng nhập (Auth): không có sidebar / bottom navigation, chỉ có header tối giản
  if (screen === "Auth") {
    return (
      <div className="w-full min-h-full bg-white text-neutral-900 flex flex-col font-sans">
        <header className="h-14 px-4 md:px-6 border-b border-neutral-300 bg-neutral-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => ctx.onNavigate("Home")}
            className="text-base font-bold tracking-tight text-neutral-900 border border-neutral-900 px-2.5 py-1 bg-white cursor-pointer"
          >
            Kotoba
          </button>
          <button
            type="button"
            onClick={() => ctx.onNavigate(ctx.returnToWatchAfterAuth ? "Watch" : "Home")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-900 underline underline-offset-4 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{ctx.returnToWatchAfterAuth ? "Quay lại tập đang học" : "Về trang chủ"}</span>
          </button>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    );
  }

  // MOBILE SHELL (390px)
  if (device === "Mobile") {
    // Trang Xem tập trên Mobile dùng chế độ học riêng, có nút quay lại và KHÔNG để bottom navigation chiếm diện tích video
    if (screen === "Watch") {
      const ep = WF_EPISODES.find((e) => e.id === ctx.activeEpisodeId) || WF_EPISODES[0];
      return (
        <div className="w-full min-h-full bg-white text-neutral-900 flex flex-col font-sans">
          <header className="h-12 px-3 border-b border-neutral-300 bg-neutral-100 flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={() => ctx.onNavigate("Library")}
              className="h-8 px-2 border border-neutral-400 bg-white text-xs font-semibold text-neutral-900 inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>
            <div className="text-xs font-bold text-neutral-900 truncate">
              Tập {ep.order}: {ep.title} ({ep.duration})
            </div>
            <button
              type="button"
              onClick={() => ctx.onNavigate("Notebook")}
              className="h-8 px-2 border border-neutral-400 bg-white text-xs font-medium text-neutral-800 cursor-pointer"
            >
              Sổ tay ({ctx.savedWordKeys.length + ctx.savedSentenceIds.length})
            </button>
          </header>
          <main className="flex-1 flex flex-col">{children}</main>
        </div>
      );
    }

    return (
      <div className="w-full min-h-full bg-white text-neutral-900 flex flex-col justify-between font-sans">
        {/* Header Mobile gọn */}
        <header className="h-14 px-4 border-b border-neutral-300 bg-neutral-50 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => ctx.onNavigate("Home")}
            className="text-base font-bold tracking-tight text-neutral-900 border border-neutral-900 px-2 py-0.5 bg-white cursor-pointer"
          >
            Kotoba
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => ctx.onNavigate("Library")}
              aria-label="Tìm kiếm nội dung"
              className="h-9 w-9 border border-neutral-400 bg-white flex items-center justify-center text-neutral-800 cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => ctx.onNavigate("Auth")}
                className="h-9 px-2.5 border border-neutral-400 bg-white text-xs font-semibold text-neutral-900 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span className="w-5 h-5 border border-neutral-700 bg-neutral-200 text-[10px] font-bold flex items-center justify-center">
                  HV
                </span>
                <span className="max-w-[64px] truncate">{userName}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => ctx.onNavigate("Auth")}
                className="h-9 px-3 border border-neutral-900 bg-neutral-900 text-white text-xs font-semibold cursor-pointer"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>

        {/* Bottom Navigation 3 mục: Trang chủ, Kho nội dung, Sổ tay */}
        <nav
          aria-label="Điều hướng chính trên di động"
          className="h-16 px-2 border-t-2 border-neutral-300 bg-neutral-100 grid grid-cols-3 gap-2 items-center shrink-0"
        >
          {(
            [
              { key: "Home", label: "Trang chủ", icon: <Home className="w-4 h-4" /> },
              { key: "Library", label: "Kho nội dung", icon: <Library className="w-4 h-4" /> },
              {
                key: "Notebook",
                label: `Sổ tay (${ctx.savedWordKeys.length + ctx.savedSentenceIds.length})`,
                icon: <BookOpen className="w-4 h-4" />,
              },
            ] as const
          ).map((item) => {
            const active = screen === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => ctx.onNavigate(item.key)}
                className={`h-12 border flex flex-col items-center justify-center gap-0.5 text-xs cursor-pointer ${
                  active
                    ? "border-neutral-900 bg-neutral-900 text-white font-bold"
                    : "border-neutral-300 bg-white text-neutral-700 font-medium"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  // DESKTOP SHELL (1440px): Sidebar 240px + Header 72px + Main
  return (
    <div className="w-full min-h-full bg-white text-neutral-900 flex font-sans">
      {/* Sidebar ~240px */}
      <aside className="w-[240px] shrink-0 border-r border-neutral-300 bg-neutral-100 p-4 flex flex-col justify-between">
        <div className="flex flex-col gap-6">
          <div>
            <button
              type="button"
              onClick={() => ctx.onNavigate("Home")}
              className="w-full text-left p-2.5 border-2 border-neutral-900 bg-white flex items-center justify-between cursor-pointer"
            >
              <span className="text-lg font-bold tracking-tight text-neutral-900">Kotoba</span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 border border-neutral-400 bg-neutral-100 text-neutral-700">
                MVP
              </span>
            </button>
          </div>

          {/* Ba mục điều hướng chuẩn: Trang chủ, Kho nội dung, Sổ tay */}
          <nav className="flex flex-col gap-2" aria-label="Điều hướng chính Desktop">
            {(
              [
                { key: "Home", label: "Trang chủ", icon: <Home className="w-4 h-4" /> },
                { key: "Library", label: "Kho nội dung", icon: <Library className="w-4 h-4" /> },
                {
                  key: "Notebook",
                  label: "Sổ tay",
                  icon: <BookOpen className="w-4 h-4" />,
                  count: ctx.savedWordKeys.length + ctx.savedSentenceIds.length,
                },
              ] as const
            ).map((item) => {
              const isSelected =
                screen === item.key || (screen === "Watch" && item.key === "Library");
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => ctx.onNavigate(item.key)}
                  className={`h-11 px-3 border flex items-center justify-between text-sm cursor-pointer transition-colors ${
                    isSelected
                      ? "border-neutral-900 bg-neutral-900 text-white font-bold"
                      : "border-neutral-300 bg-white hover:bg-neutral-200 text-neutral-800 font-medium"
                  }`}
                >
                  <span className="inline-flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  {"count" in item && typeof item.count === "number" && (
                    <span
                      className={`px-1.5 py-0.5 text-xs font-mono border ${
                        isSelected
                          ? "border-white bg-neutral-800 text-white"
                          : "border-neutral-400 bg-neutral-100 text-neutral-800"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Khối trạng thái tập đang học dở ở đáy Sidebar */}
        <div className="p-3 border border-neutral-400 bg-white flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-neutral-600">
            <span className="font-semibold text-neutral-900">Xem tiếp gần đây</span>
            <span className="font-mono">00:16 / 08:24</span>
          </div>
          <div className="text-xs font-bold text-neutral-900">
            Tiếng Nhật ở quán cà phê — Tập 1: Gọi đồ uống
          </div>
          <div className="w-full h-2 bg-neutral-200 border border-neutral-400">
            <div className="h-full bg-neutral-800" style={{ width: "45%" }} />
          </div>
          <button
            type="button"
            onClick={() => ctx.onSelectEpisode("wf-ep-1", "wf-line-2")}
            className="h-8 w-full border border-neutral-900 bg-neutral-900 text-white text-xs font-semibold cursor-pointer"
          >
            Tiếp tục học (45%)
          </button>
        </div>
      </aside>

      {/* Vùng phải: Header 72px + Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[72px] px-6 border-b border-neutral-300 bg-neutral-50 flex items-center justify-between gap-6 shrink-0">
          {/* Ô tìm kiếm trên Header */}
          <div className="w-full max-w-md flex items-center h-10 border border-neutral-400 bg-white px-3 gap-2">
            <Search className="w-4 h-4 text-neutral-500 shrink-0" />
            <input
              type="text"
              value={ctx.searchQuery}
              onChange={(e) => ctx.onSetSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && screen !== "Library") {
                  ctx.onNavigate("Library");
                }
              }}
              placeholder="Tìm tên series, chủ đề, trình độ N5-N2..."
              aria-label="Tìm kiếm nội dung"
              className="w-full text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none bg-transparent"
            />
            {ctx.searchQuery && (
              <button
                type="button"
                onClick={() => ctx.onSetSearchQuery("")}
                className="text-xs text-neutral-600 hover:text-neutral-900"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Nút Đăng nhập hoặc Avatar học viên */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => ctx.onNavigate("Notebook")}
                  className="h-10 px-3 border border-neutral-400 bg-white hover:bg-neutral-100 text-sm font-medium text-neutral-900 flex items-center gap-2 cursor-pointer"
                >
                  <span className="w-6 h-6 border border-neutral-800 bg-neutral-200 text-xs font-bold flex items-center justify-center">
                    HV
                  </span>
                  <span>{userName}</span>
                </button>
                <button
                  type="button"
                  onClick={ctx.onLogout}
                  className="h-10 px-3 border border-neutral-300 bg-white hover:bg-neutral-100 text-xs text-neutral-700 cursor-pointer"
                >
                  Đổi sang Khách
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => ctx.onNavigate("Auth")}
                className="h-10 px-4 border border-neutral-900 bg-neutral-900 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    </div>
  );
};

/* ============================================================================
 * MÀN HÌNH 3 (TRỌNG TÂM) — TRANG XEM TẬP VÀ TRANSCRIPT (WF/Watch/Desktop & Mobile)
 * Desktop: Video trái ~62%, Transcript phải ~38%
 * Mobile: Video trên, Toolbar gọn bên dưới, sau đó Transcript (1 luồng cuộn, không cuộn lồng nhau)
 * ========================================================================== */
export const WFWatchScreen: React.FC<{ ctx: WFInteractiveContext }> = ({ ctx }) => {
  const isMobile = ctx.device === "Mobile";
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopSentence, setLoopSentence] = useState(true);
  const [speed, setSpeed] = useState<"0.75x" | "1.0x" | "1.25x">("1.0x");
  const [rightTab, setRightTab] = useState<"transcript" | "episodes">("transcript");
  const [showTranslation, setShowTranslation] = useState(true);
  const [showFurigana, setShowFurigana] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [userScrolledAway, setUserScrolledAway] = useState(false);

  const currentSeries = WF_SERIES.find((s) => s.id === ctx.activeSeriesId) || WF_SERIES[0];
  const currentEpisode = WF_EPISODES.find((e) => e.id === ctx.activeEpisodeId) || WF_EPISODES[0];
  const activeIndex = Math.max(
    0,
    WF_TRANSCRIPT_LINES.findIndex((l) => l.id === ctx.activeLineId),
  );
  const activeLine: WFSubtitleLine = WF_TRANSCRIPT_LINES[activeIndex] || WF_TRANSCRIPT_LINES[1];

  const isVideoUnavailable = ctx.subState === "video-unavailable";
  const isLoading = ctx.subState === "loading";

  const activeDictItem: WFDictItem | null = ctx.activeDictKey
    ? WF_DICTIONARY[ctx.activeDictKey] || null
    : ctx.subState === "dict-open"
      ? WF_DICTIONARY["aisukoohii"]
      : null;

  const handlePrevLine = () => {
    const prevIdx = Math.max(0, activeIndex - 1);
    ctx.onSeekLine(WF_TRANSCRIPT_LINES[prevIdx].id);
  };

  const handleNextLine = () => {
    const nextIdx = Math.min(WF_TRANSCRIPT_LINES.length - 1, activeIndex + 1);
    ctx.onSeekLine(WF_TRANSCRIPT_LINES[nextIdx].id);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex flex-col gap-4">
        <div className="text-xs font-mono uppercase text-neutral-600">
          [Trạng thái phụ: Đang tải trang xem tập và phụ đề...]
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="w-full aspect-video border-2 border-neutral-300 bg-neutral-200 flex items-center justify-center text-sm font-mono text-neutral-600">
              Đang tải khung trình phát video 16:9...
            </div>
            <div className="h-12 border border-neutral-300 bg-neutral-100" />
            <div className="h-16 border border-neutral-300 bg-neutral-100" />
          </div>
          <div className="lg:col-span-5 flex flex-col gap-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-20 border border-neutral-300 bg-neutral-100 p-3" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isMobile ? "p-3 gap-4" : "p-6 gap-6"} flex flex-col relative`}>
      {/* Thanh điều hướng phụ trên Desktop */}
      {!isMobile && (
        <div className="flex items-center justify-between border-b border-neutral-300 pb-3 text-xs text-neutral-700">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => ctx.onNavigate("Library")}
              className="inline-flex items-center gap-1 font-semibold text-neutral-900 underline underline-offset-4 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kho nội dung</span>
            </button>
            <span>/</span>
            <span>{currentSeries.title}</span>
            <span>/</span>
            <span className="font-bold text-neutral-900">
              Tập {currentEpisode.order}: {currentEpisode.title}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="px-2 py-0.5 border border-neutral-500 bg-neutral-100 text-neutral-900 font-bold">
              Trình độ {currentSeries.level}
            </span>
            <span className="px-2 py-0.5 border border-neutral-400 bg-white">
              Thời lượng: {currentEpisode.duration}
            </span>
          </div>
        </div>
      )}

      {/* BỐ CỤC CHÍNH: Desktop 62% Trái / 38% Phải | Mobile 1 cột dọc không cuộn lồng nhau */}
      <div className={isMobile ? "flex flex-col gap-4" : "grid grid-cols-12 gap-6 items-start"}>
        {/* CỘT TRÁI (~62% -> 7/12 cột rộng trên Desktop): Video 16:9 + Toolbar học + Tiêu đề tập */}
        <div className={isMobile ? "flex flex-col gap-3" : "col-span-7 flex flex-col gap-4"}>
          {/* Khung Video Placeholder tỷ lệ 16:9 có nút phát */}
          <div className="w-full aspect-video border-2 border-neutral-900 bg-neutral-200 flex flex-col justify-between p-3 md:p-4 relative">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-800">
              <span className="px-2 py-0.5 border border-neutral-600 bg-white font-semibold">
                16:9 VIDEO PLACEHOLDER • YOUTUBE PLAYER
              </span>
              <span className="px-2 py-0.5 border border-neutral-600 bg-white">
                {activeLine.timestamp} / 08:24
              </span>
            </div>

            {isVideoUnavailable ? (
              <div className="my-auto mx-auto max-w-sm p-4 border-2 border-neutral-900 bg-white text-center flex flex-col items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-neutral-900" />
                <div className="text-sm font-bold text-neutral-900">
                  Video hiện không khả dụng hoặc đã bị giới hạn nhúng
                </div>
                <p className="text-xs text-neutral-700">
                  Bạn vẫn có thể đọc toàn bộ hội thoại Nhật – Việt và lưu từ vựng ở bảng Transcript
                  bên cạnh.
                </p>
              </div>
            ) : (
              <div className="my-auto flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  aria-label={isPlaying ? "Tạm dừng video" : "Phát video"}
                  className="w-14 h-14 border-2 border-neutral-900 bg-white hover:bg-neutral-100 flex items-center justify-center cursor-pointer shadow-sm"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-neutral-900" />
                  ) : (
                    <Play className="w-6 h-6 text-neutral-900 ml-0.5" />
                  )}
                </button>
                <span className="text-xs font-mono text-neutral-800 bg-white/90 px-2 py-0.5 border border-neutral-500">
                  {isPlaying ? "Đang phát câu thoại..." : "Nhấn nút Phát hoặc chọn câu bên dưới"}
                </span>
              </div>
            )}

            {/* Phụ đề câu đang phát hiển thị ngay dưới đáy khung video */}
            <div className="p-2.5 md:p-3 border-2 border-neutral-900 bg-white text-center flex flex-col gap-1">
              <div className="text-xs font-mono text-neutral-600">
                Đang phát [{activeLine.timestamp}] • Nhấn vào từ có gạch chân để tra nghĩa
              </div>
              <div className="text-base md:text-lg font-bold text-neutral-900 flex flex-wrap items-baseline justify-center gap-x-1">
                {activeLine.tokens.map((tok, i) => {
                  const content =
                    showFurigana && tok.furigana ? (
                      <ruby>
                        {tok.surface}
                        <rt className="text-[10px] text-neutral-600 font-normal">{tok.furigana}</rt>
                      </ruby>
                    ) : (
                      <span>{tok.surface}</span>
                    );

                  if (tok.dictKey) {
                    const isSelected = activeDictItem?.key === tok.dictKey;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => ctx.onOpenDict(tok.dictKey!)}
                        className={`px-1 border-b-2 cursor-pointer ${
                          isSelected
                            ? "bg-neutral-900 text-white border-neutral-900"
                            : "border-neutral-800 hover:bg-neutral-200"
                        }`}
                      >
                        {content}
                      </button>
                    );
                  }
                  return <React.Fragment key={i}>{content}</React.Fragment>;
                })}
              </div>
              {showTranslation && (
                <div className="text-xs md:text-sm text-neutral-700">{activeLine.viText}</div>
              )}
            </div>
          </div>

          {/* TOOLBAR HỌC: Câu trước, Lặp câu, Câu tiếp, Tốc độ */}
          <div className="p-2.5 md:p-3 border border-neutral-400 bg-neutral-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
              <button
                type="button"
                onClick={handlePrevLine}
                className="h-9 px-2.5 md:px-3 border border-neutral-500 bg-white hover:bg-neutral-200 text-xs font-semibold text-neutral-900 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <SkipBack className="w-3.5 h-3.5" />
                <span>Câu trước</span>
              </button>

              <button
                type="button"
                onClick={() => setLoopSentence((v) => !v)}
                className={`h-9 px-2.5 md:px-3 border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                  loopSentence
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-500 bg-white text-neutral-900"
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Lặp câu: {loopSentence ? "Bật" : "Tắt"}</span>
              </button>

              <button
                type="button"
                onClick={handleNextLine}
                className="h-9 px-2.5 md:px-3 border border-neutral-500 bg-white hover:bg-neutral-200 text-xs font-semibold text-neutral-900 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Câu tiếp</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-neutral-700">Tốc độ:</span>
              {(["0.75x", "1.0x", "1.25x"] as const).map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSpeed(sp)}
                  className={`h-8 px-2 border text-xs font-mono cursor-pointer ${
                    speed === sp
                      ? "border-neutral-900 bg-neutral-900 text-white font-bold"
                      : "border-neutral-400 bg-white text-neutral-800"
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>

          {/* Khối Tiêu đề tập, tên series và trình độ */}
          <div className="p-3 md:p-4 border border-neutral-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 border border-neutral-800 bg-neutral-100 text-xs font-bold text-neutral-900">
                  {currentSeries.level}
                </span>
                <span className="text-xs font-medium text-neutral-600">
                  Series: {currentSeries.title}
                </span>
                <span className="text-xs font-mono text-neutral-500">
                  • Thời lượng {currentEpisode.duration}
                </span>
              </div>
              <h1 className="text-base md:text-lg font-bold text-neutral-900">
                Tập {currentEpisode.order}: {currentEpisode.title}
              </h1>
            </div>

            {/* Popover tra từ hiển thị ngay trên Desktop khi người học bấm vào một từ */}
            {!isMobile && activeDictItem && (
              <div className="text-xs font-mono px-2.5 py-1 border border-neutral-900 bg-neutral-100">
                Đang mở tra từ: <strong>{activeDictItem.word}</strong>
              </div>
            )}
          </div>

          {/* DESKTOP POPOVER TRA TỪ (Đặt ngay dưới vùng video/thông tin để dễ đối chiếu) */}
          {!isMobile && activeDictItem && (
            <div
              role="dialog"
              aria-label={`Tra từ: ${activeDictItem.word}`}
              className="p-4 border-2 border-neutral-900 bg-neutral-50 flex flex-col gap-3 shadow-md"
            >
              <div className="flex items-start justify-between gap-3 border-b border-neutral-300 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-1.5 py-0.5 border border-neutral-500 bg-white">
                      POPOVER TRA TỪ (DESKTOP)
                    </span>
                    <span className="text-xs text-neutral-600">{activeDictItem.pos}</span>
                  </div>
                  <div className="text-lg font-bold text-neutral-900 mt-1">
                    {activeDictItem.word}{" "}
                    <span className="text-sm font-normal text-neutral-700">
                      [{activeDictItem.reading}]
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => ctx.onToggleSaveWord(activeDictItem.key)}
                    className={`h-9 px-3 border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                      ctx.savedWordKeys.includes(activeDictItem.key)
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-900 bg-white text-neutral-900 hover:bg-neutral-200"
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>
                      {ctx.savedWordKeys.includes(activeDictItem.key) ? "Đã lưu từ" : "Lưu từ"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => ctx.onOpenDict(null)}
                    aria-label="Đóng tra từ"
                    className="h-9 w-9 border border-neutral-400 bg-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 border border-neutral-300 bg-white">
                  <div className="font-semibold text-neutral-600">Nghĩa tiếng Việt:</div>
                  <div className="text-sm font-bold text-neutral-900 mt-0.5">
                    {activeDictItem.meaningVi}
                  </div>
                </div>
                <div className="p-2.5 border border-neutral-300 bg-white">
                  <div className="font-semibold text-neutral-600">
                    Câu chứa từ ({activeDictItem.timestamp}):
                  </div>
                  <div className="font-bold text-neutral-900 mt-0.5">
                    {activeDictItem.sentenceJp}
                  </div>
                  <div className="text-neutral-700">{activeDictItem.sentenceVi}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CỘT PHẢI (~38% -> 5/12 cột trên Desktop): Transcript (Tab Hội thoại / Danh sách tập + Toggle + Câu thoại) */}
        <div className={isMobile ? "flex flex-col gap-3" : "col-span-5 flex flex-col gap-3"}>
          <div className="border-2 border-neutral-400 bg-white flex flex-col">
            {/* 2 Tab: Hội thoại | Danh sách tập */}
            <div className="grid grid-cols-2 border-b border-neutral-300 bg-neutral-100">
              <button
                type="button"
                onClick={() => setRightTab("transcript")}
                className={`h-10 text-xs font-bold border-r border-neutral-300 cursor-pointer ${
                  rightTab === "transcript"
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                Hội thoại ({WF_TRANSCRIPT_LINES.length} câu)
              </button>
              <button
                type="button"
                onClick={() => setRightTab("episodes")}
                className={`h-10 text-xs font-bold cursor-pointer ${
                  rightTab === "episodes"
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                Danh sách tập (8 tập)
              </button>
            </div>

            {rightTab === "transcript" ? (
              <>
                {/* Thanh Toggle: Bản dịch, Furigana, Tự cuộn */}
                <div className="p-2.5 border-b border-neutral-300 bg-neutral-50 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowTranslation((v) => !v)}
                      className={`h-7 px-2 border text-[11px] font-semibold cursor-pointer ${
                        showTranslation
                          ? "border-neutral-900 bg-neutral-800 text-white"
                          : "border-neutral-400 bg-white text-neutral-700"
                      }`}
                    >
                      Bản dịch: {showTranslation ? "Bật" : "Tắt"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFurigana((v) => !v)}
                      className={`h-7 px-2 border text-[11px] font-semibold cursor-pointer ${
                        showFurigana
                          ? "border-neutral-900 bg-neutral-800 text-white"
                          : "border-neutral-400 bg-white text-neutral-700"
                      }`}
                    >
                      Furigana: {showFurigana ? "Bật" : "Tắt"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAutoScroll((v) => !v);
                        setUserScrolledAway((prev) => !prev);
                      }}
                      className={`h-7 px-2 border text-[11px] font-semibold cursor-pointer ${
                        autoScroll && !userScrolledAway
                          ? "border-neutral-900 bg-neutral-800 text-white"
                          : "border-neutral-400 bg-white text-neutral-700"
                      }`}
                    >
                      Tự cuộn: {autoScroll && !userScrolledAway ? "Bật" : "Tạm dừng"}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setUserScrolledAway((v) => !v)}
                    className="text-[11px] text-neutral-600 underline cursor-pointer"
                  >
                    {userScrolledAway ? "Ẩn nút về câu" : "Mô phỏng tự cuộn lệch"}
                  </button>
                </div>

                {/* Khi người dùng tự cuộn, hiện nút "Về câu đang phát" */}
                {userScrolledAway && (
                  <div className="px-3 py-2 bg-neutral-200 border-b border-neutral-400 flex items-center justify-between">
                    <span className="text-xs text-neutral-800">
                      Bạn đang xem vị trí khác trong hội thoại
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setUserScrolledAway(false);
                        setAutoScroll(true);
                      }}
                      className="h-7 px-2.5 border border-neutral-900 bg-neutral-900 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowDownCircle className="w-3.5 h-3.5" />
                      <span>Về câu đang phát ({activeLine.timestamp})</span>
                    </button>
                  </div>
                )}

                {/* Danh sách câu thoại (Không dùng vùng cuộn lồng nhau trên Mobile) */}
                <div className="divide-y divide-neutral-300">
                  {WF_TRANSCRIPT_LINES.map((line) => {
                    const isPlayingLine = line.id === activeLine.id;
                    const isSaved =
                      ctx.savedSentenceIds.includes(line.id) ||
                      (ctx.subState === "sentence-saved" && line.id === "wf-line-2");

                    return (
                      <div
                        key={line.id}
                        onClick={() => ctx.onSeekLine(line.id)}
                        className={`p-3.5 transition-colors cursor-pointer flex flex-col gap-1.5 ${
                          isPlayingLine
                            ? "bg-neutral-200 border-l-4 border-l-neutral-900"
                            : "bg-white hover:bg-neutral-100"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                ctx.onSeekLine(line.id);
                              }}
                              className={`px-2 py-0.5 text-xs font-mono border cursor-pointer ${
                                isPlayingLine
                                  ? "border-neutral-900 bg-neutral-900 text-white font-bold"
                                  : "border-neutral-400 bg-neutral-100 text-neutral-800"
                              }`}
                            >
                              {line.timestamp}
                            </button>
                            <span className="text-xs font-medium text-neutral-600">
                              {line.speaker}
                            </span>
                            {isPlayingLine && (
                              <span className="text-[11px] font-bold uppercase px-1.5 py-0.5 border border-neutral-900 bg-white text-neutral-900">
                                Đang phát
                              </span>
                            )}
                          </div>

                          {/* Nhấn nút lưu chỉ lưu câu, không tua video */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              ctx.onToggleSaveSentence(line.id);
                            }}
                            className={`h-8 px-2.5 border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                              isSaved
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-400 bg-white text-neutral-800 hover:bg-neutral-200"
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>{isSaved ? "Đã lưu câu" : "Lưu câu"}</span>
                          </button>
                        </div>

                        {/* Câu tiếng Nhật (bấm vào từ mở tra từ, không tua video) */}
                        <div className="text-base font-bold text-neutral-900 flex flex-wrap items-baseline gap-x-1 mt-0.5">
                          {line.tokens.map((tok, idx) => {
                            const rubyNode =
                              showFurigana && tok.furigana ? (
                                <ruby>
                                  {tok.surface}
                                  <rt className="text-[10px] text-neutral-600 font-normal">
                                    {tok.furigana}
                                  </rt>
                                </ruby>
                              ) : (
                                <span>{tok.surface}</span>
                              );

                            if (tok.dictKey) {
                              const selectedWord = activeDictItem?.key === tok.dictKey;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    ctx.onOpenDict(tok.dictKey!);
                                  }}
                                  className={`px-0.5 border-b border-dashed cursor-pointer ${
                                    selectedWord
                                      ? "bg-neutral-900 text-white border-neutral-900"
                                      : "border-neutral-700 hover:bg-neutral-300"
                                  }`}
                                >
                                  {rubyNode}
                                </button>
                              );
                            }
                            return <React.Fragment key={idx}>{rubyNode}</React.Fragment>;
                          })}
                        </div>

                        {showTranslation && (
                          <div className="text-sm text-neutral-700">{line.viText}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* Tab Danh sách tập ngay trong trang Watch */
              <div className="divide-y divide-neutral-300">
                {WF_EPISODES.filter((e) => e.seriesId === currentSeries.id).map((ep) => {
                  const isCurrentEp = ep.id === currentEpisode.id;
                  return (
                    <div
                      key={ep.id}
                      className={`p-3 flex items-center justify-between gap-3 ${
                        isCurrentEp ? "bg-neutral-200 font-bold" : "bg-white"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-mono text-neutral-600">
                          Tập {ep.order} • {ep.duration}
                        </div>
                        <div className="text-sm font-bold text-neutral-900 truncate">
                          {ep.title}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          ctx.onSelectEpisode(ep.id);
                          setRightTab("transcript");
                        }}
                        className={`h-8 px-3 border text-xs font-semibold shrink-0 cursor-pointer ${
                          isCurrentEp
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : "border-neutral-500 bg-white text-neutral-900"
                        }`}
                      >
                        {isCurrentEp ? "Đang học" : "Học tập này"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET TRA TỪ */}
      {isMobile && activeDictItem && (
        <div
          role="dialog"
          aria-label={`Bottom sheet tra từ: ${activeDictItem.word}`}
          className="mt-2 border-2 border-neutral-900 bg-neutral-50 p-3.5 flex flex-col gap-3 shadow-lg"
        >
          <div className="w-10 h-1 bg-neutral-400 mx-auto" />
          <div className="flex items-start justify-between gap-2 border-b border-neutral-300 pb-2">
            <div>
              <span className="text-[11px] font-mono px-1.5 py-0.5 border border-neutral-500 bg-white">
                BOTTOM SHEET TRA TỪ (MOBILE)
              </span>
              <div className="text-base font-bold text-neutral-900 mt-1">
                {activeDictItem.word} ({activeDictItem.reading})
              </div>
              <div className="text-xs text-neutral-600">{activeDictItem.pos}</div>
            </div>
            <button
              type="button"
              onClick={() => ctx.onOpenDict(null)}
              className="h-8 w-8 border border-neutral-400 bg-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm font-bold text-neutral-900">
            Nghĩa: {activeDictItem.meaningVi}
          </div>
          <div className="p-2.5 border border-neutral-300 bg-white text-xs">
            <div className="text-neutral-600">Câu chứa từ ({activeDictItem.timestamp}):</div>
            <div className="font-bold text-neutral-900 mt-0.5">{activeDictItem.sentenceJp}</div>
            <div className="text-neutral-700">{activeDictItem.sentenceVi}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => ctx.onToggleSaveWord(activeDictItem.key)}
              className="h-10 border border-neutral-900 bg-neutral-900 text-white text-xs font-bold cursor-pointer"
            >
              {ctx.savedWordKeys.includes(activeDictItem.key) ? "Đã lưu vào Sổ tay" : "Lưu từ này"}
            </button>
            <button
              type="button"
              onClick={() => ctx.onOpenDict(null)}
              className="h-10 border border-neutral-400 bg-white text-neutral-800 text-xs font-semibold cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
