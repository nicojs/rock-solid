import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import type { Vervoerstoer } from '@rock-solid/shared';
import { Privileges } from './auth/privileges.guard.js';
import { VervoerstoerMapper } from './services/vervoerstoer.mapper.js';

@Controller({ path: 'vervoerstoeren' })
export class VervoerstoerenController {
  constructor(private readonly vervoerstoerMapper: VervoerstoerMapper) {}

  @Get()
  getAll(): Promise<Vervoerstoer[]> {
    return this.vervoerstoerMapper.getAll();
  }

  @Post()
  @Privileges('update:projecten')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() vervoerstoer: Vervoerstoer): Promise<Vervoerstoer> {
    return this.vervoerstoerMapper.create(vervoerstoer);
  }

  @Put()
  @Privileges('update:projecten')
  update(@Body() vervoerstoer: Vervoerstoer): Promise<Vervoerstoer> {
    return this.vervoerstoerMapper.update(vervoerstoer);
  }
}
