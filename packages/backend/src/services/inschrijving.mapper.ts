import {
  Deelnemer,
  Inschrijving,
  UpsertableInschrijving,
} from '@rock-solid/shared';
import { Injectable } from '@nestjs/common';
import { DBService } from './db.service.js';
import * as db from '@prisma/client';
import { purgeNulls } from './mapper-utils.js';
import { handleKnownPrismaErrors } from '../errors/prisma.js';
import {
  DBPersonAggregate,
  includePersoonAggregate,
  toPersoon,
} from './persoon.mapper.js';

type DBInschrijvingAggregate = db.Inschrijving & {
  deelnemer: DBPersonAggregate;
};

const includeDeelnemer = Object.freeze({
  deelnemer: Object.freeze({
    include: includePersoonAggregate,
  }),
});

@Injectable()
export class InschrijvingMapper {
  constructor(private db: DBService) {}

  public async getAll(filter: { projectId: number }): Promise<Inschrijving[]> {
    const inschrijvingen = await this.db.inschrijving.findMany({
      where: filter,
      include: includeDeelnemer,
      orderBy: { deelnemer: { volledigeNaam: 'asc' } },
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
    const project = await this.db.project.findUniqueOrThrow({
      where: { id: inschrijvingData.projectId },
      include: { activiteiten: { orderBy: { van: 'asc' } } },
    });
    const dbEersteInschrijvingen = await this.db.activiteit.findMany({
      where: {
        project: {
          inschrijvingen: {
            some: {
              deelnemerId: inschrijvingData.deelnemerId,
              eersteInschrijving: true,
            },
          },
        },
      },
      orderBy: { van: 'asc' },
      include: {
        project: {
          select: {
            inschrijvingen: {
              where: {
                deelnemerId: inschrijving.deelnemerId,
              },
            },
          },
        },
      },
    });

    const firstActiviteit = project.activiteiten[0];
    const eersteInschrijving =
      !dbEersteInschrijvingen[0] ||
      (Boolean(firstActiviteit) &&
        dbEersteInschrijvingen[0].van > firstActiviteit!.van);

    if (eersteInschrijving) {
      const inschrijvingIds = dbEersteInschrijvingen.map(
        ({ project }) =>
          project.inschrijvingen.find(
            ({ deelnemerId }) => deelnemerId === inschrijvingData.deelnemerId,
          )!.id,
      );
      await this.db.inschrijving.updateMany({
        data: { eersteInschrijving: false },
        where: {
          id: { in: inschrijvingIds },
        },
      });
    }

    const dbInschrijving = await handleKnownPrismaErrors(
      this.db.inschrijving.create({
        data: {
          ...inschrijvingData,
          eersteInschrijving,
          woonplaatsDeelnemerId: domicilieadres
            ? domicilieadres.plaatsId
            : verblijfadres.plaatsId,
        },
        include: includeDeelnemer,
      }),
    );
    return toInschrijving(dbInschrijving);
  }

  public async update(
    id: number,
    inschrijving: UpsertableInschrijving,
  ): Promise<Inschrijving> {
    const {
      deelnemer: persoon,
      eersteInschrijving,
      ...inschrijvingData
    } = inschrijving;
    const dbInschrijving = await this.db.inschrijving.update({
      data: {
        ...inschrijvingData,
        rekeninguittrekselNummer:
          inschrijvingData.rekeninguittrekselNummer ?? null,
      },
      where: {
        id,
      },
      include: includeDeelnemer,
    });
    return toInschrijving(dbInschrijving);
  }
}

function toInschrijving(raw: DBInschrijvingAggregate): Inschrijving {
  const { woonplaatsDeelnemerId, deelnemer, ...inschrijving } = raw;
  return {
    ...purgeNulls(inschrijving),
    deelnemer: toPersoon(deelnemer) as Deelnemer,
  };
}
