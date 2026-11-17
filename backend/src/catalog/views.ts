import type { Prisma } from '@prisma/client';

export const youtubeThumbnail = (youtubeId: string) => `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;

export const episodeCardSelect = {
  id: true, title: true, youtubeId: true, visibility: true, episodeNumber: true, durationMs: true,
  series: { select: { slug: true, title: true, level: true, channel: { select: { name: true } } } },
  channel: { select: { name: true } },
} satisfies Prisma.EpisodeSelect;

type EpisodeRow = Prisma.EpisodeGetPayload<{ select: typeof episodeCardSelect }>;

/** Flat episode metadata shared by the catalog, series and learning views. */
export function episodeMeta({ youtubeId, series, channel, ...episode }: EpisodeRow) {
  return {
    ...episode,
    thumbnailUrl: youtubeThumbnail(youtubeId),
    seriesTitle: series?.title ?? null,
    seriesSlug: series?.slug ?? null,
    channelName: series?.channel?.name ?? channel?.name ?? null,
    level: series?.level ?? null,
  };
}
