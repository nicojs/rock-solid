import { Injectable } from '@nestjs/common';
import { OverigPersoon, Vervoerstoer } from '@rock-solid/shared';
import { Prisma } from '../../generated/prisma/index.js';
import * as db from '../../generated/prisma/index.js';
import { handleKnownPrismaErrors } from '../errors/index.js';
import { DBService } from './db.service.js';
import {
  DBLocatieAggregate,
  includeAdres,
  toLocatie,
} from './locatie.mapper.js';
import {
  DBPersonAggregate,
  includePersoonAggregate,
  toPersoon,
} from './persoon.mapper.js';
import {
  DBAanmeldingAggregate,
  includeAanmeldingFields,
  toAanmelding,
} from './aanmelding.mapper.js';

type DBVervoerstoerAggregate = db.Vervoerstoer & {
  projects: db.Project[];
  vervoerstoerRoutes: (db.VervoerstoerRoute & {
    chauffeur: DBPersonAggregate | null;
    stops: (db.VervoerstoerStop & {
      locatie: DBLocatieAggregate;
      aanmeldersToPickup: DBAanmeldingAggregate[];
    })[];
  })[];
};

const includeVervoerstoerAggregate = {
  projects: {
    orderBy: {
      projectnummer: 'asc',
    },
  },
  vervoerstoerRoutes: {
    orderBy: {
      id: 'asc',
    },
    include: {
      chauffeur: {
        include: includePersoonAggregate,
      },
      stops: {
        orderBy: {
          volgnummer: 'asc',
        },
        include: {
          locatie: {
            include: includeAdres,
          },
          aanmeldersToPickup: {
            include: includeAanmeldingFields,
          },
        },
      },
    },
  },
} as const satisfies Prisma.VervoerstoerInclude;

@Injectable()
export class VervoerstoerMapper {
  constructor(private readonly db: DBService) {}

  async getAll(): Promise<Vervoerstoer[]> {
    const dbVervoerstoeren = await this.db.vervoerstoer.findMany({
      include: includeVervoerstoerAggregate,
      orderBy: {
        id: 'asc',
      },
    });
    return dbVervoerstoeren.map(toVervoerstoer);
  }

  async create(vervoerstoer: Vervoerstoer): Promise<Vervoerstoer> {
    const created = await handleKnownPrismaErrors(
      this.db.vervoerstoer.create({
        data: toCreateInput(vervoerstoer),
        include: includeVervoerstoerAggregate,
      }),
    );
    return toVervoerstoer(created);
  }

  async update(vervoerstoer: Vervoerstoer): Promise<Vervoerstoer> {
    const updated = await handleKnownPrismaErrors(
      this.db.vervoerstoer.update({
        where: {
          id: vervoerstoer.id,
        },
        data: toUpdateInput(vervoerstoer),
        include: includeVervoerstoerAggregate,
      }),
    );
    return toVervoerstoer(updated);
  }
}

function toCreateInput(
  vervoerstoer: Vervoerstoer,
): Prisma.VervoerstoerCreateInput {
  return {
    projects: {
      connect: vervoerstoer.projectIds.map((id) => ({ id })),
    },
    vervoerstoerRoutes: {
      create: toRouteCreateInput(vervoerstoer),
    },
  };
}

function toUpdateInput(
  vervoerstoer: Vervoerstoer,
): Prisma.VervoerstoerUpdateInput {
  return {
    projects: {
      set: vervoerstoer.projectIds.map((id) => ({ id })),
    },
    vervoerstoerRoutes: {
      deleteMany: {},
      create: toRouteCreateInput(vervoerstoer),
    },
  };
}

function toRouteCreateInput(vervoerstoer: Vervoerstoer) {
  return vervoerstoer.routes.map((route) => ({
    chauffeur: {
      connect: {
        id: route.chauffeur.id,
      },
    },
    stops: {
      create: route.stops.map((stop) => ({
        volgnummer: stop.volgnummer,
        locatie: {
          connect: {
            id: stop.locatie.id,
          },
        },
        aanmeldersToPickup: {
          connect: stop.aanmeldersOpTePikken.map((a) => ({ id: a.id })),
        },
        geplandeAankomst: stop.geplandeAankomst ?? null,
      })),
    },
  }));
}

function toVervoerstoer(dbVervoerstoer: DBVervoerstoerAggregate): Vervoerstoer {
  return {
    id: dbVervoerstoer.id,
    naam: toNaam(dbVervoerstoer),
    projectIds: dbVervoerstoer.projects.map((project) => project.id),
    routes: dbVervoerstoer.vervoerstoerRoutes.flatMap((route) => {
      if (!route.chauffeur) return [];
      return [
        {
          id: route.id,
          chauffeur: toOverigPersoon(route.chauffeur),
          stops: route.stops.map((stop) => ({
            id: stop.id,
            volgnummer: stop.volgnummer,
            locatie: toLocatie(stop.locatie),
            aanmeldersOpTePikken: stop.aanmeldersToPickup.map(toAanmelding),
            geplandeAankomst: stop.geplandeAankomst ?? undefined,
          })),
        },
      ];
    }),
  };
}

function toNaam(dbVervoerstoer: DBVervoerstoerAggregate): string {
  if (!dbVervoerstoer.projects.length) {
    return `Vervoerstoer ${dbVervoerstoer.id}`;
  }
  return dbVervoerstoer.projects
    .map(({ projectnummer }) => projectnummer)
    .join(', ');
}

function toOverigPersoon(dbPersoon: DBPersonAggregate): OverigPersoon {
  const persoon = toPersoon(dbPersoon);
  if (persoon.type !== 'overigPersoon') {
    throw new Error(`Persoon ${persoon.id} is not an overigPersoon`);
  }
  return persoon;
}
