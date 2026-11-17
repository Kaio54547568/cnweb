import React, { useMemo } from "react";
import { ArrowRight, Play } from "lucide-react";
import {
  Button,
  ContentCard,
  EmptyState,
  EpisodeRow,
  ProgressBar,
  RubyText,
  Thumb,
} from "../components/DesignSystem";
import type { AppState } from "../components/appState";
import { endpoints } from "../lib/api";
import { useAsync } from "../lib/hooks";
import { formatTime, stubEpisode, toEpisode, toSeries, toTranscript, youtubeThumbnail } from "../lib/mappers";
import { ErrorState, GridSkeleton } from "./common";

export const HomeScreen: React.FC<{ state: AppState; isMobile: boolean }> = ({ state, isMobile }) => {
  const series = useAsync((signal) => endpoints.series(signal), []);
  const recent = useAsync((signal) => endpoints.episodes(new URLSearchParams({ page: "1" }), signal), []);
  const seriesMap = useMemo(() => new Map((series.data ?? []).map((item) => [item.slug, item])), [series.data]);

  const checkpoint = state.checkpoints[0];
  const focus = useMemo(() => {
    if (checkpoint) {
      const found = recent.data?.episodes.find((item) => item.id === checkpoint.episodeId);
      const seconds = checkpoint.positionMs / 1000;
      return found ? toEpisode(found, seriesMap, seconds) : stubEpisode(checkpoint.episodeId, checkpoint.title, seconds);
    }
    const pick = recent.data?.episodes.find((item) => state.isLoggedIn || item.visibility === "SAMPLE");
    return pick ? toEpisode(pick, seriesMap) : null;
  }, [checkpoint, recent.data, seriesMap, state.isLoggedIn]);

  const detail = useAsync((signal) => endpoints.episode(focus!.id, signal), [focus?.id], Boolean(focus));
  const sampleCue = detail.data?.cues.find((cue) => cue.translation) ?? detail.data?.cues[0];
  const sample = sampleCue ? toTranscript(sampleCue) : null;
  const thumbnail = focus?.thumbnail || (detail.data ? youtubeThumbnail(detail.data.youtubeId) : "");
  const resumeSeconds = focus?.lastWatchedSecond ?? 0;
  const containerPad = isMobile ? "p-4" : "p-6";

  const inProgress = state.checkpoints.slice(1).map((cp) => {
    const found = recent.data?.episodes.find((item) => item.id === cp.episodeId);
    const seconds = cp.positionMs / 1000;
    return found ? toEpisode(found, seriesMap, seconds) : stubEpisode(cp.episodeId, cp.title, seconds);
  });

  const hero = focus ? (
    <section
      aria-labelledby="continue-title"
      className={`grid gap-6 items-center ${isMobile ? "grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]"}`}
    >
      <div className="flex flex-col gap-4 order-last lg:order-first">
        <p className="text-sm text-muted">
          {resumeSeconds > 0 ? "Tiếp tục học" : "Bắt đầu học"}
          {focus.seriesTitle ? ` · ${focus.seriesTitle}` : ""}
        </p>
        <h1 id="continue-title" className="text-2xl md:text-3xl font-bold text-fg leading-tight">
          {focus.number > 0 ? `Tập ${focus.number}: ` : ""}
          {focus.title}
        </h1>

        {sample && (
          <figure className="border-l-2 border-brand pl-4 flex flex-col gap-1">
            <RubyText
              segments={sample.segments.map((s) => ({ kanji: s.kanji, furigana: s.furigana }))}
              size={isMobile ? "md" : "lg"}
            />
            {sample.vi && <figcaption className="text-sm text-muted">{sample.vi}</figcaption>}
          </figure>
        )}

        {focus.progressPercent > 0 && (
          <div className="max-w-md">
            <ProgressBar
              percent={focus.progressPercent}
              label={`${formatTime(resumeSeconds)} / ${focus.duration}`}
              showValue
            />
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="primary"
            size="lg"
            iconLeft={<Play className="w-4 h-4 fill-current" />}
            onClick={() => state.openEpisode(focus, { startAt: resumeSeconds > 0 ? resumeSeconds : undefined })}
          >
            {resumeSeconds > 0 ? `Xem tiếp từ ${formatTime(resumeSeconds)}` : "Xem ngay"}
          </Button>
          {resumeSeconds > 0 && (
            <Button variant="ghost" size="lg" onClick={() => state.openEpisode(focus, { startAt: 0 })}>
              Xem từ đầu
            </Button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => state.openEpisode(focus, { startAt: resumeSeconds > 0 ? resumeSeconds : undefined })}
        aria-label={`Xem tập ${focus.title}`}
        className="group relative block aspect-video w-full overflow-hidden rounded-[16px] border border-line bg-canvas cursor-pointer"
      >
        <Thumb src={thumbnail} />
        <span className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
          <span className="w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </span>
        </span>
        {focus.duration && (
          <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-[8px] bg-black/70 text-white text-xs font-mono">
            {focus.duration}
          </span>
        )}
      </button>
    </section>
  ) : recent.loading ? (
    <GridSkeleton count={1} className="grid grid-cols-1" itemClassName="h-56 w-full" />
  ) : recent.error ? (
    <ErrorState error={recent.error} onRetry={recent.reload} />
  ) : (
    <EmptyState
      title="Chưa có tập nào"
      description="Nội dung đang được biên tập. Vui lòng quay lại sau."
    />
  );

  return (
    <div className={`${containerPad} ${isMobile ? "gap-8" : "gap-10"} flex flex-col w-full max-w-[1280px] mx-auto`}>
      {hero}

      {!state.isLoggedIn && state.authStatus !== "loading" && (
        <div className="p-4 rounded-[12px] bg-surface border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Đăng nhập bằng Google để lưu từ vựng, câu phụ đề và tiến độ xem, học tiếp trên mọi thiết bị.
          </p>
          <Button variant="primary" size="md" onClick={state.login}>
            Đăng nhập bằng Google
          </Button>
        </div>
      )}

      <section className="flex flex-col gap-4" aria-labelledby="series-title">
        <div className="flex items-end justify-between gap-3">
          <h2 id="series-title" className="text-lg font-bold text-fg">
            Khám phá series
          </h2>
          <button
            type="button"
            onClick={() => {
              state.setSeriesFilter(null);
              state.navigate("Library");
            }}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-fg cursor-pointer"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {series.loading ? (
          <GridSkeleton />
        ) : series.error ? (
          <ErrorState error={series.error} onRetry={series.reload} />
        ) : series.data && series.data.length > 0 ? (
          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"}`}>
            {series.data.slice(0, 8).map((item) => (
              <ContentCard
                key={item.id}
                series={toSeries(item)}
                onWatch={(chosen) => {
                  state.setSeriesFilter(chosen.slug ?? null);
                  state.navigate("Library");
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="Chưa có series nào" description="Series sẽ xuất hiện khi có tập được xuất bản." />
        )}
      </section>

      {inProgress.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="progress-title">
          <h2 id="progress-title" className="text-lg font-bold text-fg">
            Đang học dở
          </h2>
          <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
            {inProgress.map((episode) => (
              <EpisodeRow
                key={episode.id}
                episode={episode}
                onWatch={(chosen) => state.openEpisode(chosen, { startAt: chosen.lastWatchedSecond })}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
