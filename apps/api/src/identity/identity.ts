import {
  Body, CanActivate, Controller, ExecutionContext, ForbiddenException, Get, Header, Headers, HttpCode,
  Injectable, Module, Patch, Post, Req, UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { AccountRole, JlptLevel, Prisma } from '@prisma/client';
import { isIP } from 'node:net';
import type { Request } from 'express';
import { Database, DatabaseModule } from '../database';
import { RateLimit, RateLimitModule } from '../rate-limit';
import { verifyAssertion } from './assertion';
import { ApiProblem } from '../http';

const accountIdPattern = /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;
const profileFields = { id: true, role: true, displayName: true, jlptLevel: true,
  learningLanguage: true } as const;
const levels: readonly string[] = Object.values(JlptLevel);

function profilePatch(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiProblem(400, 'INVALID_PROFILE', 'Supply a profile object');
  }
  const fields = Object.keys(body);
  if (!fields.length || fields.some((field) => field !== 'displayName' && field !== 'jlptLevel')) {
    throw new ApiProblem(400, 'INVALID_PROFILE', 'Supply displayName or jlptLevel');
  }
  const { displayName, jlptLevel } = body as Record<string, unknown>;
  const data: { displayName?: string | null; jlptLevel?: JlptLevel | null } = {};
  if (fields.includes('displayName')) {
    const name = typeof displayName === 'string' ? displayName.trim() : displayName;
    if (name !== null && (typeof name !== 'string' || !name || [...name].length > 80 || /\0/.test(name))) {
      throw new ApiProblem(400, 'INVALID_PROFILE', 'Use a display name of 1 to 80 characters or null');
    }
    data.displayName = name;
  }
  if (fields.includes('jlptLevel')) {
    if (jlptLevel !== null && (typeof jlptLevel !== 'string' || !levels.includes(jlptLevel))) {
      throw new ApiProblem(400, 'INVALID_PROFILE', 'Use a level from N5 to N1 or null');
    }
    data.jlptLevel = jlptLevel as JlptLevel | null;
  }
  return data;
}

export interface Actor {
  id: string;
  role: AccountRole;
}

export type EditorRequest = Request & { actor: Actor };

@Injectable()
export class Identity {
  constructor(private readonly db: Database) {}

  async googleLogin(authorization: string | undefined): Promise<{ id: string }> {
    const googleSubject = verifyAssertion(authorization, 'google-login');
    if (!/^[A-Za-z\d_-]{1,255}$/.test(googleSubject)) throw new UnauthorizedException();
    await this.db.account.createMany({ data: { googleSubject }, skipDuplicates: true });
    const account = await this.db.account.findUnique({
      where: { googleSubject },
      select: { id: true, disabledAt: true },
    });
    if (!account || account.disabledAt) throw new UnauthorizedException();
    return { id: account.id };
  }

  async requireActor(authorization: string | undefined): Promise<Actor> {
    const id = this.sessionAccountId(authorization);
    const account = await this.db.account.findUnique({
      where: { id }, select: { id: true, role: true, disabledAt: true },
    });
    if (!account || account.disabledAt) throw new UnauthorizedException();
    return { id: account.id, role: account.role };
  }

  private sessionAccountId(authorization: string | undefined) {
    const id = verifyAssertion(authorization, 'session');
    if (!accountIdPattern.test(id)) throw new UnauthorizedException();
    return id;
  }

  async profile(authorization: string | undefined) {
    const id = this.sessionAccountId(authorization);
    const profile = await this.db.account.findUnique({
      where: { id, disabledAt: null }, select: profileFields,
    });
    if (!profile) throw new UnauthorizedException();
    return profile;
  }

  async updateProfile(authorization: string | undefined, body: unknown) {
    const id = this.sessionAccountId(authorization);
    return this.db.$transaction(async (tx) => {
      await this.lockActive(tx, id);
      return tx.account.update({ where: { id }, data: profilePatch(body), select: profileFields });
    });
  }

  async lockActive(tx: Prisma.TransactionClient, id: string) {
    const rows = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM accounts
      WHERE id = ${id}::uuid AND disabled_at IS NULL FOR UPDATE`;
    if (!rows.length) throw new UnauthorizedException();
  }

  async closeAccount(tx: Prisma.TransactionClient, id: string) {
    await this.lockActive(tx, id);
    await tx.account.update({ where: { id },
      data: { disabledAt: new Date(), googleSubject: null, role: AccountRole.LEARNER,
        displayName: null, jlptLevel: null } });
  }
}

@Injectable()
export class EditorGuard implements CanActivate {
  constructor(private readonly identity: Identity) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<EditorRequest>();
    const actor = await this.identity.requireActor(request.headers.authorization);
    if (actor.role !== AccountRole.EDITOR) throw new ForbiddenException();
    request.actor = actor;
    return true;
  }
}

@ApiTags('Identity')
@Controller('identity')
class IdentityController {
  constructor(private readonly identity: Identity, private readonly limit: RateLimit) {}

  @Post('login-limit')
  @HttpCode(204)
  @ApiExcludeEndpoint()
  async loginLimit(@Headers('authorization') authorization?: string) {
    const ip = verifyAssertion(authorization, 'login-rate');
    if (ip !== 'local' && !isIP(ip)) throw new UnauthorizedException();
    await this.limit.check('login', ip, 12, 60, false);
  }

  @Post('google-login')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  googleLogin(@Headers('authorization') authorization?: string) {
    return this.identity.googleLogin(authorization);
  }

  @Get('me')
  @ApiBearerAuth()
  @Header('Cache-Control', 'private, no-store')
  me(@Req() request: Request) {
    return this.identity.profile(request.headers.authorization);
  }

  @Patch('me')
  @ApiBearerAuth()
  @Header('Cache-Control', 'private, no-store')
  @ApiBody({ schema: { type: 'object', minProperties: 1, additionalProperties: false, properties: {
    displayName: { type: 'string', minLength: 1, maxLength: 80, nullable: true },
    jlptLevel: { type: 'string', enum: Object.values(JlptLevel), nullable: true },
  } } })
  editMe(@Req() request: Request, @Body() body: unknown) {
    return this.identity.updateProfile(request.headers.authorization, body);
  }
}

@Module({
  imports: [DatabaseModule, RateLimitModule],
  controllers: [IdentityController],
  providers: [Identity, EditorGuard],
  exports: [Identity, EditorGuard],
})
export class IdentityModule {}
