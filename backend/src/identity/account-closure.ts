import {
  Controller, Delete, Headers, HttpCode, Logger, Module, Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Database, DatabaseModule } from '../database';
import { Learning, LearningModule } from '../learning/learning';
import { Identity, IdentityModule } from './identity';

@ApiTags('Identity')
@ApiBearerAuth()
@Controller('identity')
class AccountClosureController {
  private readonly logger = new Logger(AccountClosureController.name);

  constructor(private readonly db: Database, private readonly identity: Identity,
    private readonly learning: Learning) {}

  @Delete('me')
  @HttpCode(204)
  async erase(@Headers('authorization') auth: string | undefined,
    @Res({ passthrough: true }) response: Response) {
    const { id } = await this.identity.requireActor(auth);
    await this.db.$transaction(async (tx) => {
      await this.identity.closeAccount(tx, id);
      await this.learning.erase(tx, id);
    });
    this.logger.log({ service: 'api', operation: 'account_closed', accountId: id,
      requestId: response.locals.requestId });
  }
}

@Module({
  imports: [DatabaseModule, IdentityModule, LearningModule],
  controllers: [AccountClosureController],
})
export class AccountClosureModule {}
