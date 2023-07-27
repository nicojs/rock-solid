import type { Plaats, PlaatsFilter } from '@rock-solid/shared';
import { Controller, Get, Query } from '@nestjs/common';
import { PlaatsMapper } from './services/plaats.mapper.js';

@Controller({ path: 'plaatsen' })
export class PlaatsenController {
  constructor(private readonly plaatsMapper: PlaatsMapper) {}

  @Get()
  async getAll(@Query() filter: PlaatsFilter): Promise<Plaats[]> {
    return this.plaatsMapper.getAll(filter);
  }
}
