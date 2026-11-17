import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import type { Episode, TranscriptItem, WordEntry } from "./data/mockData";
import { Toast } from "./components/DesignSystem";
import { ScreenViewport } from "./components/MVPScreens";
import type { AppState, ScreenId, WatchTarget } from "./components/appState";
import { WireframesWorkspace } from "./wireframes/WireframesWorkspace";
import { ApiCheckpoint, ApiError, ApiMe, endpoints, errorMessage } from "./lib/api";
import { cueKey, wordKey } from "./lib/mappers";

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

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem("kotoba-theme", next);
      } catch {
        // Bỏ qua nếu trình duyệt chặn localStorage
      }
      return next;
    });
  }, []);

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

  /* ------------------------------ Phiên đăng nhập ------------------------------ */
  const { data: session, status } = useSession();
  const accountId = session?.accountId;
  const isLoggedIn = status === "authenticated" && Boolean(accountId);
  const authStatus: AppState["authStatus"] =
    status === "loading" ? "loading" : isLoggedIn ? "authenticated" : "unauthenticated";

  /* -------------------------------- Giao diện -------------------------------- */
  const [screen, setScreen] = useState<ScreenId>("Home");
  const [watch, setWatch] = useState<WatchTarget | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [seriesFilter, setSeriesFilter] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; tone: "success" | "error" } | null>(null);

  const notify = useCallback((text: string, tone: "success" | "error" = "success") => {
    setToastMessage({ text, tone });
    window.setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3600);
  }, []);

  const fail = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        notify("Phiên đăng nhập đã hết. Hãy đăng nhập lại bằng Google.", "error");
      } else {
        notify(errorMessage(error), "error");
      }
    },
    [notify],
  );

  const navigate = useCallback((next: ScreenId) => {
    setScreen(next);
    window.scrollTo({ top: 0 });
  }, []);

  const openEpisode = useCallback((episode: Episode, options?: { startAt?: number }) => {
    setWatch({ episode, startAt: options?.startAt, nonce: Date.now() });
    setScreen("Watch");
    window.scrollTo({ top: 0 });
  }, []);

  /* ------------------------------ Hồ sơ, Sổ tay ------------------------------ */
  const [profile, setProfile] = useState<ApiMe | null>(null);
  const [checkpoints, setCheckpoints] = useState<ApiCheckpoint[]>([]);
  const [savedKeys, setSavedKeys] = useState<ReadonlySet<string>>(new Set());
  const savedRef = useRef(savedKeys);
  savedRef.current = savedKeys;
  const pending = useRef(new Set<string>());

  const refreshCheckpoints = useCallback(() => {
    if (!accountId) return;
    endpoints
      .checkpoints()
      .then(({ items }) => setCheckpoints(items))
      .catch(() => undefined);
  }, [accountId]);

  useEffect(() => {
    if (!accountId) {
      setProfile(null);
      setCheckpoints([]);
      setSavedKeys(new Set());
      return;
    }
    const controller = new AbortController();
    endpoints
      .me(controller.signal)
      .then(setProfile)
      .catch((error) => {
        if (!controller.signal.aborted) fail(error);
      });
    endpoints
      .bookmarks(1, controller.signal)
      .then(({ items }) => setSavedKeys((prev) => new Set([...prev, ...items.map((item) => item.key)])))
      .catch(() => undefined);
    refreshCheckpoints();
    return () => controller.abort();
  }, [accountId, fail, refreshCheckpoints]);

  const mergeSavedKeys = useCallback((keys: string[], scopePrefix?: string) => {
    setSavedKeys((prev) => {
      const next = new Set(scopePrefix ? [...prev].filter((key) => !key.startsWith(scopePrefix)) : prev);
      keys.forEach((key) => next.add(key));
      return next;
    });
  }, []);

  const markSaved = useCallback((key: string, saved: boolean) => {
    setSavedKeys((prev) => {
      const next = new Set(prev);
      if (saved) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  /** Lưu / bỏ lưu tức thì (lạc quan); hoàn lại khi API lỗi. */
  const toggleBookmark = useCallback(
    async (key: string, body: { episodeId: string; cueId: string } | { entryId: string }, label: string) => {
      if (!isLoggedIn) {
        notify("Đăng nhập bằng Google để lưu vào Sổ tay.", "error");
        return;
      }
      if (pending.current.has(key)) return;
      pending.current.add(key);
      const wasSaved = savedRef.current.has(key);
      markSaved(key, !wasSaved);
      try {
        if (wasSaved) await endpoints.removeBookmark(key);
        else await endpoints.saveBookmark(body);
        notify(wasSaved ? `Đã bỏ lưu ${label} khỏi Sổ tay` : `Đã lưu ${label} vào Sổ tay`);
      } catch (error) {
        markSaved(key, wasSaved);
        fail(error);
      } finally {
        pending.current.delete(key);
      }
    },
    [fail, isLoggedIn, markSaved, notify],
  );

  const toggleWord = useCallback(
    (entry: WordEntry) => void toggleBookmark(wordKey(entry.id), { entryId: entry.id }, `từ “${entry.word}”`),
    [toggleBookmark],
  );
  const toggleCue = useCallback(
    (episodeId: string, item: TranscriptItem) =>
      void toggleBookmark(cueKey(episodeId, item.id), { episodeId, cueId: item.id }, `câu tại ${item.startTime}`),
    [toggleBookmark],
  );

  const updateProfile = useCallback(
    async (patch: { displayName?: string | null; jlptLevel?: string | null }) => {
      try {
        setProfile(await endpoints.updateMe(patch));
        return true;
      } catch (error) {
        fail(error);
        return false;
      }
    },
    [fail],
  );

  const deleteAccount = useCallback(async () => {
    try {
      await endpoints.deleteMe();
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      fail(error);
    }
  }, [fail]);

  const login = useCallback(() => {
    void signIn("google", { callbackUrl: "/" }).catch(() => notify("Đăng nhập tạm thời gián đoạn.", "error"));
  }, [notify]);
  const logout = useCallback(() => void signOut({ callbackUrl: "/" }), []);

  const userName = profile?.displayName || session?.user?.name || "Học viên";

  const state: AppState = useMemo(
    () => ({
      screen,
      navigate,
      authStatus,
      isLoggedIn,
      userName,
      profile,
      login,
      logout,
      updateProfile,
      deleteAccount,
      watch,
      openEpisode,
      searchQuery,
      setSearchQuery,
      levelFilter,
      setLevelFilter,
      seriesFilter,
      setSeriesFilter,
      savedKeys,
      mergeSavedKeys,
      markSaved,
      toggleWord,
      toggleCue,
      checkpoints,
      refreshCheckpoints,
      theme,
      toggleTheme,
      notify: (message: string) => notify(message),
      fail,
    }),
    [
      screen, navigate, authStatus, isLoggedIn, userName, profile, login, logout, updateProfile, deleteAccount,
      watch, openEpisode, searchQuery, levelFilter, seriesFilter, savedKeys, mergeSavedKeys, markSaved,
      toggleWord, toggleCue, checkpoints, refreshCheckpoints, theme, toggleTheme, notify, fail,
    ],
  );

  if (isWireframesRoute) {
    return <WireframesWorkspace onBackToColorUI={closeWireframesArea} />;
  }

  return (
    <div className="min-h-screen bg-canvas text-fg flex flex-col font-sans">
      {/* Toast phản hồi nổi */}
      {toastMessage && (
        <div className="fixed z-50 bottom-20 left-4 right-4 md:bottom-5 md:left-auto md:right-5 flex md:block justify-center">
          <Toast message={toastMessage.text} tone={toastMessage.tone} onClose={() => setToastMessage(null)} />
        </div>
      )}

      {/* Giao diện website frontend chính của Kotoba */}
      <ScreenViewport screen={screen} state={state} />
    </div>
  );
}
