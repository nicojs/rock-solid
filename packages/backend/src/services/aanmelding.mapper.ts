import {
  Deelnemer,
  Aanmelding,
  InsertableAanmelding,
  UpdatableAanmelding,
  PatchableAanmelding,
  Deelname,
  UpsertableDeelname,
  aanmeldingsstatussenWithoutDeelnames,
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
  deelnames: db.Deelname[];
};

const includeAanmeldingFields = Object.freeze({
  deelnemer: Object.freeze({
    include: includePersoonAggregate,
  }),
  deelnames: true,
  plaats: true,
} satisfies db.Prisma.AanmeldingInclude);

@Injectable()
export class AanmeldingMapper {
  constructor(private db: DBService) {}

  public async getAll(filter: { projectId: number }): Promise<Aanmelding[]> {
    const aanmeldingen = await this.db.aanmelding.findMany({
      where: filter,
      include: includeAanmeldingFields,
      orderBy: { deelnemer: { volledigeNaam: 'asc' } },
    });
    return aanmeldingen.map(toAanmelding);
  }

  public async create(aanmelding: InsertableAanmelding): Promise<Aanmelding> {
    const { deelnemer, plaats, status, deelnames, ...aanmeldingData } =
      aanmelding;
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
        include: includeAanmeldingFields,
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
      include: includeAanmeldingFields,
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

  async updateActiviteitDeelnames({
    activiteitId,
    deelnames,
  }: {
    projectId: number;
    activiteitId: number;
    deelnames: UpsertableDeelname[];
  }): Promise<void> {
    await this.db.$transaction(
      deelnames.map((deelname) => {
        if (deelname.id) {
          return this.db.deelname.update({
            where: { id: deelname.id },
            data: toDBDeelname(activiteitId, deelname),
          });
        } else {
          return this.db.deelname.create({
            data: toDBDeelname(activiteitId, deelname),
          });
        }
      }),
    );
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
        deelnames:
          status && aanmeldingsstatussenWithoutDeelnames.includes(status)
            ? {
                deleteMany: {},
              }
            : undefined,
      },
      where: {
        id,
      },
      include: includeAanmeldingFields,
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
    deelnames,
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
    deelnames:
      aanmelding.status &&
      aanmeldingsstatussenWithoutDeelnames.includes(aanmelding.status)
        ? { deleteMany: {} }
        : {
            update: deelnames?.map((deelname) => ({
              where: { id: deelname.id },
              data: toDBDeelnameWithoutAanmelding(
                deelname.activiteitId,
                deelname,
              ),
            })),
          },
  };
}

function toDBDeelnameWithoutAanmelding(
  activiteitId: number,
  deelname: UpsertableDeelname,
): db.Prisma.DeelnameCreateWithoutAanmeldingInput {
  return {
    activiteit: { connect: { id: activiteitId } },
    effectieveDeelnamePerunage: deelname.effectieveDeelnamePerunage,
    opmerking: deelname.opmerking,
  };
}
function toDBDeelname(
  activiteitId: number,
  deelname: UpsertableDeelname,
): db.Prisma.DeelnameCreateInput {
  return {
    ...toDBDeelnameWithoutAanmelding(activiteitId, deelname),
    aanmelding: { connect: { id: deelname.aanmeldingId } },
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
    deelnames,
    ...aanmelding
  } = raw;
  return {
    ...purgeNulls(aanmelding),
    status: aanmeldingsstatusMapper.toSchema(status),
    werksituatie: werksituatieMapper.toSchema(werksituatie),
    woonsituatie: woonsituatieMapper.toSchema(woonsituatie),
    geslacht: geslachtMapper.toSchema(geslacht),
    plaats: plaats ? toPlaats(plaats) : undefined,
    deelnames: deelnames.map(toDeelname),
    deelnemer: deelnemer ? (toPersoon(deelnemer) as Deelnemer) : undefined,
  };
}

function toDeelname(val: db.Deelname): Deelname {
  return {
    id: val.id,
    activiteitId: val.activiteitId,
    aanmeldingId: val.aanmeldingId,
    effectieveDeelnamePerunage: val.effectieveDeelnamePerunage,
    opmerking: val.opmerking ?? undefined,
  };
}
