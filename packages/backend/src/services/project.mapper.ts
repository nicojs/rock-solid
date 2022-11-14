import {
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
      inschrijvingen: true as const,
    },
  },
};

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
    });
    const projecten = dbProjecten.map(toProject);
    await this.enrichWithDeelnemersuren(
      projecten.flatMap((project) => project.activiteiten),
    );
    return projecten;
  }

  async count(filter: ProjectFilter): Promise<number> {
    const count = await this.db.project.count({
      where: where(filter),
    });
    return count;
  }

  private async enrichWithDeelnemersuren(activiteiten: CursusActiviteit[]) {
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
        activiteit.aantalDeelnemersuren = deelnemersurenResult.find(
          ({ id }) => id === activiteit.id,
        )?.deelnemersuren;
      }
    }
  }

  async getOne(where: Partial<Project>): Promise<Project | null> {
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
    const project = await handleKnownPrismaErrors(
      this.db.project.create({
        data: {
          ...newProject,
          jaar: determineYear(newProject.activiteiten),
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
    return toProject(project);
  }

  async updateProject(
    id: number,
    project: UpsertableProject,
  ): Promise<Project> {
    const { aantalInschrijvingen, begeleiders, ...data } = project;
    const begeleiderIds = begeleiders?.map(({ id }) => ({ id })) ?? [];
    const result = await handleKnownPrismaErrors(
      this.db.project.update({
        where: { id },
        data: {
          ...data,
          jaar: determineYear(data.activiteiten),
          activiteiten: {
            deleteMany: {
              projectId: id,
              id: {
                notIn: project.activiteiten
                  .map(({ id }) => id)
                  .filter(notEmpty),
              },
            },
            create: project.activiteiten
              .filter((act) => empty(act.id))
              .map(toDBActiviteit),
            updateMany: project.activiteiten
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
    return toProject(result);
  }
}

function toDBActiviteit(
  activiteit: UpsertableActiviteit,
): db.Prisma.ActiviteitCreateWithoutProjectInput {
  const {
    aantalDeelnemersuren,
    aantalDeelnames,
    metOvernachting: unused,
    ...data
  } = activiteit;
  const { van, totEnMet } = data;
  const metOvernachting =
    van.getFullYear() !== totEnMet.getFullYear() ||
    van.getMonth() !== totEnMet.getMonth() ||
    van.getDate() !== totEnMet.getDate();
  return {
    ...data,
    metOvernachting,
  };
}

function determineYear(activiteiten: UpsertableActiviteit[]) {
  return activiteiten[0]?.van.getFullYear() ?? new Date().getFullYear(); // current year as default 🤷‍♂️
}

type DBActiviteitAggregate = db.Activiteit & {
  _count?: {
    deelnames?: number;
  } | null;
};

interface DBProjectAggregate extends db.Project {
  activiteiten: DBActiviteitAggregate[];
  begeleiders: DBPersonAggregate[];
  _count: {
    inschrijvingen: number;
  } | null;
}

function toProject(val: DBProjectAggregate): Project {
  const { type, _count, begeleiders, ...projectProperties } = val;
  const project = purgeNulls({
    type,
    begeleiders: begeleiders.map(toPersoon) as OverigPersoon[],
    ...projectProperties,
    aantalInschrijvingen: _count?.inschrijvingen,
  });
  switch (type) {
    case 'cursus':
      return {
        ...project,
        type,
        activiteiten: val.activiteiten?.map(toCursusActiviteit) ?? [],
        organisatieonderdeel: val.organisatieonderdeel!,
      };
    case 'vakantie':
      return {
        ...project,
        activiteiten: val.activiteiten?.map(toVakantieActiviteit) ?? [],
        prijs: project.prijs as Decimal | undefined,
        voorschot: project.voorschot as Decimal | undefined,
        type,
      };
    default:
      const none: never = type;
      throw new Error(`Project type ${none} not supported`);
  }
}

function toCursusActiviteit(val: DBActiviteitAggregate): CursusActiviteit {
  const { projectId, verblijf, vervoer, _count, ...act } = purgeNulls(val);
  return {
    ...act,
    aantalDeelnames: _count?.deelnames,
  };
}

function toVakantieActiviteit(val: DBActiviteitAggregate): VakantieActiviteit {
  const { projectId, vormingsuren, _count, ...act } = purgeNulls(val);
  return {
    ...act,
    aantalDeelnames: _count?.deelnames,
  };
}

function where(filter: ProjectFilter): db.Prisma.ProjectWhereInput {
  const whereClause: db.Prisma.ProjectWhereInput = { type: filter.type };
  if (filter.inschrijvingPersoonId) {
    whereClause.inschrijvingen = {
      some: { deelnemerId: filter.inschrijvingPersoonId },
    };
  }
  if (filter.begeleidDoorPersoonId) {
    whereClause.begeleiders = {
      some: { id: filter.begeleidDoorPersoonId },
    };
  }
  return whereClause;
}
