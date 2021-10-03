import { Inschrijving, UpsertableInschrijving } from '@kei-crm/shared';
import { Injectable } from '@nestjs/common';
import { DBService } from './db.service';
import * as db from '@prisma/client';
import { purgeNulls } from './mapper-utils';

@Injectable()
export class InschrijvingMapper {
  constructor(private db: DBService) {}

  public async getAll(filter: { projectId: number }): Promise<Inschrijving[]> {
    const inschrijvingen = await this.db.inschrijving.findMany({
      where: filter,
      include: {
        persoon: true,
      },
    });
    return inschrijvingen.map(toInschrijving);
  }

  public async create(
    inschrijving: UpsertableInschrijving,
  ): Promise<Inschrijving> {
    const { persoon, ...inschrijvingData } = inschrijving;
    const dbInschrijving = await this.db.inschrijving.create({
      data: inschrijvingData,
      include: {
        persoon: true,
      },
    });
    return toInschrijving(dbInschrijving);
  }

  public async update(
    id: number,
    inschrijving: UpsertableInschrijving,
  ): Promise<Inschrijving> {
    const { persoon, ...inschrijvingData } = inschrijving;
    const dbInschrijving = await this.db.inschrijving.update({
      data: inschrijvingData,
      where: {
        id,
      },
    });
    return toInschrijving(dbInschrijving);
  }
}

function toInschrijving(inschrijving: db.Inschrijving): Inschrijving {
  return purgeNulls(inschrijving);
}
