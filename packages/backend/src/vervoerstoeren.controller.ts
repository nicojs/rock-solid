import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Request,
  Res,
} from '@nestjs/common';
import {
  type User,
  type Vervoerstoer,
  type VervoerstoerFilter,
  toVervoerstoerFilter,
  TOTAL_COUNT_HEADER,
  PAGE_QUERY_STRING_NAME,
} from '@rock-solid/shared';
import type { Response } from 'express';
import { Privileges } from './auth/privileges.guard.js';
import { VervoerstoerMapper } from './services/vervoerstoer.mapper.js';
import { PagePipe } from './pipes/page.pipe.js';
import { NumberPipe } from './pipes/number.pipe.js';

@Controller({ path: 'vervoerstoeren' })
export class VervoerstoerenController {
  constructor(private readonly vervoerstoerMapper: VervoerstoerMapper) {}

  @Get()
  async getAll(
    @Res({ passthrough: true }) resp: Response,
    @Query({ transform: toVervoerstoerFilter }) filter: VervoerstoerFilter,
    @Query(PAGE_QUERY_STRING_NAME, PagePipe) page?: number,
  ): Promise<Vervoerstoer[]> {
    const [vervoerstoeren, count] = await Promise.all([
      this.vervoerstoerMapper.getAll(filter, page),
      this.vervoerstoerMapper.count(filter),
    ]);
    resp.set(TOTAL_COUNT_HEADER, count.toString());
    return vervoerstoeren;
  }

  @Get(':id')
  async get(@Param('id', NumberPipe) id: number): Promise<Vervoerstoer> {
    const vervoerstoer = await this.vervoerstoerMapper.get(id);
    if (vervoerstoer) {
      return vervoerstoer;
    }
    throw new NotFoundException();
  }

  @Post()
  @Privileges('update:projecten')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() vervoerstoer: Vervoerstoer,
    @Request() req: { user: User },
  ): Promise<Vervoerstoer> {
    return this.vervoerstoerMapper.create(vervoerstoer, req.user.name);
  }

  @Put(':id')
  @Privileges('update:projecten')
  update(
    @Param('id', NumberPipe) id: number,
    @Body() vervoerstoer: Vervoerstoer,
  ): Promise<Vervoerstoer> {
    return this.vervoerstoerMapper.update(id, vervoerstoer);
  }

  @Delete(':id')
  @Privileges('update:projecten')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', NumberPipe) id: number): Promise<void> {
    await this.vervoerstoerMapper.delete(id);
  }
}
