import React, { useEffect, useMemo, useState } from "react";
import { Button, ContentCard, EmptyState, EpisodeRow, FilterChip } from "../components/DesignSystem";
import type { AppState } from "../components/appState";
import { ApiEpisode, endpoints } from "../lib/api";
import { useAsync, useDebounced } from "../lib/hooks";
import { toEpisode, toSeries } from "../lib/mappers";
import { ErrorState, GridSkeleton } from "./common";

const LEVELS = ["ALL", "N5", "N4", "N3", "N2", "N1"] as const;

export const LibraryScreen: React.FC<{ state: AppState; isMobile: boolean }> = ({ state, isMobile }) => {
  const query = useDebounced(state.searchQuery.trim(), 300);
  const level = state.levelFilter;
  const seriesSlug = state.seriesFilter;

  const series = useAsync((signal) => endpoints.series(signal), []);
  const seriesMap = useMemo(() => new Map((series.data ?? []).map((item) => [item.slug, item])), [series.data]);

  /* ---- Danh sách tập: lọc ở server, phân trang "Tải thêm" ---- */
  const paramsKey = JSON.stringify([query, level, seriesSlug]);
  const [pageState, setPageState] = useState({ key: "", page: 1 });
  const page = pageState.key === paramsKey ? pageState.page : 1;
  const [items, setItems] = useState<ApiEpisode[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page) });
    if (query) params.set("q", query);
    if (level !== "ALL") params.set("level", level);
    if (seriesSlug) params.set("series", seriesSlug);
    endpoints
      .episodes(params, controller.signal)
      .then((result) => {
        setItems((previous) => (page === 1 ? result.episodes : [...previous, ...result.episodes]));
        setHasMore(result.hasMore);
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err);
        setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, page, tick]);

  const resumeById = useMemo(
    () => new Map(state.checkpoints.map((cp) => [cp.episodeId, cp.positionMs / 1000])),
    [state.checkpoints],
  );
  const episodes = items.map((item) => toEpisode(item, seriesMap, resumeById.get(item.id) ?? 0));

  const needle = query.toLowerCase();
  const filteredSeries = (series.data ?? []).filter((item) => {
    const matchLevel = level === "ALL" || item.level === level;
    const matchQuery =
      !needle ||
      item.title.toLowerCase().includes(needle) ||
      (item.genre ?? "").toLowerCase().includes(needle) ||
      (item.channel?.name ?? "").toLowerCase().includes(needle);
    return matchLevel && matchQuery;
  });
  const selectedSeries = seriesSlug ? seriesMap.get(seriesSlug) : undefined;
  const hasFilter = level !== "ALL" || query !== "" || seriesSlug !== null;
  const clearFilters = () => {
    state.setLevelFilter("ALL");
    state.setSearchQuery("");
    state.setSeriesFilter(null);
  };
  const containerPad = isMobile ? "p-4" : "p-6";

  return (
    <div className={`${containerPad} ${isMobile ? "gap-5" : "gap-6"} flex flex-col w-full max-w-[1280px] mx-auto`}>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-fg">Kho nội dung</h1>
        <p className="text-sm text-muted" aria-live="polite">
          {query
            ? `${filteredSeries.length} series và ${episodes.length}${hasMore ? "+" : ""} tập cho “${query}”`
            : "Video Nhật – Việt có phụ đề đồng bộ, furigana và tra từ"}
        </p>
      </header>

      <div className="flex items-center gap-2 flex-wrap">
        {LEVELS.map((lvl) => {
          const count =
            lvl === "ALL" ? series.data?.length : series.data?.filter((item) => item.level === lvl).length;
          return (
            <FilterChip
              key={lvl}
              label={`${lvl === "ALL" ? "Tất cả" : lvl}${count !== undefined ? ` (${count})` : ""}`}
              selected={level === lvl}
              onClick={() => state.setLevelFilter(lvl)}
            />
          );
        })}
        {hasFilter && (
          <Button size="sm" variant="ghost" onClick={clearFilters}>
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* ---- Series ---- */}
      <section className="flex flex-col gap-3" aria-labelledby="series-heading">
        <h2 id="series-heading" className="text-lg font-bold text-fg">
          Series
        </h2>
        {series.loading ? (
          <GridSkeleton />
        ) : series.error ? (
          <ErrorState error={series.error} onRetry={series.reload} />
        ) : filteredSeries.length === 0 ? (
          <EmptyState
            title="Không có series phù hợp"
            description="Thử chọn trình độ khác hoặc tìm bằng từ khóa ngắn hơn."
            actionLabel="Xóa bộ lọc"
            onAction={clearFilters}
          />
        ) : (
          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"}`}>
            {filteredSeries.map((item) => (
              <ContentCard
                key={item.id}
                series={toSeries(item)}
                onWatch={(chosen) => state.setSeriesFilter(chosen.slug ?? null)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ---- Tập ---- */}
      <section className="flex flex-col gap-3 pt-2" aria-labelledby="episodes-title">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 id="episodes-title" className="text-lg font-bold text-fg">
            {selectedSeries ? `Các tập: ${selectedSeries.title}` : hasFilter ? "Kết quả" : "Tất cả tập"}
          </h2>
          {seriesSlug && (
            <Button size="sm" variant="ghost" onClick={() => state.setSeriesFilter(null)}>
              Bỏ lọc series
            </Button>
          )}
        </div>

        {error ? (
          <ErrorState error={error} onRetry={() => setTick((t) => t + 1)} />
        ) : loading && episodes.length === 0 ? (
          <GridSkeleton count={4} className="flex flex-col gap-2.5" itemClassName="h-20 w-full" />
        ) : episodes.length === 0 ? (
          <EmptyState
            title="Không tìm thấy tập"
            description="Thử đổi bộ lọc hoặc dùng từ khóa ngắn hơn."
            actionLabel={hasFilter ? "Xóa bộ lọc" : undefined}
            onAction={hasFilter ? clearFilters : undefined}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {episodes.map((episode) => (
              <EpisodeRow
                key={episode.id}
                episode={episode}
                active={state.watch?.episode.id === episode.id}
                onWatch={(chosen) =>
                  state.openEpisode(chosen, {
                    startAt: chosen.lastWatchedSecond > 0 ? chosen.lastWatchedSecond : undefined,
                  })
                }
              />
            ))}
            {hasMore && (
              <div className="pt-1">
                <Button
                  variant="secondary"
                  size="md"
                  disabled={loading}
                  onClick={() => setPageState({ key: paramsKey, page: page + 1 })}
                >
                  {loading ? "Đang tải…" : "Tải thêm"}
                </Button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
