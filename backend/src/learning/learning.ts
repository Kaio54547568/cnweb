import {
  Body, Controller, Delete, Get, Header, Headers, HttpCode, Injectable, Module,
  NotFoundException, Param, ParseUUIDPipe, Post, Put, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { readableEpisodes } from '../catalog/access';
import { Database, DatabaseModule } from '../database';
import { dictionaryEntry, dictionaryFields, entryIdPattern } from '../dictionary/dictionary';
import { ApiProblem } from '../http';
import { Identity, IdentityModule } from '../identity/identity';
import { isUuid } from '../subtitles/input';

const cueKey = (episodeId: string, cueId: string) => 'cue:' + episodeId + ':' + cueId;
const wordKey = (entryId: string) => 'word:' + entryId;
const pageSize = 25;

function bookmarkStatusFilter(query: Record<string, unknown>): Prisma.BookmarkWhereInput {
  const { episodeId, entryId } = query;
  if (Object.keys(query).length === 1) {
    if (isUuid(episodeId)) return { episodeId: episodeId.toLowerCase(), cueId: { not: null } };
    const ids: unknown[] = Array.isArray(entryId) ? entryId : [entryId];
    if (ids.length > 0 && ids.length <= 32 && ids.every((id): id is string =>
      typeof id === 'string' && entryIdPattern.test(id))) {
      return { entryId: { in: [...new Set(ids)] } };
    }
  }
  throw new ApiProblem(400, 'INVALID_BOOKMARK_STATUS', 'Supply one episode ID or up to 32 entry IDs');
}

function parseKey(key: string): string {
  if (key.startsWith('word:') && entryIdPattern.test(key.slice(5))) return key;
  const [kind, episodeId, cueId, extra] = key.split(':');
  if (kind === 'cue' && isUuid(episodeId) && isUuid(cueId) && extra === undefined) {
    return cueKey(episodeId.toLowerCase(), cueId.toLowerCase());
  }
  throw new ApiProblem(400, 'INVALID_BOOKMARK', 'Invalid bookmark key');
}

function parseBookmark(value: unknown) {
  const body = value as { episodeId?: unknown; cueId?: unknown; entryId?: unknown } | null;
  if (typeof body?.entryId === 'string' && entryIdPattern.test(body.entryId) &&
      body.episodeId === undefined && body.cueId === undefined) {
    return { key: wordKey(body.entryId), entryId: body.entryId };
  }
  if (isUuid(body?.episodeId) && isUuid(body.cueId) && body.entryId === undefined) {
    const episodeId = body.episodeId.toLowerCase();
    const cueId = body.cueId.toLowerCase();
    return { key: cueKey(episodeId, cueId), episodeId, cueId };
  }
  throw new ApiProblem(400, 'INVALID_BOOKMARK', 'Supply an entry ID or an episode and cue ID');
}

@Injectable()
export class Learning {
  constructor(private readonly db: Database, private readonly identity: Identity) {}

  async bookmarkStatus(accountId: string, query: Record<string, unknown>) {
    const rows = await this.db.bookmark.findMany({
      where: { accountId, ...bookmarkStatusFilter(query) },
      select: { key: true },
    });
    return { keys: rows.map(({ key }) => key) };
  }

  async bookmarks(accountId: string, requestedPage: unknown) {
    if (requestedPage !== undefined &&
        (typeof requestedPage !== 'string' || !/^[1-9]\d{0,3}$/.test(requestedPage))) {
      throw new ApiProblem(400, 'INVALID_PAGE', 'Use page 1 to 9999');
    }
    const page = requestedPage === undefined ? 1 : Number(requestedPage);
    const rows = await this.db.bookmark.findMany({
      where: { accountId },
      orderBy: [{ createdAt: 'desc' }, { key: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize + 1,
      select: { key: true, episodeId: true, cueId: true, entry: { select: dictionaryFields } },
    });
    const episodeIds = [...new Set(rows.flatMap((row) => row.episodeId ? [row.episodeId] : []))];
    const cueIds = [...new Set(rows.flatMap((row) => row.cueId ? [row.cueId] : []))];
    const episodes = await this.db.episode.findMany({
      where: { id: { in: episodeIds }, ...readableEpisodes(true) },
      select: { id: true, title: true, published: { select: { lines: {
        where: { cueId: { in: cueIds } },
        select: { cueId: true, startMs: true, text: true, translationVi: true },
      } } } },
    });
    const current = new Map(episodes.map((episode) => [episode.id, episode]));
    const items = rows.slice(0, pageSize).map((row) => {
      if (row.entry) return { key: row.key, kind: 'word', available: true, entry: dictionaryEntry(row.entry) };
      const episode = row.episodeId ? current.get(row.episodeId) : undefined;
      const cue = episode?.published?.lines.find((item) => item.cueId === row.cueId);
      if (!episode || !cue) return { key: row.key, kind: 'cue', available: false };
      return { key: row.key, kind: 'cue', available: true, episodeId: episode.id,
        episodeTitle: episode.title, cue: { text: cue.text, translation: cue.translationVi, startMs: cue.startMs } };
    });
    return { items, page, hasMore: rows.length > pageSize };
  }

  async save(accountId: string, body: unknown) {
    const bookmark = parseBookmark(body);
    return this.db.$transaction(async (tx) => {
      await this.identity.lockActive(tx, accountId);
      if (bookmark.episodeId) {
        if (!await tx.episode.count({ where: {
          id: bookmark.episodeId, ...readableEpisodes(true),
          published: { is: { lines: { some: { cueId: bookmark.cueId } } } },
        } })) throw new NotFoundException();
      } else if (!await tx.dictionaryEntry.count({ where: { id: bookmark.entryId } })) {
        throw new NotFoundException();
      }
      await tx.bookmark.createMany({ data: { ...bookmark, accountId }, skipDuplicates: true });
      return { key: bookmark.key };
    });
  }

  async remove(accountId: string, input: string) {
    const key = parseKey(input);
    await this.db.bookmark.deleteMany({ where: { accountId, key } });
  }

  async checkpoint(accountId: string, episodeId: string) {
    const result = await this.db.checkpoint.findFirst({
      where: { accountId, episodeId, episode: { is: readableEpisodes(true) } },
      select: { positionMs: true, updatedAt: true },
    });
    return { checkpoint: result };
  }

  async latest(accountId: string) {
    const items = await this.db.checkpoint.findMany({
      where: { accountId, episode: { is: readableEpisodes(true) } },
      orderBy: [{ updatedAt: 'desc' }, { episodeId: 'asc' }], take: 5,
      select: { episodeId: true, positionMs: true, episode: { select: { title: true } } },
    });
    return { items: items.map(({ episode, ...checkpoint }) => ({ ...checkpoint, title: episode.title })) };
  }

  async writeCheckpoint(accountId: string, episodeId: string, body: unknown) {
    const positionMs = (body as { positionMs?: unknown } | null)?.positionMs;
    if (typeof positionMs !== 'number' || !Number.isSafeInteger(positionMs) ||
        positionMs < 0 || positionMs > 24 * 3600 * 1000) {
      throw new ApiProblem(400, 'INVALID_CHECKPOINT', 'Use an integer position in milliseconds');
    }
    return this.db.$transaction(async (tx) => {
      await this.identity.lockActive(tx, accountId);
      if (!await tx.episode.count({ where: { id: episodeId, ...readableEpisodes(true) } })) {
        throw new NotFoundException();
      }
      return tx.checkpoint.upsert({
        where: { accountId_episodeId: { accountId, episodeId } },
        create: { accountId, episodeId, positionMs },
        update: { positionMs },
        select: { positionMs: true, updatedAt: true },
      });
    });
  }

  async erase(tx: Prisma.TransactionClient, accountId: string) {
    await tx.bookmark.deleteMany({ where: { accountId } });
    await tx.checkpoint.deleteMany({ where: { accountId } });
  }
}

@ApiTags('Learning')
@ApiBearerAuth()
@Controller('learning')
class LearningController {
  constructor(private readonly learning: Learning, private readonly identity: Identity) {}

  @Get('bookmarks')
  @Header('Cache-Control', 'private, no-store')
  async bookmarks(@Headers('authorization') auth: string | undefined, @Query('page') page: unknown) {
    return this.learning.bookmarks((await this.identity.requireActor(auth)).id, page);
  }

  @Get('bookmarks/status')
  @Header('Cache-Control', 'private, no-store')
  async bookmarkStatus(@Headers('authorization') auth: string | undefined, @Query() query: Record<string, unknown>) {
    return this.learning.bookmarkStatus((await this.identity.requireActor(auth)).id, query);
  }

  @Post('bookmarks')
  @HttpCode(200)
  async save(@Headers('authorization') auth: string | undefined, @Body() body: unknown) {
    return this.learning.save((await this.identity.requireActor(auth)).id, body);
  }

  @Delete('bookmarks/:key')
  @HttpCode(204)
  async remove(@Headers('authorization') auth: string | undefined, @Param('key') key: string) {
    await this.learning.remove((await this.identity.requireActor(auth)).id, key);
  }

  @Get('checkpoints')
  @Header('Cache-Control', 'private, no-store')
  async latest(@Headers('authorization') auth: string | undefined) {
    return this.learning.latest((await this.identity.requireActor(auth)).id);
  }

  @Get('checkpoints/:episodeId')
  @Header('Cache-Control', 'private, no-store')
  async checkpoint(@Headers('authorization') auth: string | undefined,
    @Param('episodeId', ParseUUIDPipe) id: string) {
    return this.learning.checkpoint((await this.identity.requireActor(auth)).id, id);
  }

  @Put('checkpoints/:episodeId')
  async writeCheckpoint(@Headers('authorization') auth: string | undefined,
    @Param('episodeId', ParseUUIDPipe) id: string, @Body() body: unknown) {
    return this.learning.writeCheckpoint((await this.identity.requireActor(auth)).id, id, body);
  }
}

@Module({
  imports: [DatabaseModule, IdentityModule],
  controllers: [LearningController],
  providers: [Learning],
  exports: [Learning],
})
export class LearningModule {}
