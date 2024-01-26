import {
  Deelnemer,
  Aanmelding,
  InsertableAanmelding,
  UpdatableAanmelding,
  PatchableAanmelding,
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
import {
  aanmeldingsstatusMapper,
  geslachtMapper,
  projectTypeMapper,
  werksituatieMapper,
  woonsituatieMapper,
} from './enum.mapper.js';

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
    const { deelnemer, plaats, status, ...aanmeldingData } = aanmelding;
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
          status: aanmeldingsstatusMapper.toDB(status),
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
      project.type === projectTypeMapper.toDB('cursus')
        ? eersteCursusAanmeldingId
        : eersteVakantieAanmeldingId;

    const isEersteAanmelding = await this.determineIsEersteAanmelding(
      project,
      dbEersteAanmeldingProjectId,
    );

    if (isEersteAanmelding) {
      const data: Partial<
        Pick<
          db.Persoon,
          'eersteCursusAanmeldingId' | 'eersteVakantieAanmeldingId'
        >
      > = {};
      if (project.type === projectTypeMapper.toDB('cursus')) {
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

  private async determineIsEersteAanmelding(
    project: db.Project & { activiteiten: db.Activiteit[] },
    currentEersteAanmeldingProjectId: number | null,
  ) {
    const firstActiviteit = project.activiteiten[0];
    const dbEersteAanmelding =
      (currentEersteAanmeldingProjectId
        ? await this.db.aanmelding.findUnique({
            where: { id: currentEersteAanmeldingProjectId },
            include: {
              project: {
                include: { activiteiten: { orderBy: { van: 'asc' } } },
              },
            },
          })
        : undefined) ?? undefined;
    const dbFirstActiviteit = dbEersteAanmelding?.project.activiteiten[0];
    if (!dbFirstActiviteit) {
      // Either an old project without activiteiten or the first aanmelding
      if (dbEersteAanmelding) {
        if (dbEersteAanmelding.project.jaar <= project.jaar) {
          // This is an older project, older projects don't have activiteiten
          return false;
        }
      }

      return true;
    }

    return Boolean(
      firstActiviteit && dbFirstActiviteit.van > firstActiviteit.van,
    );
  }

  public async update(
    id: number,
    aanmelding: UpdatableAanmelding,
  ): Promise<Aanmelding> {
    const dbAanmelding = await this.db.aanmelding.update({
      data: toUpdateAanmeldingData(aanmelding),
      where: { id },
      include: includeDeelnemer,
    });
    if (
      aanmelding.overrideDeelnemerFields &&
      dbAanmelding.deelnemerId !== null
    ) {
      await this.db.persoon.update({
        data: {
          werksituatie: dbAanmelding.werksituatie,
          woonsituatie: dbAanmelding.woonsituatie,
          geslacht: dbAanmelding.geslacht,
        },
        where: { id: dbAanmelding.deelnemerId },
      });
    }
    return toAanmelding(dbAanmelding);
  }

  public async patch(
    id: number,
    aanmelding: PatchableAanmelding,
  ): Promise<Aanmelding> {
    const {
      plaats,
      werksituatie,
      woonsituatie,
      geslacht,
      bevestigingsbriefVerzondenOp,
      rekeninguittrekselNummer,
      tijdstipVanAanmelden,
      vervoersbriefVerzondenOp,
      status,
      opmerking,
    } = aanmelding;
    const dbAanmelding = await this.db.aanmelding.update({
      data: {
        bevestigingsbriefVerzondenOp,
        tijdstipVanAanmelden,
        vervoersbriefVerzondenOp,
        opmerking,
        rekeninguittrekselNummer,
        status: aanmeldingsstatusMapper.toDB(status),
        werksituatie: werksituatieMapper.toDB(werksituatie),
        woonsituatie: woonsituatieMapper.toDB(woonsituatie),
        geslacht: geslachtMapper.toDB(geslacht),
        plaatsId: plaats?.id,
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

  public patchAll(aanmeldingen: PatchableAanmelding[]): Promise<Aanmelding[]> {
    aanmeldingen[0]?.rekeninguittrekselNummer;
    return Promise.all(
      aanmeldingen.map((aanmelding) => this.patch(aanmelding.id, aanmelding)),
    );
  }
}

function toUpdateAanmeldingData(
  aanmelding: UpdatableAanmelding,
): db.Prisma.AanmeldingUpdateInput {
  const {
    plaats,
    projectId,
    id,
    deelnemer,
    opmerking,
    deelnemerId,
    rekeninguittrekselNummer,
    overrideDeelnemerFields,
    ...aanmeldingData
  } = aanmelding;
  return {
    ...aanmeldingData,
    rekeninguittrekselNummer: rekeninguittrekselNummer ?? null,
    status: aanmeldingsstatusMapper.toDB(aanmelding.status),
    werksituatie: werksituatieMapper.toDB(aanmelding.werksituatie) ?? null,
    woonsituatie: woonsituatieMapper.toDB(aanmelding.woonsituatie) ?? null,
    geslacht: geslachtMapper.toDB(aanmelding.geslacht) ?? null,
    opmerking: opmerking ?? null,
    plaats: plaats ? { connect: { id: plaats.id } } : { disconnect: true },
  };
}

function toAanmelding(raw: DBAanmeldingAggregate): Aanmelding {
  const {
    plaatsId,
    plaats,
    deelnemer,
    werksituatie,
    woonsituatie,
    geslacht,
    status,
    ...aanmelding
  } = raw;
  return {
    ...purgeNulls(aanmelding),
    status: aanmeldingsstatusMapper.toSchema(status),
    werksituatie: werksituatieMapper.toSchema(werksituatie),
    woonsituatie: woonsituatieMapper.toSchema(woonsituatie),
    geslacht: geslachtMapper.toSchema(geslacht),
    plaats: plaats ? toPlaats(plaats) : undefined,
    deelnemer: deelnemer ? (toPersoon(deelnemer) as Deelnemer) : undefined,
  };
}
