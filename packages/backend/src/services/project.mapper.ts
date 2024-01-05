import {
  AanmeldingOf,
  Activiteit,
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
  organisatieonderdeelMapper,
  projectTypeMapper,
  vakantieseizoenMapper,
  vakantieVerblijfMapper,
  vakantieVervoerMapper,
} from './enum.mapper.js';

const includeAggregate = {
  activiteiten: {
    orderBy: [
      {
        van: 'asc' as const,
      },
    ],
    include: {
      _count: {
        select: {
          deelnames: true as const,
        },
      },
    },
  },
  begeleiders: {
    include: includePersoonAggregate,
  },
  _count: {
    select: {
      aanmeldingen: true as const,
    },
  },
} satisfies Prisma.ProjectInclude;

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
    const dbProjecten = await this.db.project.findMany({
      include: includeAggregate,
      where: where(filter),
      ...toPage(pageNumber),
      orderBy: [{ jaar: 'desc' }, { projectnummer: 'desc' }],
    });
    const projecten = dbProjecten.map(toProject);
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
    const dbProject = await this.db.project.findUnique({
      where,
      include: includeAggregate,
    });
    if (dbProject) {
      const project = toProject(dbProject);
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
            create: newProject.activiteiten.map(toDBActiviteit),
          },
          begeleiders: {
            connect: newProject.begeleiders?.map(({ id }) => ({ id })),
          },
        },
        include: includeAggregate,
      }),
    );
    const project = toProject(dbProject);
    await this.enrichWithDeelnemersuren(project.activiteiten);
    return project;
  }

  async updateProject(
    id: number,
    projectUpdates: UpsertableProject,
  ): Promise<Project> {
    const begeleiderIds =
      projectUpdates.begeleiders?.map(({ id }) => ({ id })) ?? [];
    const result = await handleKnownPrismaErrors(
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
              .map(toDBActiviteit),
            updateMany: projectUpdates.activiteiten
              .filter((act) => notEmpty(act.id))
              .map((act) => ({
                where: {
                  id: act.id!,
                },
                data: toDBActiviteit(act),
              })),
          },
          begeleiders: { set: begeleiderIds },
        },
        include: includeAggregate,
      }),
    );
    const project = toProject(result);
    await this.enrichWithDeelnemersuren(project.activiteiten);
    return project;
  }

  async delete(id: number) {
    await handleKnownPrismaErrors(this.db.project.delete({ where: { id } }));
  }
}

function toDBProject(project: UpsertableProject): db.Prisma.ProjectCreateInput {
  const jaar = determineYear(project.activiteiten);
  const {
    activiteiten,
    begeleiders,
    aantalAanmeldingen,
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
      jaar,
      naam: project.naam,
    };
  }
}

function toDBActiviteit(
  activiteit: UpsertableActiviteit,
): db.Prisma.ActiviteitCreateWithoutProjectInput {
  const {
    aantalDeelnemersuren,
    aantalDeelnames,
    metOvernachting: unused,
    vormingsuren,
    begeleidingsuren,
    verblijf,
    vervoer,
    ...data
  } = activiteit;
  const { van, totEnMet } = data;
  const metOvernachting =
    van.getFullYear() !== totEnMet.getFullYear() ||
    van.getMonth() !== totEnMet.getMonth() ||
    van.getDate() !== totEnMet.getDate();
  return {
    ...data,
    verblijf: vakantieVerblijfMapper.toDB(verblijf),
    vervoer: vakantieVervoerMapper.toDB(vervoer),
    vormingsuren: vormingsuren ?? null,
    begeleidingsuren: begeleidingsuren ?? null,
    metOvernachting,
  };
}

function determineYear(activiteiten: UpsertableActiviteit[]) {
  return activiteiten[0]?.van.getFullYear() ?? new Date().getFullYear(); // current year as default 🤷‍♂️
}

type DBActiviteitAggregate = db.Activiteit & {
  _count: {
    deelnames: number;
  };
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
): AanmeldingOf<Project> {
  return {
    ...toProject(projectWithAanmelding),
    status: aanmeldingsstatusMapper.toSchema(
      projectWithAanmelding.aanmeldingen[0]!.status,
    ),
  };
}

function toProject({
  type,
  begeleiders,
  _count,
  bestemming,
  land,
  ...projectProperties
}: DBProjectAggregate): Project {
  const project = purgeNulls({
    type,
    begeleiders: begeleiders.map(toPersoon) as OverigPersoon[],
    aantalAanmeldingen: _count.aanmeldingen,
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
          projectProperties.activiteiten?.map(toCursusActiviteit) ?? [],
        organisatieonderdeel: organisatieonderdeelMapper.toSchema(
          projectProperties.organisatieonderdeel!,
        ),
        saldo,
        prijs,
      };
    case projectTypeMapper.toDB('vakantie'):
      return {
        ...project,
        activiteiten:
          projectProperties.activiteiten?.map(toVakantieActiviteit) ?? [],
        saldo,
        voorschot,
        prijs,
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

function toCursusActiviteit(val: DBActiviteitAggregate): CursusActiviteit {
  const { projectId, verblijf, vervoer, _count, ...activiteitData } =
    purgeNulls(val);
  return {
    ...activiteitData,
    aantalDeelnames: _count.deelnames,
    aantalDeelnemersuren: -1,
  };
}

function toVakantieActiviteit(val: DBActiviteitAggregate): VakantieActiviteit {
  const { projectId, _count, verblijf, vervoer, ...activiteitData } =
    purgeNulls(val);
  return {
    ...activiteitData,
    verblijf: vakantieVerblijfMapper.toSchema(verblijf),
    vervoer: vakantieVervoerMapper.toSchema(vervoer),
    aantalDeelnames: _count.deelnames,
    aantalDeelnemersuren: -1,
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
  whereClause.jaar = filter.jaar;
  return whereClause;
}

export function toTitel(projectnummer: string, projectNaam: string): string {
  return `${projectnummer} ${projectNaam}`;
}
