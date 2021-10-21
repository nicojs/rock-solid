import {
  Activiteit,
  BaseProject,
  empty,
  notEmpty,
  Project,
  UpsertableProject,
} from '@kei-crm/shared';
import { Injectable } from '@nestjs/common';
import { DBService } from './db.service';
import * as db from '@prisma/client';
import { purgeNulls } from './mapper-utils';

const includeQuery = {
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

  public async getAll(): Promise<Project[]> {
    const projecten = await this.db.project.findMany({
      include: includeQuery,
    });
    return projecten.map(toProject);
  }

  async getOne(where: Partial<Project>): Promise<Project | null> {
    const project = await this.db.project.findUnique({
      where,
      include: includeQuery,
    });
    return project ? toProject(project) : null;
  }

  async createProject(newProject: UpsertableProject): Promise<Project> {
    const project = await this.db.project.create({
      data: {
        ...newProject,
        activiteiten: {
          create: newProject.activiteiten,
        },
      },
      include: includeQuery,
    });
    return toProject(project);
  }

  async updateProject(id: number, project: UpsertableProject): Promise<void> {
    const { aantalInschrijvingen, ...data } = project;
    await this.db.$transaction([
      this.db.activiteit.deleteMany({
        where: {
          projectId: id,
          id: {
            notIn: project.activiteiten.map(({ id }) => id).filter(notEmpty),
          },
        },
      }),
      this.db.project.update({
        where: { id },
        data: {
          ...data,
          activiteiten: {
            create: project.activiteiten.filter((act) => empty(act.id)),
            updateMany: project.activiteiten
              .filter((act) => notEmpty(act.id))
              .map((act) => {
                // const { ...data } = act;
                return {
                  where: {
                    id: act.id!,
                  },
                  data: act,
                };
              }),
          },
        },
      }),
    ]);
  }
}

type ActiviteitQueryResult = db.Activiteit & {
  _count?: {
    deelnames?: number;
  } | null;
};

interface ProjectQueryResult extends db.Project {
  activiteiten: ActiviteitQueryResult[];
  _count: {
    inschrijvingen: number;
  } | null;
}

function toProject(val: ProjectQueryResult): Project {
  const { type, _count, ...projectProperties } = val;
  const project: BaseProject = purgeNulls({
    type,
    ...projectProperties,
    activiteiten: val.activiteiten?.map(toActiviteit) ?? [],
    aantalInschrijvingen: _count?.inschrijvingen,
  });
  switch (type) {
    case 'cursus':
      return {
        ...project,
        type,
        organisatieonderdeel: val.organisatieonderdeel!,
        overnachting: val.overnachting!,
      };
    case 'vakantie':
      return {
        ...project,
        type,
      };
    default:
      const none: never = type;
      throw new Error(`Project type ${none} not supported`);
  }
}

function toActiviteit(val: ActiviteitQueryResult): Activiteit {
  const { projectId, _count, ...act } = purgeNulls(val);
  return {
    ...act,
    aantalDeelnames: _count?.deelnames,
  };
}
