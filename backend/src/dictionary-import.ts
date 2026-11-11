import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { entryIdPattern } from './dictionary/dictionary';

type Entry = { id: string; headword: string; readings: string[]; terms: string[]; glosses: unknown[] };

async function save(db: PrismaClient, entries: Entry[]) {
  const batch = JSON.stringify(entries);
  const ids = entries.map(({ id }) => id);
  await db.$transaction([
    db.$executeRaw`INSERT INTO dictionary_entries (id, headword, readings, glosses)
      SELECT id, headword, readings, glosses
      FROM jsonb_to_recordset(${batch}::jsonb)
        AS x(id text, headword text, readings text[], glosses jsonb)
      ON CONFLICT (id) DO UPDATE SET headword = EXCLUDED.headword, readings = EXCLUDED.readings,
        glosses = EXCLUDED.glosses`,
    db.dictionaryTerm.deleteMany({ where: { entryId: { in: ids } } }),
    db.$executeRaw`INSERT INTO dictionary_terms (term, entry_id)
      SELECT unnest(terms), id
      FROM jsonb_to_recordset(${batch}::jsonb) AS x(id text, terms text[])
      ON CONFLICT DO NOTHING`,
  ]);
}

async function main() {
  const [kind, path] = process.argv.slice(2);
  if (!path || (kind !== 'jmdict' && kind !== 'kanjidic')) {
    throw new Error('Usage: npm run dictionary:import -- <jmdict|kanjidic> <file.xml.gz>');
  }
  const db = new PrismaClient();
  const python = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
  const child = spawn(python, [join(__dirname, '../nlp/dictionary_export.py'), kind, path], {
    stdio: ['ignore', 'pipe', 'inherit'], windowsHide: true,
  });
  const done = once(child, 'close').then(([code]) => {
    if (code !== 0) throw new Error('Dictionary XML conversion failed');
  });
  void done.catch(() => {});
  const lines = createInterface({ input: child.stdout });
  let count = 0;
  let entries: Entry[] = [];
  try {
    for await (const line of lines) {
      const entry = JSON.parse(line) as Entry;
      if (!entryIdPattern.test(entry.id)) throw new Error('Invalid dictionary entry');
      entries.push(entry);
      if (entries.length >= 500) {
        await save(db, entries);
        count += entries.length;
        entries = [];
      }
    }
    await done;
    if (entries.length) await save(db, entries);
    console.log('Imported dictionary entries:', count + entries.length);
  } finally {
    lines.close();
    if (child.exitCode === null) child.kill();
    await db.$disconnect();
  }
}

void main().catch((error: Error) => {
  console.error(error.message.startsWith('Usage:') ? error.message : 'Dictionary import failed');
  process.exitCode = 1;
});
