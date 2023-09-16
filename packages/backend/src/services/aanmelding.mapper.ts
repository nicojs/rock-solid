import {
  Deelnemer,
  Aanmelding,
  InsertableAanmelding,
  UpdatableAanmelding,
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
import { toPlaats } from './plaats.mapper.js';

type DBAanmeldingAggregate = db.Aanmelding & {
  deelnemer: DBPersonAggregate | null;
  plaats: db.Plaats | null;
};

const includeDeelnemer = Object.freeze({
  deelnemer: Object.freeze({
    include: includePersoonAggregate,
  }),
  plaats: true,
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

  public async create(aanmelding: InsertableAanmelding): Promise<Aanmelding> {
    const { deelnemer, plaats, ...aanmeldingData } = aanmelding;
    const {
      verblijfadres,
      domicilieadres,
      eersteCursusAanmeldingId,
      eersteVakantieAanmeldingId,
      woonsituatie,
      werksituatie,
      geslacht,
    } = await this.db.persoon.findUniqueOrThrow({
      where: { id: aanmeldingData.deelnemerId },
      include: {
        verblijfadres: true,
        domicilieadres: true,
        eersteCursusAanmelding: true,
        eersteVakantieAanmelding: true,
      },
    });

    const dbAanmelding = await handleKnownPrismaErrors(
      this.db.aanmelding.create({
        data: {
          ...aanmeldingData,
          woonsituatie,
          werksituatie,
          geslacht,
          plaatsId:
            domicilieadres?.plaatsId ?? verblijfadres?.plaatsId ?? undefined,
        },
      }),
    );

    // Update eerste aanmelding
    const project = await this.db.project.findUniqueOrThrow({
      where: { id: aanmeldingData.projectId },
      include: { activiteiten: { orderBy: { van: 'asc' } } },
    });

    const dbEersteAanmeldingProjectId =
      project.type === 'cursus'
        ? eersteCursusAanmeldingId
        : eersteVakantieAanmeldingId;
    const dbEersteAanmelding = dbEersteAanmeldingProjectId
      ? await this.db.aanmelding.findUnique({
          where: { id: dbEersteAanmeldingProjectId },
          include: {
            project: {
              include: { activiteiten: { orderBy: { van: 'asc' } } },
            },
          },
        })
      : undefined;

    const firstActiviteit = project.activiteiten[0];
    const dbFirstActiviteit = dbEersteAanmelding?.project.activiteiten[0];
    const isEersteAanmelding = Boolean(
      !dbFirstActiviteit ||
        (firstActiviteit && dbFirstActiviteit.van > firstActiviteit.van),
    );

    if (isEersteAanmelding) {
      const data: Partial<
        Pick<
          db.Persoon,
          'eersteCursusAanmeldingId' | 'eersteVakantieAanmeldingId'
        >
      > = {};
      if (project.type === 'cursus') {
        data.eersteCursusAanmeldingId = dbAanmelding.id;
      } else {
        data.eersteVakantieAanmeldingId = dbAanmelding.id;
      }
      await this.db.persoon.update({
        where: { id: aanmeldingData.deelnemerId },
        data,
      });
    }

    // Refetch aanmelding to include deelnemer with fresh eerste deelname
    const dbAanmeldingWithDeelnemer =
      await this.db.aanmelding.findUniqueOrThrow({
        where: { id: dbAanmelding.id },
        include: includeDeelnemer,
      });
    return toAanmelding(dbAanmeldingWithDeelnemer);
  }

  public async update(
    id: number,
    aanmelding: Partial<Aanmelding>,
  ): Promise<Aanmelding> {
    const {
      deelnemer: persoon,
      deelnemerId,
      projectId,
      plaats,
      id: unused,
      ...aanmeldingData
    } = aanmelding;
    const dbAanmelding = await this.db.aanmelding.update({
      data: {
        ...aanmeldingData,
        plaatsId: plaats?.id,
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

  async delete(projectId: number, aanmeldingId: number): Promise<void> {
    await handleKnownPrismaErrors(
      this.db.aanmelding.delete({ where: { id: aanmeldingId, projectId } }),
    );
  }

  public updateAll(aanmeldingen: UpdatableAanmelding[]): Promise<Aanmelding[]> {
    return Promise.all(
      aanmeldingen.map((aanmelding) => this.update(aanmelding.id, aanmelding)),
    );
  }
}

function toAanmelding(raw: DBAanmeldingAggregate): Aanmelding {
  const { plaatsId, plaats, deelnemer, ...aanmelding } = raw;
  return {
    ...purgeNulls(aanmelding),
    plaats: plaats ? toPlaats(plaats) : undefined,
    deelnemer: deelnemer ? (toPersoon(deelnemer) as Deelnemer) : undefined,
  };
}
