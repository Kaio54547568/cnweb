import {
  Body, Controller, Delete, Get, HttpCode, Module, Param, ParseUUIDPipe, Patch, Post, Put, Query, Req, Res, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { join } from 'node:path';
import { DatabaseModule } from '../database';
import { CatalogMetadata } from '../catalog/metadata';
import { EditorGuard, IdentityModule } from '../identity/identity';
import type { EditorRequest } from '../identity/identity';
import { Editorial } from './editorial';
import { RateLimit, RateLimitModule } from '../rate-limit';

@ApiTags('Editorial')
@ApiBearerAuth()
@UseGuards(EditorGuard)
@Controller('editorial/episodes')
class EditorialController {
  constructor(private readonly editorial: Editorial, private readonly limit: RateLimit) {}

  @Post()
  @ApiBody({ schema: { example: { title: 'Tập mẫu', youtubeId: 'M7lc1UVf-VE' } } })
  create(@Body() body: unknown, @Req() request: EditorRequest,
    @Res({ passthrough: true }) response: Response) {
    return this.editorial.createEpisode(body, request.actor.id, response.locals.requestId);
  }

  @Get()
  list(@Query('q') query: unknown, @Query('page') page: unknown) {
    return this.editorial.list(query, page);
  }

  @Put(':episodeId/visibility')
  setVisibility(@Param('episodeId', ParseUUIDPipe) episodeId: string, @Body() body: unknown,
    @Req() request: EditorRequest, @Res({ passthrough: true }) response: Response) {
    return this.editorial.setVisibility(episodeId, body, request.actor.id, response.locals.requestId);
  }

  @Get(':episodeId/draft')
  draft(@Param('episodeId', ParseUUIDPipe) episodeId: string) {
    return this.editorial.draft(episodeId);
  }

  @Put(':episodeId/draft')
  @HttpCode(202)
  @ApiBody({ schema: { example: { expectedDraftId: null, format: 'json', content: {
    cues: [{ startMs: 500, endMs: 2500, text: '日本語', translation: 'Tiếng Nhật' }],
  } } } })
  async replaceDraft(@Param('episodeId', ParseUUIDPipe) episodeId: string, @Body() body: unknown,
    @Req() request: EditorRequest, @Res({ passthrough: true }) response: Response) {
    await this.limit.check('subtitle_import', request.actor.id, 15, 60, true);
    return this.editorial.replaceDraft(episodeId, body, response.locals.requestId, request.actor.id);
  }

  @Delete(':episodeId/publication')
  @HttpCode(204)
  async unpublish(@Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Req() request: EditorRequest, @Res({ passthrough: true }) response: Response) {
    await this.editorial.unpublish(episodeId, request.actor.id, response.locals.requestId);
  }

  @Post(':episodeId/publish')
  @HttpCode(200)
  @ApiBody({ schema: { type: 'object', required: ['draftId', 'reviewed'], properties: {
    draftId: { type: 'string', format: 'uuid' }, reviewed: { type: 'boolean', enum: [true] },
  } } })
  publish(@Param('episodeId', ParseUUIDPipe) episodeId: string, @Body() body: unknown,
    @Req() request: EditorRequest, @Res({ passthrough: true }) response: Response) {
    return this.editorial.publish(episodeId, body, response.locals.requestId, request.actor.id);
  }
}

const viewerFiles = join(__dirname, '../../viewer');

@ApiTags('Editorial')
@ApiBearerAuth()
@UseGuards(EditorGuard)
@Controller('editorial')
class MetadataController {
  constructor(private readonly metadata: CatalogMetadata) {}

  @Get('channels')
  channels() { return this.metadata.channels(); }

  @Post('channels')
  addChannel(@Body() body: unknown) { return this.metadata.addChannel(body); }

  @Get('series')
  series() { return this.metadata.series(); }

  @Post('series')
  addSeries(@Body() body: unknown) { return this.metadata.addSeries(body); }

  @Patch('series/:seriesId')
  updateSeries(@Param('seriesId', ParseUUIDPipe) id: string, @Body() body: unknown) {
    return this.metadata.updateSeries(id, body);
  }

  @Put('episodes/:episodeId/grouping')
  assignSeries(@Param('episodeId', ParseUUIDPipe) id: string, @Body() body: unknown) {
    return this.metadata.assignSeries(id, body);
  }

  @Get('episodes/:episodeId/speakers')
  speakers(@Param('episodeId', ParseUUIDPipe) id: string) { return this.metadata.speakers(id); }

  @Post('episodes/:episodeId/speakers')
  addSpeaker(@Param('episodeId', ParseUUIDPipe) id: string, @Body() body: unknown) {
    return this.metadata.addSpeaker(id, body);
  }
}

@Controller('preview')
class PreviewController {
  @Get()
  html(@Res() response: Response): void {
    response.setHeader('Content-Security-Policy',
      "default-src 'self'; script-src 'self' https://www.youtube.com; frame-src https://www.youtube.com; " +
      "style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'");
    response.sendFile('index.html', { root: viewerFiles });
  }

  @Get('player.js')
  player(@Res() response: Response): void {
    response.sendFile('player.js', { root: viewerFiles });
  }
}

@Module({
  imports: [DatabaseModule, IdentityModule, RateLimitModule],
  controllers: [EditorialController, MetadataController, PreviewController],
  providers: [Editorial, CatalogMetadata],
})
export class EditorialModule {}
