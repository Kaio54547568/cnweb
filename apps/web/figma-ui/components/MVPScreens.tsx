import React, { useEffect, useState } from "react";
import { BookOpen, Home, Library, Play } from "lucide-react";
import {
  Brand,
  Button,
  Header,
  MobileNavigation,
  SearchField,
  SidebarItem,
} from "./DesignSystem";
import type { AppState, ScreenId } from "./appState";
import { AuthScreen } from "../screens/AuthScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LibraryScreen } from "../screens/LibraryScreen";
import { NotebookScreen } from "../screens/NotebookScreen";
import { WatchScreen } from "../screens/WatchScreen";
import { formatTime, stubEpisode } from "../lib/mappers";

export type { ScreenId } from "./appState";

/* ============================================================================
 * SIDEBAR DESKTOP 240px — Trang chủ, Kho nội dung, Sổ tay
 * Thẻ "Đang học dở" chỉ hiện ở các màn không tự có nút Xem tiếp (Home, Watch)
 * ========================================================================== */
const DesktopSidebar: React.FC<{ screen: ScreenId; state: AppState }> = ({ screen, state }) => {
  const resume = state.checkpoints[0];
  const showResume = Boolean(resume) && screen !== "Home" && screen !== "Watch";
  return (
    <aside
      aria-label="Điều hướng chính"
      className="w-[240px] shrink-0 bg-canvas border-r border-line flex flex-col justify-between p-4 select-none sticky top-0 h-screen overflow-y-auto"
    >
      <div className="flex flex-col gap-6">
        <div className="px-2 pt-1">
          <Brand size="md" onClick={() => state.navigate("Home")} />
        </div>

        <nav className="flex flex-col gap-1" aria-label="Menu chính">
          <SidebarItem
            icon={<Home className="w-4 h-4" />}
            label="Trang chủ"
            selected={screen === "Home"}
            onClick={() => state.navigate("Home")}
          />
          <SidebarItem
            icon={<Library className="w-4 h-4" />}
            label="Kho nội dung"
            selected={screen === "Library" || screen === "Watch"}
            onClick={() => state.navigate("Library")}
          />
          <SidebarItem
            icon={<BookOpen className="w-4 h-4" />}
            label="Sổ tay"
            selected={screen === "Notebook"}
            badgeCount={state.savedKeys.size}
            onClick={() => state.navigate("Notebook")}
          />
        </nav>
      </div>

      {showResume && resume && (
        <div className="p-3 rounded-[12px] bg-surface border border-line flex flex-col gap-2.5">
          <div className="text-xs text-muted">Đang học dở</div>
          <div className="text-sm font-semibold text-fg truncate">{resume.title}</div>
          <Button
            size="sm"
            variant="primary"
            fullWidth
            iconLeft={<Play className="w-3.5 h-3.5 fill-current" />}
            onClick={() =>
              state.openEpisode(stubEpisode(resume.episodeId, resume.title, resume.positionMs / 1000), {
                startAt: resume.positionMs / 1000,
              })
            }
          >
            Xem tiếp từ {formatTime(resume.positionMs / 1000)}
          </Button>
        </div>
      )}
    </aside>
  );
};

/* ============================================================================
 * KHUNG ỨNG DỤNG (Desktop & Mobile) + 5 màn hình nối API
 * ========================================================================== */
export const ScreenViewport: React.FC<{ screen: ScreenId; state: AppState }> = ({ screen, state }) => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* Tìm kiếm: gõ ở bất kỳ màn nào cũng đưa tới Kho nội dung để thấy kết quả */
  const handleSearchChange = (query: string) => {
    state.setSearchQuery(query);
    if (query.trim() && screen !== "Library") state.navigate("Library");
  };

  const body = (() => {
    switch (screen) {
      case "Home":
        return <HomeScreen state={state} isMobile={isMobile} />;
      case "Library":
        return <LibraryScreen state={state} isMobile={isMobile} />;
      case "Watch":
        return <WatchScreen state={state} isMobile={isMobile} />;
      case "Auth":
        return <AuthScreen state={state} />;
      case "Notebook":
        return <NotebookScreen state={state} isMobile={isMobile} />;
    }
  })();

  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col justify-between bg-canvas relative">
        <Header
          isMobile
          searchQuery={state.searchQuery}
          onSearchChange={handleSearchChange}
          onOpenMobileSearch={() => setMobileSearchOpen((v) => !v)}
          isLoggedIn={state.isLoggedIn}
          userName={state.userName}
          onOpenAuth={() => state.navigate("Auth")}
          onNavigateHome={() => state.navigate("Home")}
          theme={state.theme}
          onToggleTheme={state.toggleTheme}
        />

        {mobileSearchOpen && (
          <div className="p-3 bg-surface border-b border-line flex items-center gap-2">
            <SearchField
              autoFocus
              value={state.searchQuery}
              onChange={handleSearchChange}
              placeholder="Tìm tập, series hoặc kênh…"
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

        <main className="flex-1">{body}</main>

        <MobileNavigation
          activeTab={
            screen === "Notebook" ? "notebook" : screen === "Library" || screen === "Watch" ? "library" : "home"
          }
          onSelectTab={(tab) => {
            if (tab === "home") state.navigate("Home");
            if (tab === "library") state.navigate("Library");
            if (tab === "notebook") state.navigate("Notebook");
          }}
          savedCount={state.savedKeys.size}
        />
      </div>
    );
  }

  // Desktop: Sidebar 240px + Header 72px + nội dung
  return (
    <div className="flex-1 flex bg-canvas w-full">
      <DesktopSidebar screen={screen} state={state} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          searchQuery={state.searchQuery}
          onSearchChange={handleSearchChange}
          isLoggedIn={state.isLoggedIn}
          userName={state.userName}
          onOpenAuth={() => state.navigate("Auth")}
          onNavigateHome={() => state.navigate("Home")}
          theme={state.theme}
          onToggleTheme={state.toggleTheme}
        />
        <main className="flex-1">{body}</main>
      </div>
    </div>
  );
};
