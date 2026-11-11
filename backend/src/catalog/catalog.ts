import {
  Controller, Get, Header, Headers, Injectable, Module, NotFoundException, Param, ParseUUIDPipe,
  Query, UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EpisodeVisibility, JlptLevel, Prisma } from '@prisma/client';
import { readableEpisodes } from './access';
import { Database, DatabaseModule } from '../database';
import { ApiProblem } from '../http';
import { Identity, IdentityModule } from '../identity/identity';
import { cueView, lineView } from '../subtitles/lines';
import { isUuid } from '../subtitles/input';

const pageSize = 20;

@Injectable()
class Catalog {
  constructor(private readonly db: Database, private readonly identity: Identity) {}

  series() {
    return this.db.series.findMany({
      where: { episodes: { some: readableEpisodes(true) } },
      orderBy: [{ title: 'asc' }, { slug: 'asc' }], take: 100,
      select: { id: true, slug: true, title: true, language: true, level: true, genre: true,
        channel: { select: { name: true } } },
    });
  }

  async filters() {
    const [series, standalone] = await Promise.all([
      this.db.series.findMany({
        where: { episodes: { some: readableEpisodes(true) } },
        orderBy: { id: 'asc' },
        select: { level: true, genre: true, channel: { select: { id: true, name: true } } },
      }),
      this.db.channel.findMany({
        where: { episodes: { some: { seriesId: null, ...readableEpisodes(true) } } },
        select: { id: true, name: true },
      }),
    ]);
    const genres = new Map<string, string>();
    const channels = new Map(standalone.map((channel) => [channel.id, channel]));
    for (const item of series) {
      const genre = item.genre?.trim();
      if (genre && !genres.has(genre.toLowerCase())) genres.set(genre.toLowerCase(), genre);
      if (item.channel) channels.set(item.channel.id, item.channel);
    }
    return {
      levels: Object.values(JlptLevel).filter((level) => series.some((item) => item.level === level)),
      genres: [...genres.values()].sort((left, right) => left.localeCompare(right, 'vi')),
      channels: [...channels.values()].sort((left, right) => left.name.localeCompare(right.name, 'vi')),
    };
  }

  async search(query: unknown, page: unknown, series: unknown, level: unknown, genre: unknown, channelId: unknown) {
    if ((query !== undefined && (typeof query !== 'string' || query.length > 100)) ||
        (page !== undefined && (typeof page !== 'string' || !/^[1-9]\d{0,2}$/.test(page))) ||
        (series !== undefined && (typeof series !== 'string' || series.length > 120 ||
          !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(series)))) {
      throw new ApiProblem(400, 'INVALID_SEARCH', 'Use a query up to 100 characters and page 1 to 999');
    }
    if ((level !== undefined && (typeof level !== 'string' || !Object.hasOwn(JlptLevel, level))) ||
        (genre !== undefined && (typeof genre !== 'string' || !genre.trim() || genre.trim().length > 80 || /\0/.test(genre))) ||
        (channelId !== undefined && !isUuid(channelId))) {
      throw new ApiProblem(400, 'INVALID_FILTER', 'Use a level N5 to N1, a genre up to 80 characters, or a channel UUID');
    }
    const pageNumber = page === undefined ? 1 : Number(page);
    const term = typeof query === 'string' ? query.trim().replace(/[\\%_]/g, '\\$&') : '';
    const match = { contains: term, mode: Prisma.QueryMode.insensitive };
    const rows = await this.db.episode.findMany({
      where: {
        publishedId: { not: null },
        ...((series !== undefined || level !== undefined || genre !== undefined) && { series: { is: {
          slug: typeof series === 'string' ? series : undefined,
          level: typeof level === 'string' ? level : undefined,
          genre: typeof genre === 'string' ? { equals: genre.trim(), mode: 'insensitive' } : undefined,
        } } }),
        ...(typeof channelId === 'string' && { AND: [{ OR: [
          { seriesId: null, channelId },
          { series: { is: { channelId } } },
        ] }] }),
        ...(term && { OR: [
          { title: match }, { series: { is: { title: match } } },
          { channel: { is: { name: match } } },
          { series: { is: { channel: { is: { name: match } } } } },
        ] }),
      },
      orderBy: typeof series === 'string'
        ? [{ episodeNumber: { sort: 'asc', nulls: 'last' } }, { title: 'asc' }, { id: 'asc' }]
        : [{ title: 'asc' }, { id: 'asc' }],
      skip: (pageNumber - 1) * pageSize,
      take: pageSize + 1,
      select: { id: true, title: true, visibility: true, episodeNumber: true,
        series: { select: { slug: true, title: true, channel: { select: { name: true } } } },
        channel: { select: { name: true } } },
    });
    const episodes = rows.slice(0, pageSize).map(({ series, channel, ...item }) => ({
      ...item, seriesTitle: series?.title ?? null, seriesSlug: series?.slug ?? null,
      channelName: series?.channel?.name ?? channel?.name ?? null,
    }));
    return { episodes, page: pageNumber, hasMore: rows.length > pageSize };
  }

  async published(id: string, authorization: string | undefined) {
    // Filter access before selecting content. Catalog metadata is a separate, public read.
    if (authorization !== undefined) await this.identity.requireActor(authorization);
    const episode = await this.db.episode.findFirst({
      where: { id, ...readableEpisodes(authorization !== undefined) },
      select: { id: true, title: true, youtubeId: true, published: { select: { id: true, lines: lineView } } },
    });
    if (!episode?.published) {
      if (authorization === undefined && await this.db.episode.count({
        where: { id, publishedId: { not: null }, visibility: EpisodeVisibility.MEMBER },
      })) throw new UnauthorizedException();
      throw new NotFoundException();
    }
    return { id: episode.id, title: episode.title, youtubeId: episode.youtubeId,
      revisionId: episode.published.id, cues: episode.published.lines.map(cueView) };
  }
}

@ApiTags('Catalog')
@Controller('episodes')
class CatalogController {
  constructor(private readonly catalog: Catalog) {}

  @Get()
  search(@Query('q') query: unknown, @Query('page') page: unknown, @Query('series') series: unknown,
    @Query('level') level: unknown, @Query('genre') genre: unknown, @Query('channelId') channelId: unknown) {
    return this.catalog.search(query, page, series, level, genre, channelId);
  }

  @Get('filters')
  filters() {
    return this.catalog.filters();
  }

  @Get(':episodeId')
  @Header('Cache-Control', 'private, no-store')
  published(@Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Headers('authorization') authorization?: string) {
    return this.catalog.published(episodeId, authorization);
  }
}

@ApiTags('Catalog')
@Controller('series')
class SeriesController {
  constructor(private readonly catalog: Catalog) {}

  @Get()
  series() {
    return this.catalog.series();
  }
}

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [CatalogController, SeriesController],
  providers: [Catalog],
})
export class CatalogModule {}
