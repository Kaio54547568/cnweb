import { Controller, Get, Injectable, Module, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { isIP } from 'node:net';
import type { Request } from 'express';
import type { Prisma } from '@prisma/client';
import { Database, DatabaseModule } from '../database';
import { ApiProblem } from '../http';
import { verifyAssertion } from '../identity/assertion';
import { Identity, IdentityModule } from '../identity/identity';
import { RateLimit, RateLimitModule } from '../rate-limit';

export const entryIdPattern = /^(?:jmdict:\d{1,12}|kanji:[a-f\d]{4,6})$/;
export const dictionaryFields = {
  id: true, headword: true, readings: true, glosses: true,
  vietnamese: { select: { meaningVi: true, source: true } },
} satisfies Prisma.DictionaryEntrySelect;

export function dictionaryEntry({ vietnamese, glosses, ...entry }: Prisma.DictionaryEntryGetPayload<{
  select: typeof dictionaryFields;
}>) {
  const original = Array.isArray(glosses) ? glosses : [];
  return { ...entry, glosses: vietnamese
    ? [{ lang: 'vi', text: vietnamese.meaningVi, source: vietnamese.source }, ...original]
    : original };
}

function lookupTerm(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 80 || /\0/.test(value)) {
    throw new ApiProblem(400, 'INVALID_TERM', 'Use a search term up to 80 characters');
  }
  return value.trim().normalize('NFKC');
}

@Injectable()
class Dictionary {
  constructor(private readonly db: Database) {}

  private byTerm(term: string) {
    return this.db.dictionaryTerm.findMany({
      where: { term },
      select: { entry: { select: dictionaryFields } },
      orderBy: { entryId: 'asc' },
      take: 20,
    });
  }

  async lookup(query: unknown, surface: unknown) {
    const term = lookupTerm(query);
    const original = surface === undefined ? term : lookupTerm(surface);
    const chars = [...new Set(original.match(/\p{Script=Han}/gu) ?? [])].slice(0, 12);
    const ids = chars.map((char) => 'kanji:' + char.codePointAt(0)!.toString(16).padStart(4, '0'));
    const [primary, kanji] = await Promise.all([
      this.byTerm(term),
      this.db.dictionaryEntry.findMany({ where: { id: { in: ids } }, select: dictionaryFields }),
    ]);
    const rows = primary.length || original === term ? primary : await this.byTerm(original);
    return { entries: rows.map(({ entry }) => dictionaryEntry(entry)),
      kanji: kanji.map(dictionaryEntry) };
  }
}

@ApiTags('Dictionary')
@Controller('dictionary')
class DictionaryController {
  constructor(private readonly dictionary: Dictionary, private readonly identity: Identity,
    private readonly limit: RateLimit) {}

  @Get()
  async lookup(@Req() request: Request, @Query('q') query: unknown, @Query('surface') surface: unknown) {
    const guest = request.headers['x-cnweb-guest'];
    let subject = 'ip:' + (request.ip ?? 'unknown');
    let maximum = 30;
    if (request.headers.authorization) {
      const actor = await this.identity.requireActor(request.headers.authorization);
      subject = 'account:' + actor.id;
      maximum = 90;
    } else if (typeof guest === 'string') {
      const ip = verifyAssertion(guest, 'guest');
      if (ip !== 'local' && !isIP(ip)) throw new UnauthorizedException();
      subject = 'ip:' + ip;
    }
    await this.limit.check('dictionary', subject, maximum, 60, true);
    return this.dictionary.lookup(query, surface);
  }
}

@Module({
  imports: [DatabaseModule, IdentityModule, RateLimitModule],
  controllers: [DictionaryController],
  providers: [Dictionary],
})
export class DictionaryModule {}
