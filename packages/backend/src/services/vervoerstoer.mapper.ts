import { Injectable } from '@nestjs/common';
import {
  OverigPersoon,
  Vervoerstoer,
  VervoerstoerFilter,
} from '@rock-solid/shared';
import { Prisma } from '../../generated/prisma/index.js';
import * as db from '../../generated/prisma/index.js';
import { handleKnownPrismaErrors } from '../errors/index.js';
import { DBService } from './db.service.js';
import {
  DBAdresWithPlaats,
  includeAdresWithPlaats,
  toAdres,
  toCreateAdresInput,
} from './adres.mapper.js';
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
import { toPage } from './paging.js';

type DBVervoerstoerAggregate = db.Vervoerstoer & {
  bestemming: DBLocatieAggregate | null;
  projects: db.Project[];
  vervoerstoerRoutes: (db.VervoerstoerRoute & {
    chauffeur: DBPersonAggregate | null;
    vertrekadres: DBAdresWithPlaats | null;
    stops: (db.VervoerstoerStop & {
      locatie: DBLocatieAggregate;
      aanmeldersToPickup: DBAanmeldingAggregate[];
    })[];
  })[];
};

const includeVervoerstoerAggregate = {
  bestemming: {
    include: includeAdres,
  },
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
      vertrekadres: includeAdresWithPlaats,
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

  async getAll(
    filter: VervoerstoerFilter | undefined,
    pageNumber: number | undefined,
  ): Promise<Vervoerstoer[]> {
    const dbVervoerstoeren = await this.db.vervoerstoer.findMany({
      where: toWhere(filter),
      include: includeVervoerstoerAggregate,
      orderBy: { id: 'desc' },
      ...toPage(pageNumber),
    });
    return dbVervoerstoeren.map(toVervoerstoer);
  }

  async count(filter: VervoerstoerFilter | undefined): Promise<number> {
    return this.db.vervoerstoer.count({ where: toWhere(filter) });
  }

  async get(id: number): Promise<Vervoerstoer | undefined> {
    const db = await this.db.vervoerstoer.findFirst({
      where: { id },
      include: includeVervoerstoerAggregate,
    });
    return db ? toVervoerstoer(db) : undefined;
  }

  async create(
    vervoerstoer: Vervoerstoer,
    aangemaaktDoor: string,
  ): Promise<Vervoerstoer> {
    const created = await handleKnownPrismaErrors(
      this.db.vervoerstoer.create({
        data: { ...toCreateInput(vervoerstoer), aangemaaktDoor },
        include: includeVervoerstoerAggregate,
      }),
    );
    return toVervoerstoer(created);
  }

  async update(
    id: number,
    vervoerstoer: Vervoerstoer,
  ): Promise<Vervoerstoer> {
    const updated = await handleKnownPrismaErrors(
      this.db.vervoerstoer.update({
        where: { id },
        data: toUpdateInput(vervoerstoer),
        include: includeVervoerstoerAggregate,
      }),
    );
    return toVervoerstoer(updated);
  }

  async delete(id: number): Promise<void> {
    await this.db.vervoerstoer.delete({ where: { id } });
  }
}

function toWhere(
  filter: VervoerstoerFilter | undefined,
): Prisma.VervoerstoerWhereInput | undefined {
  if (!filter) return undefined;
  return {
    projects: filter.projectIds?.length
      ? { some: { id: { in: filter.projectIds } } }
      : undefined,
  };
}

function toCreateInput(
  vervoerstoer: Vervoerstoer,
): Omit<Prisma.VervoerstoerCreateInput, 'aangemaaktDoor'> {
  return {
    bestemming: vervoerstoer.bestemming
      ? { connect: { id: vervoerstoer.bestemming.id } }
      : undefined,
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
    bestemming: vervoerstoer.bestemming
      ? { connect: { id: vervoerstoer.bestemming.id } }
      : { disconnect: true },
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
    vertrekadres: toCreateAdresInput(route.vertrekadres),
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
    vertrekTijd: route.vertrekTijd ?? null,
  }));
}

function toVervoerstoer(
  dbVervoerstoer: DBVervoerstoerAggregate,
): Vervoerstoer {
  return {
    id: dbVervoerstoer.id,
    naam: toNaam(dbVervoerstoer),
    projectIds: dbVervoerstoer.projects.map((project) => project.id),
    bestemming: dbVervoerstoer.bestemming
      ? toLocatie(dbVervoerstoer.bestemming)
      : undefined,
    aangemaaktDoor: dbVervoerstoer.aangemaaktDoor,
    routes: dbVervoerstoer.vervoerstoerRoutes.flatMap((route) => {
      if (!route.chauffeur) return [];
      return [
        {
          id: route.id,
          chauffeur: toOverigPersoon(route.chauffeur),
          vertrekTijd: route.vertrekTijd ?? undefined,
          vertrekadres: toAdres(route.vertrekadres),
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
