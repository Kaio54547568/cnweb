import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Heart, Pause, Play, Search, SkipBack, SkipForward } from "lucide-react";
import {
  Button,
  DictionaryPopover,
  EmptyState,
  RubyText,
  Skeleton,
  Toggle,
  TranscriptRow,
} from "../components/DesignSystem";
import type { AppState, WatchTarget } from "../components/appState";
import { PlayerControls, YouTubePlayer } from "../components/YouTubePlayer";
import type { TranscriptItem, WordEntry } from "../data/mockData";
import { ApiError, endpoints, errorMessage } from "../lib/api";
import { useAsync } from "../lib/hooks";
import { cueKey, formatTime, toEpisode, toTranscript, toWordEntry, wordKey } from "../lib/mappers";
import { ErrorState, LoginPrompt, isNotFound, isUnauthorized } from "./common";

const MemoRow = React.memo(TranscriptRow);

type DictState =
  | { status: "idle" }
  | { status: "loading"; term: string }
  | { status: "ready"; entry: WordEntry; extra: number }
  | { status: "empty"; term: string }
  | { status: "error"; term: string; error: unknown };

export const WatchScreen: React.FC<{ state: AppState; isMobile: boolean }> = ({ state, isMobile }) => {
  const target = state.watch;
  if (!target) {
    return (
      <div className="p-6">
        <EmptyState
          title="Chưa chọn tập nào"
          description="Chọn một tập trong Kho nội dung để bắt đầu học."
          actionLabel="Mở Kho nội dung"
          onAction={() => state.navigate("Library")}
        />
      </div>
    );
  }
  return <WatchInner key={target.nonce} state={state} target={target} isMobile={isMobile} />;
};

const WatchInner: React.FC<{ state: AppState; target: WatchTarget; isMobile: boolean }> = ({
  state,
  target,
  isMobile,
}) => {
  const ep = target.episode;
  const { isLoggedIn, mergeSavedKeys, refreshCheckpoints, fail } = state;

  const detail = useAsync((signal) => endpoints.episode(ep.id, signal), [ep.id]);
  const needResume = target.startAt === undefined && isLoggedIn;
  const resume = useAsync((signal) => endpoints.checkpoint(ep.id, signal), [ep.id], needResume);
  const siblings = useAsync(
    (signal) => endpoints.episodes(new URLSearchParams({ page: "1", series: ep.seriesSlug ?? "" }), signal),
    [ep.seriesSlug],
    Boolean(ep.seriesSlug),
  );
  const siblingList = siblings.data?.episodes ?? [];
  const siblingIndex = siblingList.findIndex((item) => item.id === ep.id);
  const prevEpisode = siblingIndex > 0 ? siblingList[siblingIndex - 1] : undefined;
  const nextEpisode =
    siblingIndex >= 0 && siblingIndex < siblingList.length - 1 ? siblingList[siblingIndex + 1] : undefined;
  const startSeconds = target.startAt ?? (resume.data?.checkpoint ? resume.data.checkpoint.positionMs / 1000 : 0);
  const ready = Boolean(detail.data) && (!needResume || !resume.loading);

  const transcript = useMemo<TranscriptItem[]>(
    () => (detail.data ? detail.data.cues.map(toTranscript) : []),
    [detail.data],
  );

  /* ---- Trình phát ---- */
  const controlsRef = useRef<PlayerControls | null>(null);
  const [time, setTime] = useState(startSeconds);
  const [playing, setPlaying] = useState(false);
  const [playerDuration, setPlayerDuration] = useState(0);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const timeRef = useRef(0);
  timeRef.current = time;
  const durationSec = playerDuration || ep.durationSeconds || (detail.data?.durationMs ?? 0) / 1000;

  const seek = useCallback((seconds: number) => {
    controlsRef.current?.seek(seconds);
    setTime(seconds);
  }, []);
  const togglePlay = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (playing) controls.pause();
    else controls.play();
  }, [playing]);

  /* ---- Câu đang phát ---- */
  const activeIndex = transcript.reduce((acc, item, i) => (time >= item.seconds ? i : acc), 0);
  const activeSub = transcript[activeIndex];

  const goPrev = useCallback(() => {
    if (!activeSub) return;
    const target = time - activeSub.seconds > 3 ? activeSub.seconds : transcript[Math.max(0, activeIndex - 1)].seconds;
    seek(target);
  }, [activeIndex, activeSub, seek, time, transcript]);
  const goNext = useCallback(() => {
    if (!transcript.length) return;
    seek(transcript[Math.min(transcript.length - 1, activeIndex + 1)].seconds);
  }, [activeIndex, seek, transcript]);

  /* ---- Trạng thái lưu câu của tập này ---- */
  useEffect(() => {
    if (!isLoggedIn || !detail.data) return;
    const controller = new AbortController();
    endpoints
      .bookmarkKeysForEpisode(ep.id, controller.signal)
      .then(({ keys }) => mergeSavedKeys(keys, `cue:${ep.id}:`))
      .catch(() => undefined);
    return () => controller.abort();
  }, [isLoggedIn, detail.data, ep.id, mergeSavedKeys]);

  /* ---- Lưu vị trí xem ~15 giây một lần, khi tạm dừng và khi rời trang ---- */
  const saveCheckpoint = useCallback((): Promise<void> => {
    if (!isLoggedIn || timeRef.current < 1) return Promise.resolve();
    return endpoints
      .saveCheckpoint(ep.id, Math.round(timeRef.current * 1000))
      .then(() => undefined, () => undefined);
  }, [ep.id, isLoggedIn]);
  useEffect(() => {
    if (!isLoggedIn || !playing) return;
    const id = window.setInterval(saveCheckpoint, 15_000);
    return () => window.clearInterval(id);
  }, [isLoggedIn, playing, saveCheckpoint]);
  useEffect(() => {
    if (!playing) saveCheckpoint();
  }, [playing, saveCheckpoint]);
  useEffect(
    () => () => {
      void saveCheckpoint().then(refreshCheckpoints);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /* ---- Tra từ ---- */
  const [dict, setDict] = useState<DictState>({ status: "idle" });
  const [activeDictId, setActiveDictId] = useState<string | null>(null);
  const [manualTerm, setManualTerm] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const lookup = useCallback(
    async (term: string, surface?: string, cue?: TranscriptItem, dictId?: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setActiveDictId(dictId ?? null);
      setDict({ status: "loading", term });
      try {
        const result = await endpoints.dictionary(term, surface, controller.signal);
        if (controller.signal.aborted) return;
        const first = result.entries[0] ?? result.kanji[0];
        if (!first) {
          setDict({ status: "empty", term });
          return;
        }
        setDict({
          status: "ready",
          entry: toWordEntry(first, { cue, episodeTitle: detail.data?.title ?? ep.title }),
          extra: Math.max(0, result.entries.length - 1),
        });
        if (isLoggedIn) {
          endpoints
            .bookmarkKeysForEntries([first.id], controller.signal)
            .then(({ keys }) => mergeSavedKeys(keys, wordKey(first.id)))
            .catch(() => undefined);
        }
      } catch (error) {
        if (controller.signal.aborted || (error as Error).name === "AbortError") return;
        setDict({ status: "error", term, error });
        if (error instanceof ApiError && error.status === 429) fail(error);
      }
    },
    [detail.data?.title, ep.title, fail, isLoggedIn, mergeSavedKeys],
  );

  const selectWord = useCallback(
    (dictId: string) => {
      const cue = transcript.find((item) => item.id === dictId.split(":")[0]);
      const word = cue?.words?.[dictId];
      if (cue && word) void lookup(word.lemma, word.surface, cue, dictId);
    },
    [lookup, transcript],
  );
  const closeDict = useCallback(() => {
    abortRef.current?.abort();
    setDict({ status: "idle" });
    setActiveDictId(null);
  }, []);

  /* ---- Phím tắt: Space phát/dừng, ←/→ đổi câu, Esc đóng hộp tra từ ---- */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (event.key === " " && tag !== "BUTTON") {
        event.preventDefault();
        togglePlay();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "Escape") {
        closeDict();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeDict, goNext, goPrev, togglePlay]);

  /* ---- Tự cuộn danh sách phụ đề tới câu đang phát ---- */
  const transcriptRef = useRef<HTMLDivElement>(null);
  const activeId = activeSub?.id;
  useEffect(() => {
    const box = transcriptRef.current;
    if (!box || !activeId) return;
    const el = box.querySelector<HTMLElement>(`#sub-${CSS.escape(activeId)}`);
    if (!el || box.scrollHeight <= box.clientHeight) return;
    box.scrollTo({ top: Math.max(0, el.offsetTop - 8), behavior: "smooth" });
  }, [activeId]);

  const { toggleCue } = state;
  const toggleCueRow = useCallback((row: TranscriptItem) => toggleCue(ep.id, row), [ep.id, toggleCue]);

  const [showFurigana, setShowFurigana] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const containerPad = isMobile ? "p-4" : "p-6";

  const header = (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => state.navigate("Library")}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-fg self-start cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kho nội dung</span>
      </button>
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-fg leading-tight">{detail.data?.title ?? ep.title}</h1>
        <p className="text-sm text-muted mt-0.5">
          {[ep.seriesTitle, ep.number > 0 ? `Tập ${ep.number}` : "Tập lẻ", ep.level].filter(Boolean).join(" · ")}
        </p>
        {(prevEpisode || nextEpisode) && (
          <div className="flex gap-2 mt-2">
            {prevEpisode && (
              <Button size="sm" variant="ghost" onClick={() => state.openEpisode(toEpisode(prevEpisode), { startAt: 0 })}>
                ← Tập trước
              </Button>
            )}
            {nextEpisode && (
              <Button size="sm" variant="ghost" onClick={() => state.openEpisode(toEpisode(nextEpisode), { startAt: 0 })}>
                Tập sau →
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  /* ---- Lỗi tải tập ---- */
  if (detail.error) {
    return (
      <div className={`${containerPad} flex flex-col gap-4`}>
        {header}
        {isUnauthorized(detail.error) ? (
          <LoginPrompt
            description="Tập này dành cho thành viên. Đăng nhập bằng Google để xem."
            onLogin={state.login}
          />
        ) : isNotFound(detail.error) ? (
          <EmptyState
            title="Tập không còn truy cập được"
            description="Tập này đã được gỡ hoặc chưa xuất bản."
            actionLabel="Về Kho nội dung"
            onAction={() => state.navigate("Library")}
          />
        ) : (
          <ErrorState error={detail.error} onRetry={detail.reload} />
        )}
      </div>
    );
  }

  const sentenceSaved = activeSub ? state.savedKeys.has(cueKey(ep.id, activeSub.id)) : false;
  const ctrlBtn =
    "w-9 h-9 rounded-full inline-flex items-center justify-center text-white hover:bg-white/15 cursor-pointer transition-colors";

  const dictionaryCard =
    dict.status === "ready" ? (
      <div className="flex flex-col gap-2">
        <DictionaryPopover
          entry={dict.entry}
          saved={state.savedKeys.has(wordKey(dict.entry.id))}
          onToggleSaveWord={state.toggleWord}
          onClose={closeDict}
        />
        {dict.extra > 0 && (
          <p className="text-xs text-muted px-1">Còn {dict.extra} mục khác — dùng ô "Tra từ" để tìm chính xác hơn.</p>
        )}
      </div>
    ) : dict.status === "loading" ? (
      <Skeleton className="h-40 w-full" />
    ) : dict.status === "empty" ? (
      <div className="p-4 rounded-[12px] bg-elevated border border-line text-sm text-muted flex items-center justify-between gap-3">
        <span>Không tìm thấy “{dict.term}” trong từ điển.</span>
        <button type="button" onClick={closeDict} className="text-brand font-medium cursor-pointer">
          Đóng
        </button>
      </div>
    ) : dict.status === "error" ? (
      <div className="p-4 rounded-[12px] bg-elevated border border-line text-sm text-muted flex items-center justify-between gap-3">
        <span>{errorMessage(dict.error)}</span>
        <button
          type="button"
          onClick={() => void lookup(dict.term)}
          className="text-brand font-medium cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    ) : null;

  const manualLookup = (
    <form
      className="flex items-center gap-2 px-3 pt-3"
      onSubmit={(event) => {
        event.preventDefault();
        const term = manualTerm.trim();
        if (term) void lookup(term);
      }}
    >
      <label className="sr-only" htmlFor="manual-lookup">
        Tra từ
      </label>
      <input
        id="manual-lookup"
        value={manualTerm}
        onChange={(event) => setManualTerm(event.target.value)}
        maxLength={80}
        placeholder="Tra từ (ví dụ 食べる)…"
        className="h-9 flex-1 min-w-0 rounded-[8px] border border-line bg-canvas px-3 text-sm text-fg placeholder:text-muted font-jp"
      />
      <Button type="submit" size="sm" variant="secondary" iconLeft={<Search className="w-4 h-4" />}>
        Tra
      </Button>
    </form>
  );

  return (
    <div className={`${containerPad} ${isMobile ? "gap-4 pb-80" : "gap-5"} flex flex-col`}>
      {header}

      <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "xl:grid-cols-[minmax(0,1fr)_400px] items-start"}`}>
        {/* Cột trái: video + phụ đề đang phát */}
        <div className="flex flex-col gap-4 min-w-0">
          <div className="rounded-[16px] bg-surface border border-line overflow-hidden">
            <div className="group relative aspect-video w-full bg-black overflow-hidden">
              {ready && detail.data ? (
                <YouTubePlayer
                  videoId={detail.data.youtubeId}
                  startSeconds={startSeconds}
                  onReady={(controls, duration) => {
                    controlsRef.current = controls;
                    if (duration) setPlayerDuration(duration);
                  }}
                  onDuration={setPlayerDuration}
                  onTime={setTime}
                  onPlayingChange={setPlaying}
                  onError={setPlayerError}
                />
              ) : (
                <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
              )}

              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Tạm dừng" : "Phát"}
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
              >
                <span
                  className={`w-16 h-16 rounded-full bg-brand text-white flex items-center justify-center shadow-lg transition-opacity ${
                    playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                  }`}
                >
                  {playing ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
                </span>
              </button>

              {playerError && (
                <p role="alert" className="absolute inset-x-0 top-0 p-3 text-xs bg-black/85 text-white">
                  {playerError}
                </p>
              )}

              <div className="absolute inset-x-0 bottom-0 px-3 pb-2 pt-10 bg-gradient-to-t from-black/85 to-transparent text-white">
                <input
                  type="range"
                  className="seek w-full cursor-pointer"
                  min={0}
                  max={durationSec || 1}
                  step={1}
                  value={Math.min(time, durationSec || 1)}
                  onChange={(event) => seek(Number(event.target.value))}
                  aria-label="Tua video"
                  aria-valuetext={`${formatTime(time)} trên ${formatTime(durationSec)}`}
                />
                <div className="flex items-center gap-1 mt-1">
                  <button type="button" className={ctrlBtn} onClick={goPrev} aria-label="Câu trước" title="Câu trước (←)">
                    <SkipBack className="w-4 h-4 fill-current" />
                  </button>
                  <button
                    type="button"
                    className={ctrlBtn}
                    onClick={togglePlay}
                    aria-label={playing ? "Tạm dừng" : "Phát"}
                    title="Phát / dừng (Phím cách)"
                  >
                    {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>
                  <button type="button" className={ctrlBtn} onClick={goNext} aria-label="Câu sau" title="Câu sau (→)">
                    <SkipForward className="w-4 h-4 fill-current" />
                  </button>
                  <span className="ml-2 text-xs font-mono">
                    {formatTime(durationSec ? Math.min(time, durationSec) : time)} /{" "}
                    {durationSec ? formatTime(durationSec) : "--:--"}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-xs font-mono text-muted">
                  {activeSub ? `Câu ${activeIndex + 1}/${transcript.length} · ${activeSub.startTime}` : "Chưa có phụ đề"}
                </span>
                <div className="flex items-center gap-4">
                  <Toggle label="Furigana" checked={showFurigana} onChange={setShowFurigana} />
                  <Toggle label="Nghĩa tiếng Việt" checked={showTranslation} onChange={setShowTranslation} />
                </div>
              </div>

              <div className="min-h-[104px] flex flex-col gap-1.5">
                {detail.loading ? (
                  <Skeleton className="h-16 w-full" />
                ) : activeSub ? (
                  <>
                    <RubyText
                      segments={activeSub.segments}
                      activeDictId={activeDictId}
                      onSelectWord={selectWord}
                      size={isMobile ? "lg" : "xl"}
                      showFurigana={showFurigana}
                    />
                    {showTranslation && activeSub.vi && <p className="text-base text-muted">{activeSub.vi}</p>}
                  </>
                ) : (
                  <p className="text-sm text-muted">Tập này chưa có phụ đề.</p>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-muted">
                  Chạm vào từ gạch chân để tra nghĩa
                  {!isMobile && " · Phím cách: phát/dừng · ← →: đổi câu"}
                </p>
                {activeSub && (
                  <Button
                    size="sm"
                    variant="secondary"
                    iconLeft={<Heart className={`w-4 h-4 ${sentenceSaved ? "fill-brand text-brand" : ""}`} />}
                    onClick={() => state.toggleCue(ep.id, activeSub)}
                  >
                    {sentenceSaved ? "Đã lưu câu" : "Lưu câu này"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {!isMobile && dictionaryCard && <div className="xl:hidden">{dictionaryCard}</div>}
        </div>

        {/* Cột phải: hộp tra từ + danh sách câu */}
        <aside
          className={`flex flex-col gap-3 min-h-0 ${isMobile ? "" : "xl:sticky xl:top-[96px] xl:h-[calc(100vh-120px)]"}`}
        >
          {!isMobile && dictionaryCard && <div className="hidden xl:block shrink-0">{dictionaryCard}</div>}
          <div className="rounded-[16px] bg-surface border border-line flex flex-col min-h-0 flex-1">
            <div className="px-4 py-3 border-b border-line flex items-center justify-between shrink-0">
              <h2 className="text-sm font-semibold text-fg">Phụ đề · {transcript.length} câu</h2>
              <span className="text-xs text-muted">Chạm câu để tua</span>
            </div>
            {manualLookup}
            <div
              ref={transcriptRef}
              className="relative flex-1 min-h-0 xl:overflow-y-auto p-3 flex flex-col gap-2"
            >
              {detail.loading ? (
                <>
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </>
              ) : (
                transcript.map((item) => (
                  <MemoRow
                    key={item.id}
                    item={item}
                    active={activeSub?.id === item.id}
                    saved={state.savedKeys.has(cueKey(ep.id, item.id))}
                    activeDictId={activeDictId}
                    onSeek={seek}
                    onToggleSaveSentence={toggleCueRow}
                    onSelectWord={selectWord}
                    showFurigana={showFurigana}
                    showTranslation={showTranslation}
                  />
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {isMobile && dictionaryCard && <div className="fixed inset-x-0 bottom-16 z-40 p-3">{dictionaryCard}</div>}
    </div>
  );
};
