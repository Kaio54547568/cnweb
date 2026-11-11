import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { promisify } from 'node:util';

async function main() {
  const [path] = process.argv.slice(2);
  if (!path) throw new Error('Usage: npm run dictionary:import-vi -- <file.csv>');
  const python = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
  const { stdout } = await promisify(execFile)(python, [join(__dirname, '../nlp/dictionary_vi.py'), path],
    { windowsHide: true, maxBuffer: 32 * 1024 * 1024 }).catch((error) => {
      throw new Error(error.stderr?.trim() || 'Could not read the Vietnamese CSV');
    });
  const db = new PrismaClient();
  try {
    const count = await db.$transaction(async (tx) => {
      const missing = await tx.$queryRaw<{ entry_id: string; line: number }[]>`
        SELECT data.entry_id, data.line
        FROM jsonb_to_recordset(${stdout}::jsonb) AS data(entry_id text, line integer)
        WHERE NOT EXISTS (SELECT 1 FROM dictionary_entries e WHERE e.id = data.entry_id)
        ORDER BY data.line
      `;
      if (missing.length) {
        throw new Error(missing.map(({ entry_id, line }) => `Line ${line}: unknown entryId ${entry_id}`).join('\n'));
      }
      return tx.$executeRaw`
        INSERT INTO dictionary_vietnamese (entry_id, meaning_vi, source)
        SELECT entry_id, meaning_vi, source
        FROM jsonb_to_recordset(${stdout}::jsonb) AS data(entry_id text, meaning_vi text, source text)
        ON CONFLICT (entry_id) DO UPDATE SET meaning_vi = EXCLUDED.meaning_vi, source = EXCLUDED.source
      `;
    }, { timeout: 30_000 });
    console.log('Imported Vietnamese meanings:', count);
  } finally {
    await db.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error && !(error.name.startsWith('PrismaClient'))
    ? error.message : 'Vietnamese dictionary import failed');
  process.exitCode = 1;
});
