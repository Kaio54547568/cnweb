import { Injectable, NotFoundException } from '@nestjs/common';
import { JlptLevel, Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { Database } from '../database';
import { ApiProblem } from '../http';
import { episodeInput, isUuid } from '../subtitles/input';

function invalid(message: string): never {
  throw new ApiProblem(400, 'INVALID_CATALOG_METADATA', message);
}

function label(value: unknown, maximum: number): string | null {
  if (value == null) return null;
  if (typeof value !== 'string' || value.trim().length > maximum) invalid('Invalid metadata text');
  return value.trim() || null;
}

function catalogLevel(value: unknown) {
  const level = label(value, 2);
  if (level && !Object.hasOwn(JlptLevel, level)) invalid('Use a level from N5 to N1');
  return level;
}

const seriesFields = { id: true, title: true, slug: true, channelId: true, level: true, genre: true } as const;

export function catalogConflict(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new ApiProblem(409, 'DUPLICATE_CATALOG_METADATA', 'That name, slug, or episode number is already in use');
  }
  throw error;
}

export async function episodeData(tx: Prisma.TransactionClient, body: unknown) {
  const input = episodeInput(body);
  let { seriesId, channelId } = input;
  if (!channelId && input.channelName) {
    const channel = await tx.channel.upsert({
      where: { name: input.channelName }, create: { name: input.channelName }, update: { name: input.channelName },
      select: { id: true },
    });
    channelId = channel.id;
  }
  const channel = channelId
    ? await tx.channel.findUnique({ where: { id: channelId }, select: { id: true, name: true } }) : null;
  if (channelId && !channel) invalid('Channel does not exist');

  let series = seriesId ? await tx.series.findUnique({
    where: { id: seriesId }, include: { channel: { select: { name: true } } },
  }) : null;
  if (seriesId && !series) invalid('Series does not exist');
  if (!series && input.seriesTitle) {
    series = await tx.series.findFirst({
      where: { title: input.seriesTitle, channelId }, orderBy: { slug: 'asc' },
      include: { channel: { select: { name: true } } },
    });
    if (!series) {
      // Compatibility with clients that still create episodes using display labels.
      const slug = 'legacy-' + createHash('sha256')
        .update(JSON.stringify([input.seriesTitle, channelId])).digest('hex').slice(0, 32);
      series = await tx.series.upsert({
        where: { slug }, create: { slug, title: input.seriesTitle, channelId },
        update: { title: input.seriesTitle },
        include: { channel: { select: { name: true } } },
      });
    }
    seriesId = series.id;
  }
  if (series && channelId && series.channelId !== channelId) {
    invalid('The episode channel must match its series');
  }
  if (!seriesId && input.episodeNumber !== null) invalid('Select a series before assigning an episode number');
  return {
    title: input.title, youtubeId: input.youtubeId, episodeNumber: input.episodeNumber, durationMs: input.durationMs,
    seriesId, channelId: seriesId ? null : channelId,
  };
}

@Injectable()
export class CatalogMetadata {
  constructor(private readonly db: Database) {}

  private async channelId(value: unknown) {
    if (value == null || value === '') return null;
    if (!isUuid(value) || !await this.db.channel.count({ where: { id: value } })) {
      invalid('Channel does not exist');
    }
    return value.toLowerCase();
  }

  channels() {
    return this.db.channel.findMany({ orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true } });
  }

  series() {
    return this.db.series.findMany({ orderBy: [{ title: 'asc' }, { id: 'asc' }],
      select: seriesFields });
  }

  async addChannel(value: unknown) {
    const name = label((value as { name?: unknown } | null)?.name, 200);
    if (!name) invalid('Channel name is required');
    try {
      return await this.db.channel.create({ data: { name }, select: { id: true, name: true } });
    } catch (error) { catalogConflict(error); }
  }

  async addSeries(value: unknown) {
    const body = value as { title?: unknown; slug?: unknown; channelId?: unknown; description?: unknown;
      language?: unknown; level?: unknown; genre?: unknown } | null;
    const title = label(body?.title, 200);
    const slug = label(body?.slug, 120);
    if (!title || !slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.startsWith('legacy-')) {
      invalid('Supply a title and a lowercase slug using letters, numbers and hyphens');
    }
    const channelId = await this.channelId(body?.channelId);
    const language = label(body?.language, 8) ?? 'ja';
    if (!/^[a-z]{2,3}$/.test(language)) invalid('Use a two- or three-letter language code');
    try {
      return await this.db.series.create({
        data: { title, slug, channelId, language, description: label(body?.description, 4000) ?? '',
          level: catalogLevel(body?.level), genre: label(body?.genre, 80) },
        select: seriesFields,
      });
    } catch (error) { catalogConflict(error); }
  }

  async updateSeries(id: string, value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || !Object.keys(value).length ||
        Object.keys(value).some((key) => !['level', 'genre', 'channelId'].includes(key))) {
      invalid('Supply level, genre or channelId');
    }
    const { level, genre, channelId } = value as Record<string, unknown>;
    try {
      return await this.db.series.update({
        where: { id },
        data: {
          level: level === undefined ? undefined : catalogLevel(level),
          genre: genre === undefined ? undefined : label(genre, 80),
          channelId: channelId === undefined ? undefined : await this.channelId(channelId),
        },
        select: seriesFields,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException();
      }
      throw error;
    }
  }

  async assignSeries(episodeId: string, value: unknown) {
    const body = value as { seriesId?: unknown; episodeNumber?: unknown; channelId?: unknown } | null;
    const seriesId = body?.seriesId || null;
    const number = body?.episodeNumber ?? null;
    if (seriesId !== null && (!isUuid(seriesId) || !await this.db.series.count({ where: { id: seriesId } }))) {
      invalid('Series does not exist');
    }
    if (number !== null && (!seriesId || typeof number !== 'number' ||
        !Number.isInteger(number) || number <= 0 || number > 2147483647)) invalid('Invalid episode number');
    const channelId = body?.channelId === undefined ? undefined : await this.channelId(body.channelId);
    if (seriesId && channelId) invalid('Episodes in a series inherit its channel');
    try {
      return await this.db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM episodes WHERE id = ${episodeId}::uuid FOR NO KEY UPDATE`;
        const episode = await tx.episode.findUnique({
          where: { id: episodeId },
          select: { channelId: true, series: { select: { channelId: true } } },
        });
        if (!episode) throw new NotFoundException();
        return tx.episode.update({
          where: { id: episodeId },
          data: { seriesId, episodeNumber: number,
            channelId: seriesId ? null : channelId === undefined
              ? episode.channelId ?? episode.series?.channelId ?? null : channelId },
          select: { id: true, seriesId: true, episodeNumber: true, channelId: true },
        });
      });
    } catch (error) { catalogConflict(error); }
  }

  speakers(episodeId: string) {
    return this.db.speaker.findMany({ where: { episodeId }, orderBy: { name: 'asc' },
      select: { id: true, name: true, color: true } });
  }

  async addSpeaker(episodeId: string, value: unknown) {
    const body = value as { name?: unknown; color?: unknown } | null;
    const name = label(body?.name, 120);
    const color = label(body?.color, 7);
    if (!name || (color && !/^#[a-f\d]{6}$/i.test(color))) invalid('Supply a name and an optional hex color');
    if (!await this.db.episode.count({ where: { id: episodeId } })) throw new NotFoundException();
    try {
      return await this.db.speaker.create({
        data: { episodeId, name, color }, select: { id: true, name: true, color: true },
      });
    } catch (error) { catalogConflict(error); }
  }
}
