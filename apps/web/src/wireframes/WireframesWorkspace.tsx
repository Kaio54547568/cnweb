import React, { useState } from "react";
import {
  LayoutGrid,
  Maximize2,
  Monitor,
  Smartphone,
  Eye,
  EyeOff,
  ArrowLeft,
  RotateCcw,
  CheckSquare,
} from "lucide-react";
import { WFScreenKey, WFDevice, WFSubState, WF_ANNOTATIONS } from "./wfData";
import { WireframeShell, WFWatchScreen, WFInteractiveContext } from "./WireframeShellAndWatch";
import {
  WFHomeScreen,
  WFLibraryScreen,
  WFAuthScreen,
  WFNotebookScreen,
} from "./WireframeOtherScreens";

const WF_SCREENS_ORDER: { key: WFScreenKey; label: string }[] = [
  { key: "Home", label: "1. Trang chủ" },
  { key: "Library", label: "2. Kho nội dung" },
  { key: "Watch", label: "3. Xem tập & Transcript" },
  { key: "Auth", label: "4. Đăng nhập" },
  { key: "Notebook", label: "5. Sổ tay" },
];

const SUB_STATES_LIST: {
  id: WFSubState;
  label: string;
  targetScreen?: WFScreenKey;
  targetDevice?: WFDevice;
}[] = [
  { id: "default", label: "Mặc định (Đủ dữ liệu)" },
  { id: "guest", label: "Chưa đăng nhập (Khách)", targetScreen: "Home" },
  { id: "loading", label: "Đang tải (Loading)" },
  { id: "empty-search", label: "Không có kết quả tìm kiếm", targetScreen: "Library" },
  { id: "empty-notebook", label: "Sổ tay trống", targetScreen: "Notebook" },
  { id: "video-unavailable", label: "Video không khả dụng", targetScreen: "Watch" },
  { id: "dict-open", label: "Popup tra từ đang mở", targetScreen: "Watch" },
  { id: "sentence-saved", label: "Câu đã lưu", targetScreen: "Watch" },
  { id: "auth-error", label: "Đăng nhập sai", targetScreen: "Auth" },
  {
    id: "mobile-filter-open",
    label: "Bộ lọc mobile đang mở",
    targetScreen: "Library",
    targetDevice: "Mobile",
  },
];

/* ============================================================================
 * RENDER NỘI DUNG 1 MÀN HÌNH WIREFRAME TRONG SHELL
 * ========================================================================== */
const SingleWireframeScreenContent: React.FC<{ ctx: WFInteractiveContext }> = ({ ctx }) => {
  return (
    <WireframeShell ctx={ctx}>
      {ctx.screen === "Home" && <WFHomeScreen ctx={ctx} />}
      {ctx.screen === "Library" && <WFLibraryScreen ctx={ctx} />}
      {ctx.screen === "Watch" && <WFWatchScreen ctx={ctx} />}
      {ctx.screen === "Auth" && <WFAuthScreen ctx={ctx} />}
      {ctx.screen === "Notebook" && <WFNotebookScreen ctx={ctx} />}
    </WireframeShell>
  );
};

/* ============================================================================
 * ANNOTATION BOX (NẰM BÊN NGOÀI MÀN HÌNH SẢN PHẨM, CÓ THỂ BẬT/TẮT)
 * ========================================================================== */
const WireframeAnnotationPanel: React.FC<{ screen: WFScreenKey }> = ({ screen }) => {
  const spec = WF_ANNOTATIONS[screen];

  return (
    <aside
      aria-label={`Ghi chú thiết kế cho màn hình ${spec.title}`}
      className="border-2 border-neutral-800 bg-neutral-100 text-neutral-900 p-4 flex flex-col gap-3 text-xs font-sans"
    >
      <div className="flex items-center justify-between border-b border-neutral-400 pb-2">
        <span className="font-mono font-bold uppercase text-neutral-900">
          ANNOTATION • {spec.title}
        </span>
        <span className="font-mono text-[11px] px-2 py-0.5 border border-neutral-600 bg-white">
          Tài liệu đánh giá bố cục &amp; hành trình
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3 border border-neutral-400 bg-white flex flex-col gap-1">
          <div className="font-mono font-bold uppercase text-[11px] text-neutral-600">
            1. Mục tiêu màn hình
          </div>
          <p className="text-neutral-900 leading-relaxed">{spec.goal}</p>
        </div>

        <div className="p-3 border border-neutral-400 bg-white flex flex-col gap-1">
          <div className="font-mono font-bold uppercase text-[11px] text-neutral-600">
            2. Hành động chính
          </div>
          <p className="font-semibold text-neutral-900 leading-relaxed">{spec.primaryAction}</p>
        </div>

        <div className="p-3 border border-neutral-400 bg-white flex flex-col gap-1">
          <div className="font-mono font-bold uppercase text-[11px] text-neutral-600">
            3. Thứ tự đọc
          </div>
          <ul className="flex flex-col gap-1 text-neutral-800">
            {spec.readingOrder.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        </div>

        <div className="p-3 border border-neutral-400 bg-white flex flex-col gap-1">
          <div className="font-mono font-bold uppercase text-[11px] text-neutral-600">
            4. Thay đổi Desktop vs Mobile
          </div>
          <p className="text-neutral-800 leading-relaxed">{spec.desktopVsMobile}</p>
        </div>

        <div className="p-3 border border-neutral-400 bg-white flex flex-col gap-1">
          <div className="font-mono font-bold uppercase text-[11px] text-neutral-600">
            5. Vấn đề cần nhóm quyết định
          </div>
          <ul className="list-disc list-inside flex flex-col gap-1 text-neutral-900 font-medium">
            {spec.openQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};

/* ============================================================================
 * KHU VỰC TRÌNH BÀY WIREFRAMES (/wireframes)
 * ========================================================================== */
export const WireframesWorkspace: React.FC<{
  onBackToColorUI: () => void;
}> = ({ onBackToColorUI }) => {
  // Chế độ hiển thị: 'single' (Xem từng màn hình) hoặc 'overview' (Tổng quan 10 bản chính)
  const [viewMode, setViewMode] = useState<"single" | "overview">("single");
  // Mặc định mở màn hình 3 (Watch - Trang xem tập) để duyệt cấu trúc trọng tâm trước tiên
  const [activeScreen, setActiveScreen] = useState<WFScreenKey>("Watch");
  const [activeDevice, setActiveDevice] = useState<WFDevice>("Desktop");
  const [subState, setSubState] = useState<WFSubState>("default");
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [cleanCopyMode, setCleanCopyMode] = useState<boolean>(false);

  // State tương tác người học dùng chung cho toàn bộ 10 bản wireframe
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [userName, setUserName] = useState<string>("Minh Anh");
  const [activeSeriesId, setActiveSeriesId] = useState<string>("wf-series-cafe");
  const [activeEpisodeId, setActiveEpisodeId] = useState<string>("wf-ep-1");
  const [activeLineId, setActiveLineId] = useState<string>("wf-line-2"); // 00:16 アイスコーヒーを一つお願いします。
  const [activeDictKey, setActiveDictKey] = useState<string | null>("aisukoohii");
  const [savedWordKeys, setSavedWordKeys] = useState<string[]>(["aisukoohii", "hitotsu"]);
  const [savedSentenceIds, setSavedSentenceIds] = useState<string[]>(["wf-line-1", "wf-line-2"]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [genreFilter, setGenreFilter] = useState<string>("ALL");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [returnToWatchAfterAuth, setReturnToWatchAfterAuth] = useState<boolean>(false);
  const [pendingActionAfterAuth, setPendingActionAfterAuth] = useState<(() => void) | null>(null);

  // Toast thông báo & Hoàn tác (Undo)
  const [undoToast, setUndoToast] = useState<{
    label: string;
    restoreFn?: () => void;
  } | null>(null);

  const showToast = (label: string, restoreFn?: () => void) => {
    setUndoToast({ label, restoreFn });
  };

  const buildContext = (
    overrideScreen?: WFScreenKey,
    overrideDevice?: WFDevice,
  ): WFInteractiveContext => {
    const scr = overrideScreen || activeScreen;
    const dev = overrideDevice || activeDevice;

    return {
      screen: scr,
      device: dev,
      subState,
      isLoggedIn: subState === "guest" ? false : isLoggedIn,
      userName,
      activeSeriesId,
      activeEpisodeId,
      activeLineId,
      activeDictKey,
      savedWordKeys,
      savedSentenceIds,
      searchQuery,
      levelFilter,
      genreFilter,
      channelFilter,
      sortBy,
      returnToWatchAfterAuth,
      onNavigate: (target) => {
        setActiveScreen(target);
        setViewMode("single");
      },
      onSelectSeries: (sId) => {
        setActiveSeriesId(sId);
      },
      onSelectEpisode: (epId, seekLineId) => {
        setActiveEpisodeId(epId);
        if (seekLineId) {
          setActiveLineId(seekLineId);
        }
        setActiveScreen("Watch");
        setViewMode("single");
      },
      onSeekLine: (lineId) => {
        setActiveLineId(lineId);
      },
      onOpenDict: (dictKey) => {
        setActiveDictKey(dictKey);
      },
      onToggleSaveWord: (dictKey) => {
        const effectiveLoggedIn = subState === "guest" ? false : isLoggedIn;
        // Luồng tương tác 4: Khách bấm lưu -> chuyển sang Đăng nhập -> trở về tập trước đó
        if (!effectiveLoggedIn) {
          setReturnToWatchAfterAuth(true);
          setPendingActionAfterAuth(() => () => {
            setSavedWordKeys((prev) => (prev.includes(dictKey) ? prev : [...prev, dictKey]));
          });
          setActiveScreen("Auth");
          showToast("Vui lòng đăng nhập để lưu từ vựng vào Sổ tay.");
          return;
        }

        setSavedWordKeys((prev) => {
          const exists = prev.includes(dictKey);
          if (!exists) {
            showToast("Đã lưu từ vựng vào Sổ tay.");
          }
          return exists ? prev.filter((k) => k !== dictKey) : [...prev, dictKey];
        });
      },
      onToggleSaveSentence: (lineId) => {
        const effectiveLoggedIn = subState === "guest" ? false : isLoggedIn;
        // Luồng tương tác 4: Khách bấm lưu câu -> Đăng nhập -> Trở về tập trước đó
        if (!effectiveLoggedIn) {
          setReturnToWatchAfterAuth(true);
          setPendingActionAfterAuth(() => () => {
            setSavedSentenceIds((prev) => (prev.includes(lineId) ? prev : [...prev, lineId]));
          });
          setActiveScreen("Auth");
          showToast("Vui lòng đăng nhập để lưu câu thoại vào Sổ tay.");
          return;
        }

        setSavedSentenceIds((prev) => {
          const exists = prev.includes(lineId);
          if (!exists) {
            showToast("Đã lưu câu thoại vào Sổ tay.");
          }
          return exists ? prev.filter((id) => id !== lineId) : [...prev, lineId];
        });
      },
      onSetSearchQuery: setSearchQuery,
      onSetLevelFilter: setLevelFilter,
      onSetGenreFilter: setGenreFilter,
      onSetChannelFilter: setChannelFilter,
      onSetSortBy: setSortBy,
      onResetFilters: () => {
        setSearchQuery("");
        setLevelFilter("ALL");
        setGenreFilter("ALL");
        setChannelFilter("ALL");
        if (subState === "empty-search") {
          setSubState("default");
        }
      },
      onLoginComplete: (email) => {
        setIsLoggedIn(true);
        if (subState === "guest" || subState === "auth-error") {
          setSubState("default");
        }
        if (email) {
          setUserName(email.split("@")[0] || "Minh Anh");
        }
        if (pendingActionAfterAuth) {
          pendingActionAfterAuth();
          setPendingActionAfterAuth(null);
        }
        if (returnToWatchAfterAuth) {
          setReturnToWatchAfterAuth(false);
          setActiveScreen("Watch");
          showToast("Đăng nhập thành công! Đã lưu mục và quay lại tập đang học.");
        } else {
          setActiveScreen("Home");
          showToast("Đăng nhập thành công!");
        }
      },
      onLogout: () => {
        setIsLoggedIn(false);
        showToast("Đang ở chế độ Khách (chưa đăng nhập). Hãy thử bấm Lưu từ/câu ở trang Xem tập.");
      },
      onTriggerUndoToast: (label, restoreFn) => {
        showToast(label, restoreFn);
      },
    };
  };

  const currentBoardName = `WF/${activeScreen}/${activeDevice}`;

  // CHẾ ĐỘ SAO CHÉP SẠCH: Ẩn toàn bộ thanh chọn màn hình & annotation bên ngoài để copy riêng màn hình
  if (cleanCopyMode) {
    return (
      <div className="min-h-screen bg-neutral-200 p-4 flex flex-col items-center">
        <div className="fixed top-3 right-3 z-50">
          <button
            type="button"
            onClick={() => setCleanCopyMode(false)}
            className="h-9 px-3 border-2 border-neutral-900 bg-white text-xs font-bold text-neutral-900 shadow-md inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Hiện lại thanh điều khiển Wireframes</span>
          </button>
        </div>

        <div
          className={
            activeDevice === "Mobile"
              ? "w-[390px] min-h-[844px] border-2 border-neutral-900 bg-white shadow-xl overflow-hidden flex flex-col"
              : "w-full max-w-[1440px] min-h-[1024px] border-2 border-neutral-900 bg-white shadow-xl overflow-hidden flex flex-col"
          }
        >
          <SingleWireframeScreenContent ctx={buildContext()} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-200 text-neutral-900 flex flex-col font-sans">
      {/* THANH ĐIỀU KHIỂN KHU VỰC WIREFRAMES (Nằm ngoài giao diện sản phẩm) */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-neutral-900 px-4 py-3 flex flex-col gap-2.5 shadow-sm">
        <div className="max-w-[1480px] w-full mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={onBackToColorUI}
              className="h-8 px-3 border border-neutral-900 bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-900 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về bản Giao diện màu (UI)</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 border border-neutral-900 bg-neutral-900 text-white text-xs font-mono font-bold">
                /wireframes
              </span>
              <span className="text-sm font-bold text-neutral-900">
                Bộ Wireframe Kotoba (10 bản chính • Đánh giá bố cục &amp; hành trình học)
              </span>
            </div>
          </div>

          {/* Chuyển đổi 2 chế độ: "Tổng quan" và "Xem từng màn hình" + Nút ẩn công cụ */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex border border-neutral-900 bg-neutral-100">
              <button
                type="button"
                onClick={() => setViewMode("overview")}
                className={`h-8 px-3 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "overview"
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-neutral-800 hover:bg-neutral-100"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Tổng quan (10 bản)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("single")}
                className={`h-8 px-3 text-xs font-bold border-l border-neutral-900 inline-flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "single"
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-neutral-800 hover:bg-neutral-100"
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Xem từng màn hình</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAnnotations((v) => !v)}
              className={`h-8 px-2.5 border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                showAnnotations
                  ? "border-neutral-900 bg-neutral-800 text-white"
                  : "border-neutral-400 bg-white text-neutral-800"
              }`}
            >
              {showAnnotations ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
              <span>Annotation: {showAnnotations ? "Bật" : "Tắt"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode("single");
                setCleanCopyMode(true);
              }}
              className="h-8 px-2.5 border border-neutral-900 bg-white hover:bg-neutral-100 text-xs font-bold text-neutral-900 cursor-pointer"
            >
              Ẩn công cụ để sao chép
            </button>
          </div>
        </div>

        {/* Dòng 2: Chọn Màn hình (1-5), Thiết bị (Desktop 1440px / Mobile 390px) & Trạng thái phụ */}
        <div className="max-w-[1480px] w-full mx-auto pt-2 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono font-bold text-neutral-600 mr-1">Màn hình:</span>
            {WF_SCREENS_ORDER.map((item) => {
              const active = activeScreen === item.key && viewMode === "single";
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setActiveScreen(item.key);
                    setViewMode("single");
                  }}
                  className={`h-7 px-2.5 border font-semibold cursor-pointer ${
                    active
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-400 bg-white text-neutral-800 hover:bg-neutral-100"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Chọn Desktop 1440 px hoặc Mobile 390 px */}
            <div className="inline-flex border border-neutral-900">
              <button
                type="button"
                onClick={() => setActiveDevice("Desktop")}
                className={`h-7 px-2.5 font-semibold inline-flex items-center gap-1 cursor-pointer ${
                  activeDevice === "Desktop"
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-neutral-800"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop 1440 px</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveDevice("Mobile")}
                className={`h-7 px-2.5 font-semibold border-l border-neutral-900 inline-flex items-center gap-1 cursor-pointer ${
                  activeDevice === "Mobile"
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-neutral-800"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile 390 px</span>
              </button>
            </div>

            {/* Dropdown Trạng thái phụ */}
            <div className="flex items-center gap-1">
              <span className="font-mono text-neutral-600">Trạng thái phụ:</span>
              <select
                aria-label="Chọn trạng thái phụ để kiểm duyệt"
                value={subState}
                onChange={(e) => {
                  const chosen = e.target.value as WFSubState;
                  setSubState(chosen);
                  const spec = SUB_STATES_LIST.find((s) => s.id === chosen);
                  if (spec?.targetScreen) {
                    setActiveScreen(spec.targetScreen);
                  }
                  if (spec?.targetDevice) {
                    setActiveDevice(spec.targetDevice);
                  }
                  setViewMode("single");
                }}
                className="h-7 px-2 border border-neutral-500 bg-white font-semibold text-neutral-900"
              >
                {SUB_STATES_LIST.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* TOAST THÔNG BÁO VÀ HOÀN TÁC (Nằm cố định góc dưới phải khi thao tác) */}
      {undoToast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 border-2 border-neutral-900 bg-neutral-900 text-white px-4 py-3 shadow-xl flex items-center gap-3 text-xs font-sans"
        >
          <span>{undoToast.label}</span>
          {undoToast.restoreFn && (
            <button
              type="button"
              onClick={() => {
                undoToast.restoreFn?.();
                setUndoToast(null);
              }}
              className="px-2.5 py-1 border border-white bg-white text-neutral-900 font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Hoàn tác</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setUndoToast(null)}
            className="text-neutral-300 hover:text-white font-bold ml-1 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* VÙNG TRÌNH BÀY CHÍNH */}
      <div className="max-w-[1480px] w-full mx-auto p-4 md:p-6 flex-1 flex flex-col gap-6">
        {viewMode === "single" ? (
          /* ==================================================================
           * CHẾ ĐỘ 1: XEM TỪNG MÀN HÌNH (Ở kích thước thiết kế 1440px hoặc 390px)
           * ================================================================ */
          <div className="flex flex-col gap-5">
            {/* Thanh tiêu đề bản thiết kế + Gợi ý 6 luồng tương tác */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-400 pb-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 border border-neutral-900 bg-neutral-900 text-white font-bold">
                  {currentBoardName}
                </span>
                <span className="text-neutral-700">
                  Kích thước thiết kế:{" "}
                  <strong>
                    {activeDevice === "Desktop" ? "1440 × 1024 px" : "390 × 844 px (Cố định 390px)"}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap font-sans">
                <span className="text-neutral-600 font-semibold inline-flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5" /> Thử nhanh hành trình:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSubState("default");
                    setActiveScreen("Home");
                  }}
                  className="underline font-semibold text-neutral-900 cursor-pointer"
                >
                  1. Trang chủ → Xem tập
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    setSubState("default");
                    setActiveScreen("Watch");
                    setActiveDictKey("aisukoohii");
                  }}
                  className="underline font-semibold text-neutral-900 cursor-pointer"
                >
                  2. Bấm từ → Lưu từ
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsLoggedIn(false);
                    setSubState("guest");
                    setActiveScreen("Watch");
                  }}
                  className="underline font-semibold text-neutral-900 cursor-pointer"
                >
                  4. Khách bấm lưu → Đăng nhập
                </button>
              </div>
            </div>

            {/* Annotation bên ngoài màn hình */}
            {showAnnotations && <WireframeAnnotationPanel screen={activeScreen} />}

            {/* Khung màn hình sản phẩm: Desktop 1440px | Mobile đúng 390px không kéo giãn */}
            <div className="w-full overflow-x-auto flex justify-center">
              <div
                className={
                  activeDevice === "Mobile"
                    ? "w-[390px] shrink-0 min-h-[844px] border-2 border-neutral-900 bg-white shadow-lg flex flex-col overflow-hidden"
                    : "w-full max-w-[1440px] min-h-[960px] border-2 border-neutral-900 bg-white shadow-lg flex flex-col overflow-hidden"
                }
              >
                <SingleWireframeScreenContent ctx={buildContext()} />
              </div>
            </div>
          </div>
        ) : (
          /* ==================================================================
           * CHẾ ĐỘ 2: TỔNG QUAN (Xem 10 bản chính thu nhỏ, giữ nguyên bố cục bên trong)
           * ================================================================ */
          <div className="flex flex-col gap-8">
            <div className="p-4 border-2 border-neutral-900 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h1 className="text-base font-bold text-neutral-900">
                  Tổng quan 10 bản Wireframe chính (5 Desktop 1440 px + 5 Mobile 390 px)
                </h1>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Các bản thu nhỏ giữ nguyên bố cục bên trong bằng tỷ lệ thu phóng. Bấm vào bất kỳ
                  bản nào để mở chế độ &ldquo;Xem từng màn hình&rdquo; và tương tác trực tiếp.
                </p>
              </div>
            </div>

            {WF_SCREENS_ORDER.map((scr) => {
              const desktopName = `WF/${scr.key}/Desktop`;
              const mobileName = `WF/${scr.key}/Mobile`;

              return (
                <section
                  key={scr.key}
                  className="p-5 border-2 border-neutral-400 bg-neutral-100 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between border-b border-neutral-300 pb-2">
                    <h2 className="text-base font-bold text-neutral-900">{scr.label}</h2>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveScreen(scr.key);
                          setActiveDevice("Desktop");
                          setViewMode("single");
                        }}
                        className="h-8 px-3 border border-neutral-900 bg-neutral-900 text-white text-xs font-bold cursor-pointer"
                      >
                        Mở {desktopName} (1440 px)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveScreen(scr.key);
                          setActiveDevice("Mobile");
                          setViewMode("single");
                        }}
                        className="h-8 px-3 border border-neutral-900 bg-white text-neutral-900 text-xs font-bold cursor-pointer"
                      >
                        Mở {mobileName} (390 px)
                      </button>
                    </div>
                  </div>

                  {showAnnotations && <WireframeAnnotationPanel screen={scr.key} />}

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    {/* Bản thu nhỏ Desktop 1440px (Thu phóng giữ nguyên bố cục 1440px bên trong) */}
                    <div className="xl:col-span-8 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-neutral-900">{desktopName}</span>
                        <span className="text-neutral-600">1440 × 1024 px (Scale 55%)</span>
                      </div>
                      <div
                        onClick={() => {
                          setActiveScreen(scr.key);
                          setActiveDevice("Desktop");
                          setViewMode("single");
                        }}
                        className="w-full h-[560px] border-2 border-neutral-900 bg-white overflow-hidden relative cursor-pointer group"
                      >
                        <div
                          style={{
                            width: "1440px",
                            minHeight: "1024px",
                            transform: "scale(0.55)",
                            transformOrigin: "top left",
                          }}
                          className="pointer-events-none select-none"
                        >
                          <SingleWireframeScreenContent ctx={buildContext(scr.key, "Desktop")} />
                        </div>
                        <div className="absolute bottom-3 right-3 px-3 py-1.5 border-2 border-neutral-900 bg-white text-xs font-bold text-neutral-900 shadow">
                          Nhấn để mở tương tác {desktopName} →
                        </div>
                      </div>
                    </div>

                    {/* Bản Mobile 390px đúng kích thước hoặc thu phóng gọn */}
                    <div className="xl:col-span-4 flex flex-col gap-2 items-center xl:items-start">
                      <div className="w-[390px] max-w-full flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-neutral-900">{mobileName}</span>
                        <span className="text-neutral-600">390 × 844 px</span>
                      </div>
                      <div
                        onClick={() => {
                          setActiveScreen(scr.key);
                          setActiveDevice("Mobile");
                          setViewMode("single");
                        }}
                        className="w-[390px] max-w-full h-[560px] border-2 border-neutral-900 bg-white overflow-y-auto relative cursor-pointer"
                      >
                        <div className="pointer-events-none select-none">
                          <SingleWireframeScreenContent ctx={buildContext(scr.key, "Mobile")} />
                        </div>
                        <div className="sticky bottom-3 left-3 right-3 mx-3 px-3 py-1.5 border-2 border-neutral-900 bg-white text-xs font-bold text-neutral-900 text-center shadow">
                          Nhấn để mở tương tác {mobileName} →
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
