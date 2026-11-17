import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Button, EmptyState, SavedSentenceCard, SavedWordCard, Tab } from "../components/DesignSystem";
import type { AppState } from "../components/appState";
import type { TranscriptItem } from "../data/mockData";
import { ApiBookmarkItem, endpoints } from "../lib/api";
import { formatTime, stubEpisode, toWordEntry } from "../lib/mappers";
import { ErrorState, GridSkeleton, LoginPrompt } from "./common";

export const NotebookScreen: React.FC<{ state: AppState; isMobile: boolean }> = ({ state, isMobile }) => {
  const [tab, setTab] = useState<"words" | "sentences">("words");
  const [items, setItems] = useState<ApiBookmarkItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [tick, setTick] = useState(0);
  const { isLoggedIn, mergeSavedKeys, authStatus } = state;

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(authStatus === "loading");
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    endpoints
      .bookmarks(page, controller.signal)
      .then((result) => {
        setItems((previous) => (page === 1 ? result.items : [...previous, ...result.items]));
        setHasMore(result.hasMore);
        setLoading(false);
        mergeSavedKeys(result.items.map((item) => item.key));
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err);
        setLoading(false);
      });
    return () => controller.abort();
  }, [isLoggedIn, authStatus, page, tick, mergeSavedKeys]);

  const remove = async (key: string) => {
    try {
      await endpoints.removeBookmark(key);
      setItems((previous) => previous.filter((item) => item.key !== key));
      state.markSaved(key, false);
      state.notify("Đã xóa khỏi Sổ tay");
    } catch (err) {
      state.fail(err);
    }
  };

  const words = items.filter((item) => item.kind === "word");
  const sentences = items.filter((item) => item.kind === "cue");
  const containerPad = isMobile ? "p-4" : "p-6";
  const wrapper = `${containerPad} ${isMobile ? "gap-5" : "gap-6"} flex flex-col w-full max-w-[1280px] mx-auto`;

  if (!isLoggedIn) {
    return (
      <div className={wrapper}>
        <h1 className="text-2xl font-bold text-fg">Sổ tay</h1>
        {authStatus === "loading" ? (
          <GridSkeleton count={3} />
        ) : (
          <LoginPrompt description="Đăng nhập bằng Google để xem từ vựng và câu bạn đã lưu." onLogin={state.login} />
        )}
      </div>
    );
  }

  return (
    <div className={wrapper}>
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">Sổ tay</h1>
          <p className="text-sm text-muted">Những gì bạn đã lưu khi xem video</p>
        </div>
        <Tab
          tabs={[
            { id: "words", label: "Từ vựng", count: words.length },
            { id: "sentences", label: "Câu", count: sentences.length },
          ]}
          activeId={tab}
          onChange={(id) => setTab(id as "words" | "sentences")}
        />
      </header>

      {error ? (
        <ErrorState
          error={error}
          onRetry={() => {
            setPage(1);
            setTick((t) => t + 1);
          }}
        />
      ) : loading && items.length === 0 ? (
        <GridSkeleton count={3} itemClassName="h-40 w-full" />
      ) : (
        <>
          {tab === "words" &&
            (words.length === 0 ? (
              <EmptyState
                title="Chưa có từ vựng nào"
                description="Khi xem video, chạm vào từ gạch chân rồi bấm trái tim để lưu."
                actionLabel="Mở Kho nội dung"
                onAction={() => state.navigate("Library")}
              />
            ) : (
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"}`}>
                {words.map(
                  (item) =>
                    item.kind === "word" && (
                      <SavedWordCard key={item.key} entry={toWordEntry(item.entry)} onRemove={() => remove(item.key)} />
                    ),
                )}
              </div>
            ))}

          {tab === "sentences" &&
            (sentences.length === 0 ? (
              <EmptyState
                title="Chưa có câu nào"
                description="Bấm “Lưu câu này” hoặc trái tim ở dòng phụ đề khi xem video."
                actionLabel="Mở Kho nội dung"
                onAction={() => state.navigate("Library")}
              />
            ) : (
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
                {sentences.map((item) => {
                  if (item.kind !== "cue") return null;
                  if (!item.available) {
                    return (
                      <div
                        key={item.key}
                        className="p-4 rounded-[12px] bg-surface border border-line flex items-center justify-between gap-3"
                      >
                        <p className="text-sm text-muted">
                          Câu này không còn xem được (tập đã gỡ hoặc phụ đề đã thay đổi).
                        </p>
                        <Button size="sm" variant="ghost" onClick={() => remove(item.key)}>
                          Xóa
                        </Button>
                      </div>
                    );
                  }
                  const seconds = item.cue.startMs / 1000;
                  const sentence: TranscriptItem = {
                    id: item.key,
                    startTime: formatTime(seconds),
                    seconds,
                    endSeconds: seconds,
                    speaker: "",
                    segments: [{ kanji: item.cue.text }],
                    jpPlain: item.cue.text,
                    readingPlain: "",
                    vi: item.cue.translation ?? "",
                  };
                  return (
                    <SavedSentenceCard
                      key={item.key}
                      sentence={sentence}
                      episodeTitle={item.episodeTitle}
                      onRemove={() => remove(item.key)}
                      onWatchSentence={(sec) =>
                        state.openEpisode(stubEpisode(item.episodeId, item.episodeTitle), { startAt: sec })
                      }
                    />
                  );
                })}
              </div>
            ))}

          {hasMore && (
            <div>
              <Button variant="secondary" size="md" disabled={loading} onClick={() => setPage((p) => p + 1)}>
                {loading ? "Đang tải…" : "Tải thêm"}
              </Button>
            </div>
          )}
        </>
      )}
      <p className="text-xs text-muted flex items-center gap-1.5">
        <Heart className="w-3.5 h-3.5" /> Bỏ lưu sẽ xóa mục khỏi Sổ tay ở mọi thiết bị.
      </p>
    </div>
  );
};
