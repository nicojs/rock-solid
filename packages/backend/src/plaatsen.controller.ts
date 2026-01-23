import {
  PAGE_QUERY_STRING_NAME,
  TOTAL_COUNT_HEADER,
  type Plaats,
  type PlaatsFilter,
} from '@rock-solid/shared';
import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PlaatsMapper } from './services/plaats.mapper.js';
import { PagePipe } from './pipes/page.pipe.js';
import { PlaatsFilterPipe } from './pipes/plaats-filter.pipe.js';
import { Privileges } from './auth/privileges.guard.js';

@Controller({ path: 'plaatsen' })
export class PlaatsenController {
  constructor(private readonly plaatsMapper: PlaatsMapper) {}

  @Get()
  async getAll(
    @Res({ passthrough: true }) resp: Response,
    @Query(PlaatsFilterPipe)
    filter: PlaatsFilter,
    @Query(PAGE_QUERY_STRING_NAME, PagePipe)
    page?: number,
  ): Promise<Plaats[]> {
    const [plaatsen, count] = await Promise.all([
      this.plaatsMapper.getAll(filter, page),
      this.plaatsMapper.count(filter),
    ]);
    resp.set(TOTAL_COUNT_HEADER, count.toString());

    return plaatsen;
  }

  @Post()
  @Privileges('custom:manage-plaatsen')
  async updateAll(@Body() plaatsen: Pick<Plaats, 'deelgemeente' | 'gemeente' | 'postcode'>[]) {
    await this.plaatsMapper.upsertMany(plaatsen);
  }
}
