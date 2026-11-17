import { Prisma } from '@prisma/client';
import { ApiProblem } from '../http';
import { Cue, RubySegment, SubtitleWord } from './input';

export const lineView = {
  orderBy: { ordinal: 'asc' },
  select: {
    cueId: true, startMs: true, endMs: true, text: true, translationVi: true, tokens: true,
    speaker: { select: { id: true, name: true, color: true, avatarUrl: true } },
  },
} satisfies Prisma.SubtitleRevision$linesArgs;

type Line = Prisma.SubtitleLineGetPayload<{ select: typeof lineView.select }>;

export function tokensView(stored: Prisma.JsonValue | null): { ruby?: RubySegment[]; words?: SubtitleWord[] } {
  const words = stored && typeof stored === 'object' && !Array.isArray(stored) && Array.isArray(stored.words)
    ? stored.words as SubtitleWord[] : undefined;
  return {
    ...(Array.isArray(stored) && { ruby: stored as RubySegment[] }),
    ...(words && { words, ruby: words.flatMap((word) => word.ruby) }),
  };
}

export function cueView(line: Line): Cue {
  return {
    id: line.cueId, startMs: line.startMs, endMs: line.endMs,
    text: line.text, translation: line.translationVi,
    ...tokensView(line.tokens),
    ...(line.speaker && { speakerId: line.speaker.id, speaker: line.speaker }),
  };
}

export async function writeLines(tx: Prisma.TransactionClient, episodeId: string, revisionId: string, cues: Cue[]) {
  const speakers = [...new Set(cues.flatMap((cue) => cue.speakerId ? [cue.speakerId] : []))];
  if (speakers.length !== await tx.speaker.count({ where: { episodeId, id: { in: speakers } } })) {
    throw new ApiProblem(400, 'INVALID_SPEAKER', 'Speakers must belong to the same episode');
  }
  await tx.subtitleCue.createMany({
    data: cues.map(({ id }) => ({ episodeId, id })), skipDuplicates: true,
  });
  await tx.subtitleLine.createMany({
    data: cues.map((cue, ordinal) => ({
      revisionId, episodeId, cueId: cue.id, speakerId: cue.speakerId, ordinal,
      startMs: cue.startMs, endMs: cue.endMs, text: cue.text, translationVi: cue.translation,
      ...(cue.words ? { tokens: { words: cue.words } } : cue.ruby ? { tokens: cue.ruby } : {}),
    })),
  });
}
