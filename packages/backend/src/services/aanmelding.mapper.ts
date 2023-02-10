import {
  Deelnemer,
  Aanmelding,
  UpsertableAanmelding,
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

type DBAanmeldingAggregate = db.Aanmelding & {
  deelnemer: DBPersonAggregate | null;
};

const includeDeelnemer = Object.freeze({
  deelnemer: Object.freeze({
    include: includePersoonAggregate,
  }),
});

@Injectable()
export class AanmeldingMapper {
  constructor(private db: DBService) {}

  public async getAll(filter: { projectId: number }): Promise<Aanmelding[]> {
    const aanmeldingen = await this.db.aanmelding.findMany({
      where: filter,
      include: includeDeelnemer,
      orderBy: { deelnemer: { volledigeNaam: 'asc' } },
    });
    return aanmeldingen.map(toAanmelding);
  }

  public async create(aanmelding: UpsertableAanmelding): Promise<Aanmelding> {
    const { deelnemer, ...aanmeldingData } = aanmelding;
    const { verblijfadres, domicilieadres } = (await this.db.persoon.findUnique(
      {
        where: { id: aanmeldingData.deelnemerId },
        include: { verblijfadres: true, domicilieadres: true },
      },
    ))!;
    const project = await this.db.project.findUniqueOrThrow({
      where: { id: aanmeldingData.projectId },
      include: { activiteiten: { orderBy: { van: 'asc' } } },
    });
    const dbEersteAanmeldingen = await this.db.activiteit.findMany({
      where: {
        project: {
          aanmeldingen: {
            some: {
              deelnemerId: aanmeldingData.deelnemerId,
              eersteAanmelding: true,
            },
          },
        },
      },
      orderBy: { van: 'asc' },
      include: {
        project: {
          select: {
            aanmeldingen: {
              where: {
                deelnemerId: aanmelding.deelnemerId,
              },
            },
          },
        },
      },
    });

    const firstActiviteit = project.activiteiten[0];
    const eersteAanmelding =
      !dbEersteAanmeldingen[0] ||
      (Boolean(firstActiviteit) &&
        dbEersteAanmeldingen[0].van > firstActiviteit!.van);

    if (eersteAanmelding) {
      const aanmeldingIds = dbEersteAanmeldingen.map(
        ({ project }) =>
          project.aanmeldingen.find(
            ({ deelnemerId }) => deelnemerId === aanmeldingData.deelnemerId,
          )!.id,
      );
      await this.db.aanmelding.updateMany({
        data: { eersteAanmelding: false },
        where: {
          id: { in: aanmeldingIds },
        },
      });
    }

    const dbAanmelding = await handleKnownPrismaErrors(
      this.db.aanmelding.create({
        data: {
          ...aanmeldingData,
          eersteAanmelding,
          woonplaatsDeelnemerId: domicilieadres
            ? domicilieadres.plaatsId
            : verblijfadres.plaatsId,
        },
        include: includeDeelnemer,
      }),
    );
    return toAanmelding(dbAanmelding);
  }

  public async update(
    id: number,
    aanmelding: Partial<Aanmelding>,
  ): Promise<Aanmelding> {
    const {
      deelnemer: persoon,
      eersteAanmelding,
      ...aanmeldingData
    } = aanmelding;
    const dbAanmelding = await this.db.aanmelding.update({
      data: {
        ...aanmeldingData,
        rekeninguittrekselNummer:
          aanmeldingData.rekeninguittrekselNummer ?? null,
      },
      where: {
        id,
      },
      include: includeDeelnemer,
    });
    return toAanmelding(dbAanmelding);
  }
}

function toAanmelding(raw: DBAanmeldingAggregate): Aanmelding {
  const { woonplaatsDeelnemerId, deelnemer, ...aanmelding } = raw;
  return {
    ...purgeNulls(aanmelding),
    deelnemer: deelnemer ? (toPersoon(deelnemer) as Deelnemer) : undefined,
  };
}
