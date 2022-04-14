import { Inschrijving, UpsertableInschrijving } from '@rock-solid/shared';
import { Injectable } from '@nestjs/common';
import { DBService } from './db.service.js';
import * as db from '@prisma/client';
import { purgeNulls } from './mapper-utils.js';

@Injectable()
export class InschrijvingMapper {
  constructor(private db: DBService) {}

  public async getAll(filter: { projectId: number }): Promise<Inschrijving[]> {
    const inschrijvingen = await this.db.inschrijving.findMany({
      where: filter,
      include: {
        deelnemer: true,
      },
    });
    return inschrijvingen.map(toInschrijving);
  }

  public async create(
    inschrijving: UpsertableInschrijving,
  ): Promise<Inschrijving> {
    const { deelnemer, ...inschrijvingData } = inschrijving;
    const { verblijfadres, domicilieadres } = (await this.db.persoon.findUnique(
      {
        where: { id: inschrijvingData.deelnemerId },
        include: { verblijfadres: true, domicilieadres: true },
      },
    ))!;

    const dbInschrijving = await this.db.inschrijving.create({
      data: {
        ...inschrijvingData,
        woonplaatsDeelnemerId: domicilieadres
          ? domicilieadres.plaatsId
          : verblijfadres.plaatsId,
      },
      include: {
        deelnemer: true,
      },
    });
    return toInschrijving(dbInschrijving);
  }

  public async update(
    id: number,
    inschrijving: UpsertableInschrijving,
  ): Promise<Inschrijving> {
    const { deelnemer: persoon, ...inschrijvingData } = inschrijving;
    const dbInschrijving = await this.db.inschrijving.update({
      data: inschrijvingData,
      where: {
        id,
      },
    });
    return toInschrijving(dbInschrijving);
  }
}

function toInschrijving(raw: db.Inschrijving): Inschrijving {
  const { woonplaatsDeelnemerId, ...inschrijving } = raw;
  return purgeNulls(inschrijving);
}
