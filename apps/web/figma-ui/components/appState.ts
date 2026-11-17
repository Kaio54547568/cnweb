import type { ApiCheckpoint, ApiMe } from "../lib/api";
import type { Episode, TranscriptItem, WordEntry } from "../data/mockData";

export type ScreenId = "Home" | "Library" | "Watch" | "Auth" | "Notebook";

export interface WatchTarget {
  episode: Episode;
  /** Giây bắt đầu phát; bỏ trống để tự lấy vị trí xem tiếp (nếu đã đăng nhập). */
  startAt?: number;
  /** Đổi giá trị mỗi lần mở để buộc nạp lại cùng một tập. */
  nonce: number;
}

/** Trạng thái dùng chung giữa các màn hình, nối với API thật qua BFF. */
export interface AppState {
  screen: ScreenId;
  navigate: (screen: ScreenId) => void;

  authStatus: "loading" | "authenticated" | "unauthenticated";
  isLoggedIn: boolean;
  userName: string;
  profile: ApiMe | null;
  login: () => void;
  logout: () => void;
  updateProfile: (patch: { displayName?: string | null; jlptLevel?: string | null }) => Promise<boolean>;
  deleteAccount: () => Promise<void>;

  watch: WatchTarget | null;
  openEpisode: (episode: Episode, options?: { startAt?: number }) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  levelFilter: string;
  setLevelFilter: (level: string) => void;
  seriesFilter: string | null;
  setSeriesFilter: (slug: string | null) => void;

  savedKeys: ReadonlySet<string>;
  mergeSavedKeys: (keys: string[], scopePrefix?: string) => void;
  markSaved: (key: string, saved: boolean) => void;
  toggleWord: (entry: WordEntry) => void;
  toggleCue: (episodeId: string, item: TranscriptItem) => void;

  checkpoints: ApiCheckpoint[];
  refreshCheckpoints: () => void;

  theme: "dark" | "light";
  toggleTheme: () => void;
  notify: (message: string) => void;
  fail: (error: unknown) => void;
}
