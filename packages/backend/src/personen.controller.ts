import { Persoon } from '@kei-crm/shared';
import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PersoonService } from './services/persoon.service';

@Controller({ path: 'personen' })
export class AppController {
  constructor(private readonly persoonService: PersoonService) {}

  @Get()
  getAll(): Promise<Persoon[]> {
    return this.persoonService.getAll({});
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<Persoon> {
    const persoon = await this.persoonService.getOne({ id: +id });
    if (persoon) {
      return persoon;
    } else {
      throw new NotFoundException();
    }
  }
}
