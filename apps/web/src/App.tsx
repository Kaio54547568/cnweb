import React, { useState, useEffect } from "react";
import { EPISODES_LIST, Episode, TranscriptItem, WordEntry } from "./data/mockData";
import { Toast } from "./components/DesignSystem";
import { ScreenViewport, ScreenId, MVPSharedState } from "./components/MVPScreens";
import { WireframesWorkspace } from "./wireframes/WireframesWorkspace";

export default function App() {
  // Đồng bộ tiêu đề trang web sang Kotoba
  useEffect(() => {
    document.title = "Kotoba - Học tiếng Nhật qua video và ngữ cảnh";
  }, []);

  // Chế độ sáng / tối: đọc từ localStorage → hệ thống → mặc định tối
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof document === "undefined") return "dark";
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem("kotoba-theme", next);
      } catch {
        // Bỏ qua nếu trình duyệt chặn localStorage
      }
      return next;
    });
  };

  // Kiểm tra đường dẫn /wireframes nếu người dùng truy cập trực tiếp URL
  const [isWireframesRoute, setIsWireframesRoute] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname === "/wireframes" || window.location.hash === "#/wireframes";
    }
    return false;
  });

  useEffect(() => {
    const handlePopState = () => {
      setIsWireframesRoute(
        window.location.pathname === "/wireframes" || window.location.hash === "#/wireframes",
      );
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Khu wireframes giữ nền tối cố định; app chính theo chủ đề người dùng chọn
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isWireframesRoute ? "dark" : theme);
  }, [theme, isWireframesRoute]);

  const closeWireframesArea = () => {
    try {
      window.history.pushState({}, "", "/");
    } catch {
      // Bỏ qua nếu môi trường iframe chặn pushState
    }
    setIsWireframesRoute(false);
  };

  // Trạng thái màn hình ứng dụng Kotoba (Home, Library, Watch, Notebook, Auth)
  const [currentScreen, setCurrentScreen] = useState<ScreenId>("Home");

  // Trạng thái học tập thực tế (giữ tiến độ, lưu từ vựng/câu/series bằng nút tim)
  const [selectedEpisode, setSelectedEpisode] = useState<Episode>(EPISODES_LIST[0]);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(92); // 01:32 giữ tiến độ mặc định
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [savedSeriesIds, setSavedSeriesIds] = useState<string[]>(["series-cafe"]);
  const [savedWordIds, setSavedWordIds] = useState<string[]>(["chuumon", "osusume"]);
  const [savedSentenceIds, setSavedSentenceIds] = useState<string[]>(["sub-1", "sub-3"]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [userName, setUserName] = useState<string>("Minh Anh");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Đồng hồ phát: mỗi giây tiến 1s khi đang phát, dừng ở cuối tập
  useEffect(() => {
    if (!isPlaying) return;
    const total = selectedEpisode.durationSeconds;
    const id = window.setInterval(() => {
      setCurrentTimeSec((t) => {
        if (t + 1 >= total) {
          setIsPlaying(false);
          return total;
        }
        return t + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isPlaying, selectedEpisode.durationSeconds]);

  const formatTime = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const sharedState: MVPSharedState = {
    currentScreen,
    onNavigate: (scr) => {
      if (scr !== "Watch") setIsPlaying(false);
      setCurrentScreen(scr);
      window.scrollTo({ top: 0 });
    },
    selectedEpisode,
    onSelectEpisode: (ep, resume = true, startAt) => {
      const resumeAt = resume && ep.lastWatchedSecond > 0 ? ep.lastWatchedSecond : 0;
      setSelectedEpisode(ep);
      setCurrentTimeSec(startAt ?? resumeAt);
      setCurrentScreen("Watch");
      setIsPlaying(true);
      window.scrollTo({ top: 0 });
      if (startAt === undefined && resumeAt > 0) {
        triggerToast(`Xem tiếp "${ep.title}" từ ${formatTime(resumeAt)}`);
      }
    },
    currentTimeSec,
    onSeekTime: (sec) => {
      setCurrentTimeSec(sec);
    },
    isPlaying,
    onTogglePlay: () => setIsPlaying((p) => !p),
    savedSeriesIds,
    onToggleSaveSeries: (seriesId) => {
      setSavedSeriesIds((prev) => {
        const exists = prev.includes(seriesId);
        triggerToast(exists ? "Đã bỏ lưu series khỏi Sổ tay" : "Đã lưu series vào Sổ tay cá nhân");
        return exists ? prev.filter((id) => id !== seriesId) : [...prev, seriesId];
      });
    },
    savedWordIds,
    onToggleSaveWord: (entry: WordEntry) => {
      setSavedWordIds((prev) => {
        const exists = prev.includes(entry.id);
        triggerToast(
          exists
            ? `Đã xóa từ "${entry.word}" khỏi Sổ tay`
            : `Đã lưu từ "${entry.word}" (${entry.meaningVi}) vào Sổ tay`,
        );
        return exists ? prev.filter((id) => id !== entry.id) : [...prev, entry.id];
      });
    },
    savedSentenceIds,
    onToggleSaveSentence: (item: TranscriptItem) => {
      setSavedSentenceIds((prev) => {
        const exists = prev.includes(item.id);
        triggerToast(
          exists
            ? "Đã bỏ lưu câu phụ đề khỏi Sổ tay"
            : `Đã lưu câu tại ${item.startTime} vào Sổ tay`,
        );
        return exists ? prev.filter((id) => id !== item.id) : [...prev, item.id];
      });
    },
    searchQuery,
    onSearchChange: setSearchQuery,
    levelFilter,
    onLevelFilterChange: setLevelFilter,
    isLoggedIn,
    userName,
    theme,
    onToggleTheme: toggleTheme,
    onLoginSuccess: (email) => {
      const namePart = email.split("@")[0] || "Học viên";
      setUserName(namePart);
      setIsLoggedIn(true);
      setCurrentScreen("Home");
      triggerToast(`Đăng nhập thành công với ${email}`);
    },
    onLogout: () => {
      setIsLoggedIn(false);
      triggerToast("Đã đăng xuất khỏi Kotoba");
    },
  };

  if (isWireframesRoute) {
    return <WireframesWorkspace onBackToColorUI={closeWireframesArea} />;
  }

  return (
    <div className="min-h-screen bg-canvas text-fg flex flex-col font-sans">
      {/* Toast phản hồi nổi */}
      {toastMessage && (
        <div className="fixed z-50 bottom-20 left-4 right-4 md:bottom-5 md:left-auto md:right-5 flex md:block justify-center">
          <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        </div>
      )}

      {/* Giao diện website frontend chính của Kotoba */}
      <ScreenViewport screen={currentScreen} state={sharedState} />
    </div>
  );
}
