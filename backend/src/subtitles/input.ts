import { randomUUID } from 'node:crypto';
import { ApiProblem } from '../http';

export type RubySegment = [surface: string, reading: string | null];
export type SubtitleWord = {
  surface: string;
  lemma: string | null;
  reading: string | null;
  ruby: RubySegment[];
};

export type Cue = {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  translation: string;
  ruby?: RubySegment[];
  words?: SubtitleWord[];
  speakerId?: string;
  speaker?: { id: string; name: string; color: string | null; avatarUrl: string | null };
};

type IncomingCue = Omit<Cue, 'id' | 'ruby' | 'words' | 'speaker'> & { id?: string };

const uuidPattern = /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;
export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && uuidPattern.test(value);

function invalid(message: string): never {
  throw new ApiProblem(400, 'INVALID_SUBTITLES', message);
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('Expected an object');
  return value as Record<string, unknown>;
}

function timestamp(value: string, format: 'srt' | 'vtt'): number {
  const pattern = format === 'srt' ? /^(\d{2,}):([0-5]\d):([0-5]\d),(\d{3})$/
    : /^(?:(\d{2,}):)?([0-5]\d):([0-5]\d)\.(\d{3})$/;
  const match = pattern.exec(value);
  if (!match) invalid('Invalid subtitle timestamp');
  const [, hours, minutes, seconds, fraction] = match;
  return (Number(hours ?? 0) * 3600 + Number(minutes) * 60 + Number(seconds)) * 1000
    + Number(fraction);
}

function plainText(value: string): string {
  const entities: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', lrm: '\u200e', rlm: '\u200f',
  };
  return value.replace(/<\/?(?:b|i|u|c|v|lang|font|ruby)(?:[.\s][^<>]*)?>|<\d[\d:.]+>/gi, '')
    .replace(/<rt>[^<>]*<\/rt>/gi, '')
    .replace(/&(amp|lt|gt|quot|apos|nbsp|lrm|rlm);/g, (_, key: string) => entities[key])
    .trim();
}

function textCues(content: string, format: 'srt' | 'vtt'): IncomingCue[] {
  let normalized = content.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  if (format === 'vtt') {
    if (!/^WEBVTT(?:[ \t][^\n]*)?(?:\n|$)/.test(normalized)) invalid('Missing WEBVTT header');
    const headerEnd = /\n[ \t]*\n/.exec(normalized);
    normalized = headerEnd ? normalized.slice(headerEnd.index + headerEnd[0].length) : '';
  }
  const cues: IncomingCue[] = [];
  for (const block of normalized.split(/\n[ \t]*\n+/)) {
    if (!block.trim() || (format === 'vtt' && /^(?:NOTE|STYLE|REGION)(?:\s|$)/.test(block))) continue;
    const lines = block.split('\n');
    const timingIndex = lines[0].includes('-->') ? 0 : 1;
    const timing = /^(\S+)\s+-->\s+(\S+)(?:[ \t]+.*)?$/.exec(lines[timingIndex]?.trim() ?? '');
    if (!timing) invalid('A subtitle block has no valid timing line');
    cues.push({
      startMs: timestamp(timing[1], format), endMs: timestamp(timing[2], format),
      text: plainText(lines.slice(timingIndex + 1).join('\n')), translation: '',
    });
  }
  return cues;
}

function parseCue(value: unknown): IncomingCue {
  const cue = record(value);
  if (cue.id !== undefined && !isUuid(cue.id)) invalid('Invalid cue ID');
  if (cue.speakerId != null && !isUuid(cue.speakerId)) invalid('Invalid speaker ID');
  if (!Number.isSafeInteger(cue.startMs) || !Number.isSafeInteger(cue.endMs)) {
    invalid('Cue timing must use integer milliseconds');
  }
  if (typeof cue.text !== 'string' ||
      (cue.translation !== undefined && typeof cue.translation !== 'string')) {
    invalid('Cue text and translation must be strings');
  }
  return {
    id: typeof cue.id === 'string' ? cue.id.toLowerCase() : undefined,
    startMs: cue.startMs as number, endMs: cue.endMs as number,
    text: cue.text.trim(), translation: (cue.translation ?? '').trim(),
    speakerId: typeof cue.speakerId === 'string' ? cue.speakerId.toLowerCase() : undefined,
  };
}

function validateCues(cues: IncomingCue[]): IncomingCue[] {
  if (!cues.length || cues.length > 2000) invalid('Expected 1 to 2000 cues');
  for (const cue of cues) {
    if (cue.startMs < 0 || cue.endMs <= cue.startMs || cue.endMs > 24 * 3600 * 1000) {
      invalid('Cue timing must fall within the first 24 hours and have positive duration');
    }
    if (!cue.text || cue.text.length > 1000 || cue.translation.length > 1000) {
      invalid('Cue text is required and each text field must fit within 1000 characters');
    }
  }
  return cues.sort((left, right) => left.startMs - right.startMs);
}

export function importInput(body: unknown): {
  expectedDraftId: string | null;
  cues: IncomingCue[];
} {
  const { format, content, expectedDraftId } = record(body);
  if (expectedDraftId !== null && !isUuid(expectedDraftId)) {
    invalid('Supply expectedDraftId or null for the first import');
  }
  const normalizedDraftId = expectedDraftId?.toLowerCase() ?? null;
  if (format === 'srt' || format === 'vtt') {
    if (typeof content !== 'string') invalid('Subtitle content must be text');
    return { expectedDraftId: normalizedDraftId, cues: validateCues(textCues(content, format)) };
  }
  if (format !== 'json') invalid('Use format srt, vtt, or json');
  const { cues } = record(content);
  if (!Array.isArray(cues) || !cues.length || cues.length > 2000) {
    invalid('Expected 1 to 2000 cues');
  }
  return { expectedDraftId: normalizedDraftId, cues: validateCues(cues.map(parseCue)) };
}

export function assignCueIds(incoming: IncomingCue[], previous: Pick<Cue, 'id'>[]): Cue[] {
  const previousIds = new Set(previous.map((cue) => cue.id));
  const used = new Set<string>();
  return incoming.map((cue) => {
    const id = cue.id ?? randomUUID();
    if ((cue.id && !previousIds.has(id)) || used.has(id)) invalid('Unknown or duplicate cue ID');
    used.add(id);
    return { ...cue, id };
  });
}

export function episodeInput(body: unknown) {
  const { title, youtubeId, seriesTitle, channelName, seriesId, channelId, episodeNumber, durationMs } = record(body);
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 200 ||
      typeof youtubeId !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(youtubeId)) {
    throw new ApiProblem(400, 'INVALID_EPISODE', 'Supply a title and a valid 11-character YouTube ID');
  }
  const optionalLabel = (value: unknown) => {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string' || value.trim().length > 200) {
      throw new ApiProblem(400, 'INVALID_EPISODE', 'Series and channel names must fit within 200 characters');
    }
    return value.trim() || null;
  };
  const optionalId = (value: unknown) => {
    if (value == null || value === '') return null;
    if (!isUuid(value)) throw new ApiProblem(400, 'INVALID_EPISODE', 'Invalid series or channel ID');
    return value.toLowerCase();
  };
  const positive = (value: unknown, maximum: number) => {
    if (value == null || value === '') return null;
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0 || value > maximum) {
      throw new ApiProblem(400, 'INVALID_EPISODE', 'Invalid episode number or duration');
    }
    return value;
  };
  return { title: title.trim(), youtubeId,
    seriesTitle: optionalLabel(seriesTitle), channelName: optionalLabel(channelName),
    seriesId: optionalId(seriesId), channelId: optionalId(channelId),
    episodeNumber: positive(episodeNumber, 2147483647), durationMs: positive(durationMs, 86400000) };
}

export function publicationInput(body: unknown): string {
  const { draftId, reviewed } = record(body);
  if (!isUuid(draftId) || reviewed !== true) {
    throw new ApiProblem(400, 'REVIEW_REQUIRED', 'Supply draftId and confirm reviewed=true');
  }
  return draftId.toLowerCase();
}
