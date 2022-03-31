import { Plaats, PlaatsFilter } from '@kei-crm/shared';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth';
import { PlaatsMapper } from './services/plaats.mapper';

@Controller({ path: 'plaatsen' })
@UseGuards(JwtAuthGuard)
export class PlaatsenController {
  constructor(private readonly plaatsMapper: PlaatsMapper) {}

  @Get()
  async getAll(@Query() filter: PlaatsFilter): Promise<Plaats[]> {
    return this.plaatsMapper.getAll(filter);
  }
}
