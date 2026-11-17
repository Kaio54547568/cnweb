import type {
  Episode,
  JLPTLevel,
  RubySegment,
  SeriesItem,
  TranscriptItem,
  WordEntry,
} from "../data/mockData";
import type { ApiCue, ApiDictEntry, ApiEpisode, ApiSeries } from "./api";

const LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

export const toLevel = (value: string | null | undefined): JLPTLevel | undefined =>
  LEVELS.find((level) => level === value);

export function formatTime(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Ảnh bìa dựng từ YouTube ID — dùng tạm cho tới khi API trả `thumbnailUrl`. */
export const youtubeThumbnail = (youtubeId: string) => `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;

const plain = (text: string): RubySegment[] => [{ kanji: text }];

export function toEpisode(
  item: ApiEpisode,
  series?: Map<string, ApiSeries>,
  resumeSeconds = 0,
): Episode {
  const parent = item.seriesSlug ? series?.get(item.seriesSlug) : undefined;
  const durationSeconds = item.durationMs ? Math.round(item.durationMs / 1000) : 0;
  const progressPercent =
    durationSeconds > 0 && resumeSeconds > 0
      ? Math.min(100, Math.round((resumeSeconds / durationSeconds) * 100))
      : 0;
  return {
    id: item.id,
    seriesId: item.seriesSlug ?? "",
    seriesSlug: item.seriesSlug ?? undefined,
    seriesTitle: item.seriesTitle ?? undefined,
    number: item.episodeNumber ?? 0,
    title: item.title,
    jpTitle: [],
    duration: durationSeconds > 0 ? formatTime(durationSeconds) : "",
    durationSeconds,
    level: toLevel(parent?.level),
    thumbnail: item.thumbnailUrl ?? "",
    progressPercent,
    lastWatchedSecond: resumeSeconds,
    subtitleCount: 0,
    description: "",
    visibility: item.visibility,
  };
}

export function toSeries(item: ApiSeries): SeriesItem {
  return {
    id: item.slug,
    slug: item.slug,
    title: item.title,
    jpTitle: [],
    level: toLevel(item.level),
    episodeCount: item.episodeCount,
    category: item.genre ?? "",
    channelName: item.channel?.name ?? "",
    thumbnail: item.thumbnailUrl ?? "",
    description: item.description ?? "",
    progressPercent: 0,
    featuredEpisodeId: "",
    tags: item.genre ? [item.genre] : [],
  };
}

/** Chia câu thành các đoạn ruby; từ có `lemma` được gắn `dictId` để bấm tra nghĩa. */
export function toTranscript(cue: ApiCue): TranscriptItem {
  const words: NonNullable<TranscriptItem["words"]> = {};
  let segments: RubySegment[];
  if (cue.words?.length) {
    segments = cue.words.flatMap((word, index) => {
      const dictId = word.lemma ? `${cue.id}:${index}` : undefined;
      if (dictId && word.lemma) words[dictId] = { lemma: word.lemma, surface: word.surface };
      return word.ruby.map(([kanji, furigana]) => ({
        kanji,
        furigana: furigana ?? undefined,
        dictId,
      }));
    });
  } else if (cue.ruby?.length) {
    segments = cue.ruby.map(([kanji, furigana]) => ({ kanji, furigana: furigana ?? undefined }));
  } else {
    segments = plain(cue.text);
  }
  const seconds = cue.startMs / 1000;
  return {
    id: cue.id,
    startTime: formatTime(seconds),
    seconds,
    endSeconds: cue.endMs / 1000,
    speaker: cue.speaker?.name ?? "",
    segments,
    jpPlain: cue.text,
    readingPlain: "",
    vi: cue.translation ?? "",
    words,
  };
}

export function glossText(entry: ApiDictEntry): string {
  const vi = entry.glosses.filter((g) => g.lang === "vi").map((g) => g.text);
  if (vi.length) return vi.join("; ");
  const other = entry.glosses.map((g) => g.text).slice(0, 4);
  return other.join("; ") || "Chưa có nghĩa";
}

export function toWordEntry(
  entry: ApiDictEntry,
  context?: { cue?: TranscriptItem; episodeTitle?: string },
): WordEntry {
  const cue = context?.cue;
  return {
    id: entry.id,
    word: entry.headword,
    furigana: entry.readings[0] ?? "",
    meaningVi: glossText(entry),
    exampleJp: cue ? cue.segments.map((s) => ({ kanji: s.kanji, furigana: s.furigana })) : [],
    exampleVi: cue?.vi || undefined,
    episodeTitle: context?.episodeTitle,
    timestamp: cue?.startTime,
  };
}

export const cueKey = (episodeId: string, cueId: string) => `cue:${episodeId}:${cueId}`;
export const wordKey = (entryId: string) => `word:${entryId}`;

/** Tập tối thiểu dựng từ checkpoint hoặc Sổ tay (chưa có metadata đầy đủ). */
export function stubEpisode(id: string, title: string, resumeSeconds = 0): Episode {
  return {
    id,
    seriesId: "",
    number: 0,
    title,
    jpTitle: [],
    duration: "",
    durationSeconds: 0,
    thumbnail: "",
    progressPercent: 0,
    lastWatchedSecond: resumeSeconds,
    subtitleCount: 0,
    description: "",
  };
}
