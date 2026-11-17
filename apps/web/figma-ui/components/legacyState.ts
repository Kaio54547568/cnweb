import type { Episode, TranscriptItem, WordEntry } from "../data/mockData";
import type { ScreenId } from "./appState";

/**
 * Trạng thái giả dùng cho các trang trình diễn design system (DesignSystemPages).
 * Giao diện thật dùng `AppState` trong appState.ts.
 */
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
