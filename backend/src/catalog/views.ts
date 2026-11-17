import type { Prisma } from '@prisma/client';

export const youtubeThumbnail = (youtubeId: string) => `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;

export const episodeCardSelect = {
  id: true, title: true, youtubeId: true, visibility: true, episodeNumber: true, durationMs: true,
  level: true, genre: true,
  series: { select: { slug: true, title: true, level: true, genre: true, channel: { select: { name: true } } } },
  channel: { select: { name: true } },
} satisfies Prisma.EpisodeSelect;

type EpisodeRow = Prisma.EpisodeGetPayload<{ select: typeof episodeCardSelect }>;

/** Flat episode metadata shared by the catalog, series and learning views. */
export function episodeMeta({ youtubeId, series, channel, level, genre, ...episode }: EpisodeRow) {
  return {
    ...episode,
    thumbnailUrl: youtubeThumbnail(youtubeId),
    seriesTitle: series?.title ?? null,
    seriesSlug: series?.slug ?? null,
    channelName: series?.channel?.name ?? channel?.name ?? null,
    // Standalone episodes carry their own labels; episodes in a series inherit the series.
    level: series?.level ?? level,
    genre: series?.genre ?? genre,
  };
}
