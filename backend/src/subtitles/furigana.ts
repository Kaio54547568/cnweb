import { Injectable, Logger } from '@nestjs/common';
import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { createInterface, Interface } from 'node:readline';
import { SubtitleWord } from './input';

function isWord(value: unknown): value is SubtitleWord {
  if (!value || typeof value !== 'object') return false;
  const { surface, lemma, reading, ruby } = value as SubtitleWord;
  return typeof surface === 'string' && (lemma === null || typeof lemma === 'string') &&
    (reading === null || typeof reading === 'string') && Array.isArray(ruby) &&
    ruby.every((part) => Array.isArray(part) && part.length === 2 &&
      typeof part[0] === 'string' && (part[1] === null || typeof part[1] === 'string')) &&
    ruby.map(([part]) => part).join('') === surface;
}

interface Session {
  child: ChildProcessWithoutNullStreams;
  lines: Interface;
  ready: Promise<void>;
}

@Injectable()
export class Furigana {
  private readonly logger = new Logger(Furigana.name);
  private session?: Session;

  private start(): Session {
    const child = spawn(process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3'),
      [join(__dirname, '../../nlp/furigana.py')], { windowsHide: true });
    const lines = createInterface({ input: child.stdout });
    const session = { child, lines, ready: Promise.resolve() };
    this.session = session;
    child.on('error', () => this.reset(session));
    child.on('exit', () => this.reset(session));
    child.stdin.on('error', () => this.reset(session));
    child.stderr.on('data', () => this.logger.warn({ service: 'worker', operation: 'furigana_stderr' }));
    session.ready = this.nextLine(session).then((line) => {
      if (line.ready !== true) throw new Error('Furigana startup failed');
    });
    return session;
  }

  private nextLine(session: Session): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timeout);
        session.lines.off('line', onLine);
        session.lines.off('close', onClose);
      };
      const onLine = (line: string) => {
        cleanup();
        try {
          resolve(JSON.parse(line));
        } catch {
          reject(new Error('Invalid furigana response'));
        }
      };
      const onClose = () => {
        cleanup();
        reject(new Error('Furigana process closed'));
      };
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Furigana timeout'));
      }, 30_000);
      session.lines.once('line', onLine);
      session.lines.once('close', onClose);
    });
  }

  async read(texts: string[]): Promise<SubtitleWord[][]> {
    const session = this.session ?? this.start();
    try {
      await session.ready;
      if (this.session !== session) throw new Error('Furigana process unavailable');
      const id = randomUUID();
      const response = this.nextLine(session);
      session.child.stdin.write(JSON.stringify({ id, texts }) + '\n');
      const { id: responseId, words } = await response;
      if (responseId !== id || !Array.isArray(words) || words.length !== texts.length ||
          !words.every((parts, index) => Array.isArray(parts) && parts.every(isWord) &&
            parts.map((part) => part.surface).join('') === texts[index])) {
        throw new Error('Invalid furigana result');
      }
      return words;
    } catch (error) {
      this.reset(session);
      throw error;
    }
  }

  close(): void {
    if (this.session) this.reset(this.session);
  }

  private reset(session: Session): void {
    if (this.session !== session) return;
    this.session = undefined;
    session.lines.close();
    session.child.kill();
  }
}
