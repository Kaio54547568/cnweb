import { EpisodeVisibility, Prisma } from '@prisma/client';

export function readableEpisodes(member: boolean): Prisma.EpisodeWhereInput {
  return {
    publishedId: { not: null },
    ...(member ? {} : { visibility: EpisodeVisibility.SAMPLE }),
  };
}
