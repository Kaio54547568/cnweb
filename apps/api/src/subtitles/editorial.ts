import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EpisodeVisibility, NlpStatus, Prisma } from '@prisma/client';
import { catalogConflict, episodeData } from '../catalog/metadata';
import { Database } from '../database';
import { ApiProblem } from '../http';
import { assignCueIds, importInput, publicationInput } from './input';
import { cueView, lineView, writeLines } from './lines';

function draftConflict(): never {
  throw new ApiProblem(409, 'REVISION_CONFLICT', 'Reload the current draft and try again');
}

@Injectable()
export class Editorial {
  private readonly logger = new Logger(Editorial.name);

  constructor(private readonly db: Database) {}

  async createEpisode(body: unknown, authorId: string, requestId: string) {
    const episode = await this.db.$transaction(async (tx) => tx.episode.create({
      data: await episodeData(tx, body),
      select: { id: true, title: true, youtubeId: true, visibility: true, seriesId: true, episodeNumber: true, channelId: true },
    })).catch(catalogConflict);
    this.logger.log({ service: 'api', operation: 'episode_created', episodeId: episode.id, authorId, requestId });
    return episode;
  }

  async list(query: unknown, page: unknown) {
    if ((query !== undefined && (typeof query !== 'string' || query.length > 200 || query.includes('\0'))) ||
        (page !== undefined && (typeof page !== 'string' || !/^[1-9]\d{0,3}$/.test(page)))) {
      throw new ApiProblem(400, 'INVALID_SEARCH', 'Use a title query up to 200 characters and page 1 to 9999');
    }
    const paginated = query !== undefined || page !== undefined;
    const pageNumber = page === undefined ? 1 : Number(page);
    const pageSize = 25;
    const term = typeof query === 'string' ? query.trim().replace(/[\\%_]/g, '\\$&') : '';
    const rows = await this.db.episode.findMany({
      ...(term && { where: { title: { contains: term, mode: Prisma.QueryMode.insensitive } } }),
      orderBy: [{ title: 'asc' }, { id: 'asc' }],
      skip: paginated ? (pageNumber - 1) * pageSize : 0,
      take: paginated ? pageSize + 1 : 100,
      select: { id: true, title: true, visibility: true, publishedId: true, seriesId: true, episodeNumber: true, channelId: true },
    });
    return paginated ? { episodes: rows.slice(0, pageSize), page: pageNumber, hasMore: rows.length > pageSize } : rows;
  }

  async setVisibility(episodeId: string, body: unknown, authorId: string, requestId: string) {
    const visibility = (body as { visibility?: unknown } | null)?.visibility;
    if (visibility !== EpisodeVisibility.SAMPLE && visibility !== EpisodeVisibility.MEMBER) {
      throw new ApiProblem(400, 'INVALID_VISIBILITY', 'Use visibility SAMPLE or MEMBER');
    }
    const update = await this.db.episode.updateMany({
      where: { id: episodeId }, data: { visibility },
    });
    if (!update.count) throw new NotFoundException();
    this.logger.log({ service: 'api', operation: 'episode_visibility_changed', episodeId, visibility,
      authorId, requestId });
    return { id: episodeId, visibility };
  }

  async unpublish(episodeId: string, authorId: string, requestId: string) {
    const update = await this.db.episode.updateMany({
      where: { id: episodeId }, data: { publishedId: null },
    });
    if (!update.count) throw new NotFoundException();
    this.logger.log({ service: 'api', operation: 'episode_unpublished', episodeId, authorId, requestId });
  }

  async draft(episodeId: string) {
    const episode = await this.db.episode.findUnique({
      where: { id: episodeId },
      select: { draft: { select: { id: true, nlpStatus: true, requestId: true, lines: lineView } } },
    });
    if (!episode?.draft) throw new NotFoundException();
    const { id, nlpStatus, lines, requestId } = episode.draft;
    return { id, nlpStatus, cues: lines.map(cueView), requestId };
  }

  async replaceDraft(episodeId: string, body: unknown, requestId: string, authorId: string) {
    const input = importInput(body);
    const revision = await this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM episodes WHERE id = ${episodeId}::uuid FOR NO KEY UPDATE`;
      const episode = await tx.episode.findUnique({
        where: { id: episodeId },
        select: { draftId: true, draft: { select: { lines: { select: { cueId: true } } } } },
      });
      if (!episode) throw new NotFoundException();
      if (episode.draftId !== input.expectedDraftId) draftConflict();

      const cues = assignCueIds(input.cues, episode.draft?.lines.map(({ cueId }) => ({ id: cueId })) ?? []);
      const draft = await tx.subtitleRevision.create({
        data: { episodeId, requestId, authorId },
        select: { id: true, nlpStatus: true, requestId: true },
      });
      const update = await tx.episode.updateMany({
        where: { id: episodeId, draftId: input.expectedDraftId },
        data: { draftId: draft.id },
      });
      if (!update.count) draftConflict();
      await writeLines(tx, episodeId, draft.id, cues);
      if (episode.draftId) {
        await tx.subtitleRevision.updateMany({
          where: { id: episode.draftId, nlpStatus: NlpStatus.PENDING },
          data: { nlpStatus: NlpStatus.SUPERSEDED },
        });
      }
      return draft;
    });
    this.logger.log({ service: 'api', operation: 'draft_imported', episodeId,
      revisionId: revision.id, requestId, authorId });
    return revision;
  }

  async publish(episodeId: string, body: unknown, requestId: string, authorId: string) {
    const draftId = publicationInput(body);
    const publication = await this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM episodes WHERE id = ${episodeId}::uuid FOR NO KEY UPDATE`;
      const episode = await tx.episode.findUnique({
        where: { id: episodeId },
        select: { draftId: true, publishedId: true,
          published: { select: { id: true, sourceDraftId: true, nlpStatus: true } } },
      });
      if (!episode) throw new NotFoundException();
      if (episode.draftId !== draftId) draftConflict();

      // Copy the rows and NLP status from the same version, even when the worker completes concurrently.
      await tx.$queryRaw`SELECT id FROM subtitle_revisions WHERE id = ${draftId}::uuid FOR UPDATE`;
      const draft = await tx.subtitleRevision.findUniqueOrThrow({
        where: { id: draftId }, select: { nlpStatus: true, lines: lineView },
      });
      const cues = draft.lines.map(cueView);
      if (!cues.length) throw new ApiProblem(422, 'EMPTY_TRANSCRIPT', 'Import a transcript before publishing');
      if (cues.some((cue) => !cue.translation)) {
        throw new ApiProblem(422, 'TRANSLATION_REQUIRED', 'Every cue needs a reviewed translation');
      }
      if (episode.published?.sourceDraftId === draftId &&
          episode.published.nlpStatus === draft.nlpStatus) {
        return episode.published;
      }
      const revision = await tx.subtitleRevision.create({
        data: { episodeId, sourceDraftId: draftId,
          requestId, authorId, nlpStatus: draft.nlpStatus },
      });
      await writeLines(tx, episodeId, revision.id, cues);
      const update = await tx.episode.updateMany({
        where: { id: episodeId, draftId, publishedId: episode.publishedId },
        data: { publishedId: revision.id },
      });
      if (!update.count) draftConflict();
      return revision;
    });
    this.logger.log({ service: 'api', operation: 'revision_published', episodeId,
      revisionId: publication.id, requestId, authorId });
    return { id: publication.id, draftId, nlpStatus: publication.nlpStatus };
  }

}
