/** Client gọi API qua BFF cùng origin (`/api/v1/*`). Xem docs/guides/ban-giao-backend-frontend-mvp.md. */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly retryAfter?: number,
  ) {
    super(message);
  }
}

export interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  let response: Response;
  try {
    response = await fetch("/api/v1" + path, {
      method,
      headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      credentials: "same-origin",
      signal: options.signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiError(0, "NETWORK", "Không kết nối được máy chủ");
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }
  if (!response.ok) {
    const problem = (data as { error?: { code?: string; message?: string } } | undefined)?.error;
    const retry = Number(response.headers.get("retry-after"));
    throw new ApiError(
      response.status,
      problem?.code ?? "ERROR",
      problem?.message ?? response.statusText,
      Number.isFinite(retry) && retry > 0 ? retry : undefined,
    );
  }
  return data as T;
}

/** Thông báo tiếng Việt cho người dùng theo mã lỗi. */
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Có lỗi xảy ra. Vui lòng thử lại.";
  switch (error.status) {
    case 0:
      return "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.";
    case 400:
      return "Dữ liệu gửi lên không hợp lệ.";
    case 401:
      return "Bạn cần đăng nhập để thực hiện thao tác này.";
    case 403:
      return "Bạn không có quyền thực hiện thao tác này.";
    case 404:
      return "Nội dung không còn truy cập được.";
    case 409:
      return "Dữ liệu đã thay đổi ở nơi khác. Hãy tải lại rồi thử lại.";
    case 413:
      return "Nội dung quá lớn.";
    case 422:
      return "Chưa đủ điều kiện để thực hiện thao tác này.";
    case 429:
      return error.retryAfter
        ? `Bạn thao tác quá nhanh. Thử lại sau ${error.retryAfter} giây.`
        : "Bạn thao tác quá nhanh. Vui lòng thử lại sau.";
    default:
      return error.status >= 500 ? "Máy chủ đang gặp sự cố. Vui lòng thử lại sau." : error.message;
  }
}

/* ---------------------------- Kiểu dữ liệu phản hồi ---------------------------- */

export type Visibility = "SAMPLE" | "MEMBER";

export interface ApiEpisode {
  id: string;
  title: string;
  visibility: Visibility;
  episodeNumber: number | null;
  seriesTitle: string | null;
  seriesSlug: string | null;
  channelName: string | null;
  // Chờ backend bổ sung (xem bảng yêu cầu API); FE đã đọc sẵn nếu có.
  thumbnailUrl?: string | null;
  durationMs?: number | null;
}

export interface ApiSeries {
  id: string;
  slug: string;
  title: string;
  language: string;
  level: string | null;
  genre: string | null;
  channel: { name: string } | null;
  // Chờ backend bổ sung.
  description?: string | null;
  episodeCount?: number;
  thumbnailUrl?: string | null;
}

export interface ApiFilters {
  levels: string[];
  genres: string[];
  channels: { id: string; name: string }[];
}

export type ApiRuby = [surface: string, reading: string | null];
export interface ApiWord {
  surface: string;
  lemma: string | null;
  reading: string | null;
  ruby: ApiRuby[];
}
export interface ApiCue {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  translation: string | null;
  ruby?: ApiRuby[];
  words?: ApiWord[];
  speakerId?: string;
  speaker?: { id: string; name: string; color?: string | null; avatarUrl?: string | null };
}
export interface ApiEpisodeDetail {
  id: string;
  title: string;
  youtubeId: string;
  revisionId: string;
  cues: ApiCue[];
  durationMs?: number | null;
}

export interface ApiGloss {
  lang: string;
  text: string;
  source?: string | null;
}
export interface ApiDictEntry {
  id: string;
  headword: string;
  readings: string[];
  glosses: ApiGloss[];
}
export interface ApiDictionary {
  entries: ApiDictEntry[];
  kanji: ApiDictEntry[];
}

export type ApiBookmarkItem =
  | { key: string; kind: "word"; available: true; entry: ApiDictEntry }
  | { key: string; kind: "cue"; available: false }
  | {
      key: string;
      kind: "cue";
      available: true;
      episodeId: string;
      episodeTitle: string;
      cue: { text: string; translation: string | null; startMs: number };
    };

export interface ApiCheckpoint {
  episodeId: string;
  positionMs: number;
  title: string;
}

export interface ApiMe {
  id: string;
  role: "LEARNER" | "EDITOR";
  displayName: string | null;
  jlptLevel: string | null;
  learningLanguage: string;
}

export const endpoints = {
  episodes: (params: URLSearchParams, signal?: AbortSignal) =>
    api<{ episodes: ApiEpisode[]; page: number; hasMore: boolean }>("/episodes?" + params, { signal }),
  series: (signal?: AbortSignal) => api<ApiSeries[]>("/series", { signal }),
  filters: (signal?: AbortSignal) => api<ApiFilters>("/episodes/filters", { signal }),
  episode: (id: string, signal?: AbortSignal) => api<ApiEpisodeDetail>("/episodes/" + id, { signal }),
  dictionary: (q: string, surface?: string, signal?: AbortSignal) => {
    const params = new URLSearchParams({ q });
    if (surface && surface !== q) params.set("surface", surface);
    return api<ApiDictionary>("/dictionary?" + params, { signal });
  },
  me: (signal?: AbortSignal) => api<ApiMe>("/identity/me", { signal }),
  updateMe: (body: { displayName?: string | null; jlptLevel?: string | null }) =>
    api<ApiMe>("/identity/me", { method: "PATCH", body }),
  deleteMe: () => api<void>("/identity/me", { method: "DELETE" }),
  bookmarkKeysForEpisode: (episodeId: string, signal?: AbortSignal) =>
    api<{ keys: string[] }>("/learning/bookmarks/status?episodeId=" + episodeId, { signal }),
  bookmarkKeysForEntries: (ids: string[], signal?: AbortSignal) => {
    const params = new URLSearchParams();
    ids.slice(0, 32).forEach((id) => params.append("entryId", id));
    return api<{ keys: string[] }>("/learning/bookmarks/status?" + params, { signal });
  },
  bookmarks: (page: number, signal?: AbortSignal) =>
    api<{ items: ApiBookmarkItem[]; page: number; hasMore: boolean }>("/learning/bookmarks?page=" + page, {
      signal,
    }),
  saveBookmark: (body: { episodeId: string; cueId: string } | { entryId: string }) =>
    api<{ key: string }>("/learning/bookmarks", { method: "POST", body }),
  removeBookmark: (key: string) =>
    api<void>("/learning/bookmarks/" + encodeURIComponent(key), { method: "DELETE" }),
  checkpoints: (signal?: AbortSignal) => api<{ items: ApiCheckpoint[] }>("/learning/checkpoints", { signal }),
  checkpoint: (episodeId: string, signal?: AbortSignal) =>
    api<{ checkpoint: { positionMs: number } | null }>("/learning/checkpoints/" + episodeId, { signal }),
  saveCheckpoint: (episodeId: string, positionMs: number) =>
    api<unknown>("/learning/checkpoints/" + episodeId, { method: "PUT", body: { positionMs } }),
};
