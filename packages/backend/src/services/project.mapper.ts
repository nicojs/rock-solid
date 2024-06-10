import {
  AanmeldingOf,
  aanmeldingsstatussenWithoutDeelnames,
  Activiteit,
  BaseActiviteit,
  CursusActiviteit,
  Decimal,
  empty,
  notEmpty,
  OverigPersoon,
  Project,
  ProjectFilter,
  UpsertableActiviteit,
  UpsertableProject,
  VakantieActiviteit,
} from '@rock-solid/shared';
import { Injectable } from '@nestjs/common';
import { DBService } from './db.service.js';
import * as db from '@prisma/client';
import { Prisma } from '@prisma/client';
import { purgeNulls } from './mapper-utils.js';
import { toPage } from './paging.js';
import { handleKnownPrismaErrors } from '../errors/index.js';
import {
  DBPersonAggregate,
  includePersoonAggregate,
  toPersoon,
} from './persoon.mapper.js';
import {
  aanmeldingsstatusMapper,
  cursusCategorieMapper,
  doelgroepMapper,
  organisatieonderdeelMapper,
  projectTypeMapper,
  vakantieseizoenMapper,
  vakantieVerblijfMapper,
  vakantieVervoerMapper,
} from './enum.mapper.js';
import { includeAdresWithPlaats, DBAdresWithPlaats } from './adres.mapper.js';
import { toCursuslocatie } from './locatie.mapper.js';

const includeAggregate = {
  activiteiten: {
    orderBy: [
      {
        van: 'asc',
      },
    ],
    include: {
      deelnames: true,
      locatie: {
        include: {
          adres: includeAdresWithPlaats,
        },
      },
    },
  },
  begeleiders: {
    include: includePersoonAggregate,
  },
  _count: {
    select: {
      aanmeldingen: {
        where: {
          status: {
            in: [
              aanmeldingsstatusMapper.toDB('Aangemeld'),
              aanmeldingsstatusMapper.toDB('Bevestigd'),
            ],
          },
        },
      },
    },
  },
} as const satisfies Prisma.ProjectInclude;

/**
 * A data mapper for persoon
 * @see https://martinfowler.com/eaaCatalog/dataMapper.html
 */
@Injectable()
export class ProjectMapper {
  constructor(private db: DBService) {}

  public async getAll(
    filter: ProjectFilter,
    pageNumber: number | undefined,
  ): Promise<Project[]> {
    const whereStatement = where(filter);
    const paging = toPage(pageNumber);
    const orderBy = [
      { jaar: 'desc' },
      { projectnummer: 'desc' },
    ] as const satisfies db.Prisma.ProjectOrderByWithRelationInput[];

    const [dbProjecten, projectenAndBevestigdeAanmeldingen] = await Promise.all(
      [
        this.db.project.findMany({
          include: includeAggregate,
          where: whereStatement,
          ...paging,
          orderBy,
        }),
        this.db.project.findMany({
          where: whereStatement,
          ...paging,
          orderBy,
          include: {
            _count: {
              select: {
                aanmeldingen: {
                  where: {
                    status: {
                      notIn: aanmeldingsstatussenWithoutDeelnames.map(
                        aanmeldingsstatusMapper.toDB,
                      ),
                    },
                  },
                },
              },
            },
          },
        }),
      ],
    );
    const projecten = dbProjecten.map((dbProject) =>
      toProject(
        dbProject,
        projectenAndBevestigdeAanmeldingen.find((p) => p.id === dbProject.id)!
          ._count.aanmeldingen,
      ),
    );
    await this.enrichWithDeelnemersuren(
      projecten.flatMap((project) => project.activiteiten),
    );
    return projecten;
  }

  public async getAllProjectAanmeldingen(
    deelnemerId: number,
    filter: ProjectFilter,
  ) {
    filter.aanmeldingPersoonId = deelnemerId;
    const dbProjectenWithAanmelding = await this.db.project.findMany({
      include: {
        ...includeAggregate,
        aanmeldingen: {
          where: {
            deelnemerId,
          },
        },
      },
      where: where(filter),
      orderBy: [{ jaar: 'desc' }, { projectnummer: 'desc' }],
    });
    const projectAanmeldingen =
      dbProjectenWithAanmelding.map(toProjectAanmelding);
    await this.enrichWithDeelnemersuren(
      projectAanmeldingen.flatMap((project) => project.activiteiten),
    );
    return projectAanmeldingen;
  }

  async count(filter: ProjectFilter): Promise<number> {
    const count = await this.db.project.count({
      where: where(filter),
    });
    return count;
  }

  private async enrichWithDeelnemersuren(activiteiten: Activiteit[]) {
    if (activiteiten.length) {
      const deelnemersurenResult = await this.db.$queryRaw<
        { id: number; deelnemersuren: number }[]
      >`
    SELECT activiteit.id, SUM(deelname."effectieveDeelnamePerunage" * vormingsuren) as deelnemersuren
    FROM activiteit
    INNER JOIN deelname ON deelname."activiteitId" = activiteit.id
    WHERE activiteit.id IN (${Prisma.join(activiteiten.map(({ id }) => id))})
    GROUP BY activiteit.id`;
      for (const activiteit of activiteiten) {
        activiteit.aantalDeelnemersuren =
          deelnemersurenResult.find(({ id }) => id === activiteit.id)
            ?.deelnemersuren ?? 0;
      }
    }
  }

  async getOne(where: { id: number }): Promise<Project | null> {
    const [dbProject, aantalBevestigdeAanmeldingen] = await Promise.all([
      this.db.project.findUnique({
        where,
        include: includeAggregate,
      }),
      this.countBevestigdeAanmeldingen(where.id),
    ]);
    if (dbProject) {
      const project = toProject(dbProject, aantalBevestigdeAanmeldingen);
      await this.enrichWithDeelnemersuren(project.activiteiten);
      return project;
    }
    return null;
  }

  async createProject(newProject: UpsertableProject): Promise<Project> {
    const dbProject = await handleKnownPrismaErrors(
      this.db.project.create({
        data: {
          ...toDBProject(newProject),
          activiteiten: {
            create: newProject.activiteiten.map(toCreateDBActiviteit),
          },
          begeleiders: {
            connect: newProject.begeleiders?.map(({ id }) => ({ id })),
          },
        },
        include: includeAggregate,
      }),
    );
    const project = toProject(
      dbProject,
      await this.countBevestigdeAanmeldingen(dbProject.id),
    );
    await this.enrichWithDeelnemersuren(project.activiteiten);
    return project;
  }

  async updateProject(
    id: number,
    projectUpdates: UpsertableProject,
  ): Promise<Project> {
    const begeleiderIds =
      projectUpdates.begeleiders?.map(({ id }) => ({ id })) ?? [];
    const [result, aantalBevestigdeAanmeldingen] = await Promise.all([
      handleKnownPrismaErrors(
        this.db.project.update({
          where: { id },
          data: {
            ...toDBProject(projectUpdates),
            activiteiten: {
              deleteMany: {
                projectId: id,
                id: {
                  notIn: projectUpdates.activiteiten
                    .map(({ id }) => id)
                    .filter(notEmpty),
                },
              },
              create: projectUpdates.activiteiten
                .filter((act) => empty(act.id))
                .map(toCreateDBActiviteit),
              updateMany: projectUpdates.activiteiten
                .filter((act) => notEmpty(act.id))
                .map((act) => ({
                  where: {
                    id: act.id!,
                  },
                  data: toUpdateManyDBActiviteit(act),
                })),
            },
            begeleiders: { set: begeleiderIds },
          },
          include: includeAggregate,
        }),
      ),
      this.countBevestigdeAanmeldingen(id),
    ]);
    const project = toProject(result, aantalBevestigdeAanmeldingen);
    await this.enrichWithDeelnemersuren(project.activiteiten);
    return project;
  }

  private async countBevestigdeAanmeldingen(projectId: number) {
    return await this.db.aanmelding.count({
      where: {
        projectId: projectId,
        status: {
          notIn: aanmeldingsstatussenWithoutDeelnames.map(
            aanmeldingsstatusMapper.toDB,
          ),
        },
      },
    });
  }

  async delete(id: number) {
    await handleKnownPrismaErrors(this.db.project.delete({ where: { id } }));
  }
}

function toDBProject(project: UpsertableProject): db.Prisma.ProjectCreateInput {
  const jaar = determineYear(project);
  const {
    activiteiten,
    begeleiders,
    aantalInschrijvingen: aantalAanmeldingen,
    type,
    prijs,
    saldo,
    voorschot,
    ...projectData
  } = project;
  if (project.type === 'vakantie') {
    const naam = `${project.bestemming} - ${project.land}`;
    return {
      ...projectData,
      organisatieonderdeel: undefined,
      voorschot: voorschot ?? null,
      saldo: saldo ?? null,
      seizoen: vakantieseizoenMapper.toDB(project.seizoen),
      titel: toTitel(projectData.projectnummer, naam),
      type: projectTypeMapper.toDB('vakantie'),
      doelgroep: undefined,
      categorie: undefined,
      jaar,
      naam,
    };
  } else {
    return {
      ...projectData,
      organisatieonderdeel: organisatieonderdeelMapper.toDB(
        project.organisatieonderdeel,
      ),
      saldo: saldo ?? null,
      voorschot: voorschot ?? null,
      seizoen: vakantieseizoenMapper.toDB(undefined),
      titel: toTitel(projectData.projectnummer, project.naam),
      type: projectTypeMapper.toDB('cursus'),
      doelgroep: doelgroepMapper.toDB(project.doelgroep),
      categorie: cursusCategorieMapper.toDB(project.categorie),
      jaar,
      naam: project.naam,
    };
  }
}

function toCreateDBActiviteit(
  activiteit: UpsertableActiviteit,
): db.Prisma.ActiviteitCreateWithoutProjectInput {
  const {
    aantalDeelnemersuren,
    aantalDeelnames,
    vormingsuren,
    begeleidingsuren,
    verblijf,
    vervoer,
    locatie,
    isCompleted,
    id,
    ...data
  } = activiteit;
  return {
    ...data,
    verblijf: vakantieVerblijfMapper.toDB(verblijf),
    vervoer: vakantieVervoerMapper.toDB(vervoer),
    vormingsuren: vormingsuren ?? null,
    begeleidingsuren: begeleidingsuren ?? null,
    locatie: locatie
      ? {
          connect: {
            id: locatie.id,
          },
        }
      : undefined,
  };
}

function toUpdateManyDBActiviteit({
  locatie,
  ...activiteit
}: UpsertableActiviteit): db.Prisma.ActiviteitUncheckedUpdateManyInput {
  return {
    ...toCreateDBActiviteit(activiteit),
    locatieId: locatie?.id ?? null,
  };
}

function determineYear(project: UpsertableProject) {
  // 1. Try to pick the year from the first activity
  if (project.activiteiten[0]?.van) {
    return project.activiteiten[0].van.getFullYear();
  }
  // 2. Try to pick the year from the projectnummer
  const [, year] = project.projectnummer.split('/');
  if (year && /^\d\d$/.test(year)) {
    return parseInt(year) + 2000;
  }
  // 3. Fallback to today's year
  return new Date().getFullYear();
}

type DBActiviteitAggregate = db.Activiteit & {
  deelnames: db.Deelname[];
  locatie: {
    id: number;
    naam: string;
    opmerking: string | null;
    adres: DBAdresWithPlaats | null;
  } | null;
};

interface DBProjectAggregate extends db.Project {
  activiteiten: DBActiviteitAggregate[];
  begeleiders: DBPersonAggregate[];
  _count: {
    aanmeldingen: number;
  };
}

function toProjectAanmelding(
  projectWithAanmelding: DBProjectAggregate & { aanmeldingen: db.Aanmelding[] },
  aantalBevestigdeAanmeldingen: number,
): AanmeldingOf<Project> {
  return {
    ...toProject(projectWithAanmelding, aantalBevestigdeAanmeldingen),
    status: aanmeldingsstatusMapper.toSchema(
      projectWithAanmelding.aanmeldingen[0]!.status,
    ),
  };
}

function toProject(
  {
    type,
    begeleiders,
    _count,
    bestemming,
    land,
    ...projectProperties
  }: DBProjectAggregate,
  aantalBevestigdeAanmeldingen: number,
): Project {
  const project = purgeNulls({
    type,
    begeleiders: begeleiders.map(toPersoon) as OverigPersoon[],
    aantalInschrijvingen: _count.aanmeldingen,
    id: projectProperties.id,
    projectnummer: projectProperties.projectnummer,
    jaar: projectProperties.jaar,
    naam: projectProperties.naam,
    voorschot: projectProperties.voorschot,
    saldo: projectProperties.saldo,
  });
  const saldo = project.saldo ?? undefined;
  const voorschot = project.voorschot;
  const prijs = calculatePrijs(saldo, voorschot);
  switch (type) {
    case projectTypeMapper.toDB('cursus'):
      return {
        ...project,
        type: 'cursus',
        activiteiten:
          projectProperties.activiteiten?.map((act) =>
            toCursusActiviteit(act, aantalBevestigdeAanmeldingen),
          ) ?? [],
        organisatieonderdeel: organisatieonderdeelMapper.toSchema(
          projectProperties.organisatieonderdeel!,
        ),
        doelgroep: doelgroepMapper.toSchema(projectProperties.doelgroep),
        categorie: cursusCategorieMapper.toSchema(projectProperties.categorie)!,
        saldo,
        prijs,
      };
    case projectTypeMapper.toDB('vakantie'):
      return {
        ...project,
        activiteiten:
          projectProperties.activiteiten?.map((act) =>
            toVakantieActiviteit(act, aantalBevestigdeAanmeldingen),
          ) ?? [],
        saldo,
        voorschot,
        prijs,
        seizoen: vakantieseizoenMapper.toSchema(projectProperties.seizoen),
        type: 'vakantie',
        bestemming: bestemming!,
        land: land!,
      };
    default:
      throw new Error(`Project type ${type} not supported`);
  }
}

function calculatePrijs(
  saldo: Decimal | undefined,
  voorschot: Decimal | undefined,
) {
  let prijs: Decimal | undefined;
  if (saldo !== undefined || voorschot !== undefined) {
    prijs = new Decimal(0);
    if (saldo !== undefined) {
      prijs = saldo;
    }
    if (voorschot !== undefined) {
      prijs = voorschot.add(prijs);
    }
  }
  return prijs;
}

function toCursusActiviteit(
  dbActiviteit: DBActiviteitAggregate,
  aantalBevestigdeAanmeldingen: number,
): CursusActiviteit {
  return {
    ...toBaseActiviteit(dbActiviteit, aantalBevestigdeAanmeldingen),
    locatie: toCursuslocatie(dbActiviteit.locatie),
  };
}

function toVakantieActiviteit(
  val: DBActiviteitAggregate,
  aantalBevestigdeAanmeldingen: number,
): VakantieActiviteit {
  return {
    ...toBaseActiviteit(val, aantalBevestigdeAanmeldingen),
    verblijf: vakantieVerblijfMapper.toSchema(val.verblijf),
    vervoer: vakantieVervoerMapper.toSchema(val.vervoer),
  };
}

function toBaseActiviteit(
  val: DBActiviteitAggregate,
  aantalBevestigdeAanmeldingen: number,
): BaseActiviteit {
  const { id, deelnames, vormingsuren, begeleidingsuren, van, totEnMet } =
    purgeNulls(val);
  return {
    id,
    van,
    totEnMet,
    vormingsuren,
    begeleidingsuren,
    aantalDeelnames: deelnames.reduce(
      (acc, deelname) =>
        deelname.effectieveDeelnamePerunage > 0 ? acc + 1 : acc,
      0,
    ),
    aantalDeelnemersuren: deelnames.reduce(
      (acc, deelname) =>
        deelname.effectieveDeelnamePerunage * (vormingsuren ?? 0) + acc,
      0,
    ),
    isCompleted:
      (aantalBevestigdeAanmeldingen > 0 &&
        deelnames.length === aantalBevestigdeAanmeldingen) ||
      (aantalBevestigdeAanmeldingen === 0 && totEnMet < new Date()),
  };
}

function where(filter: ProjectFilter): db.Prisma.ProjectWhereInput {
  const whereClause: db.Prisma.ProjectWhereInput = {
    type: projectTypeMapper.toDB(filter.type),
  };
  if (filter.aanmeldingPersoonId) {
    whereClause.aanmeldingen = {
      some: { deelnemerId: filter.aanmeldingPersoonId },
    };
  }
  if (filter.begeleidDoorPersoonId) {
    whereClause.begeleiders = {
      some: { id: filter.begeleidDoorPersoonId },
    };
  }
  if (filter.titelLike) {
    whereClause.titel = { contains: filter.titelLike };
  }
  if (filter.organisatieonderdelen) {
    whereClause.organisatieonderdeel = {
      in: filter.organisatieonderdelen.map(organisatieonderdeelMapper.toDB),
    };
  }
  if (filter.doelgroepen) {
    whereClause.doelgroep = {
      in: filter.doelgroepen.map(doelgroepMapper.toDB),
    };
  }
  whereClause.jaar = filter.jaar;
  return whereClause;
}

export function toTitel(projectnummer: string, projectNaam: string): string {
  return `${projectnummer} ${projectNaam}`;
}
