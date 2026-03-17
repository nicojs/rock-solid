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

type DBStopAggregate = db.VervoerstoerStop & {
  locatie: DBLocatieAggregate;
  aanmeldersToPickup: DBAanmeldingAggregate[];
};

type DBVervoerstoerAggregate = db.Vervoerstoer & {
  toeTeKennenStops: DBStopAggregate[];
  bestemmingStop: DBStopAggregate | null;
  projects: db.Project[];
  vervoerstoerRoutes: (db.VervoerstoerRoute & {
    chauffeur: DBPersonAggregate | null;
    vertrekadres: DBAdresWithPlaats | null;
    stops: DBStopAggregate[];
  })[];
};

const includeStopAggregate = {
  locatie: { include: includeAdres },
  aanmeldersToPickup: { include: includeAanmeldingFields },
};

const includeVervoerstoerAggregate = {
  toeTeKennenStops: {
    orderBy: {
      volgnummer: 'asc',
    },
    include: includeStopAggregate,
  },
  bestemmingStop: {
    include: includeStopAggregate,
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
        include: includeStopAggregate,
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
    // Create vervoerstoer with toeTeKennenStops and routes
    const created = await handleKnownPrismaErrors(
      this.db.vervoerstoer.create({
        data: { ...toCreateInput(vervoerstoer), aangemaaktDoor },
        include: includeVervoerstoerAggregate,
      }),
    );
    // Create bestemming stop separately and link it
    return this.#upsertBestemmingStop(created, vervoerstoer.bestemmingStop);
  }

  async update(
    id: number,
    vervoerstoer: Vervoerstoer,
  ): Promise<Vervoerstoer> {
    // Disconnect bestemming stop first (to avoid FK issues when deleting stops)
    await this.db.vervoerstoer.update({
      where: { id },
      data: { bestemmingStop: { disconnect: true } },
    });
    const updated = await handleKnownPrismaErrors(
      this.db.vervoerstoer.update({
        where: { id },
        data: toUpdateInput(vervoerstoer),
        include: includeVervoerstoerAggregate,
      }),
    );
    return this.#upsertBestemmingStop(updated, vervoerstoer.bestemmingStop);
  }

  async #upsertBestemmingStop(
    dbVervoerstoer: DBVervoerstoerAggregate,
    bestemmingStop: Vervoerstoer['bestemmingStop'],
  ): Promise<Vervoerstoer> {
    if (!bestemmingStop) {
      return toVervoerstoer(dbVervoerstoer);
    }
    const stop = await this.db.vervoerstoerStop.create({
      data: {
        locatie: { connect: { id: bestemmingStop.locatie.id } },
        volgnummer: 0,
        aanmeldersToPickup: {
          connect: bestemmingStop.aanmeldersOpTePikken.map((a) => ({
            id: a.id,
          })),
        },
      },
    });
    const result = await this.db.vervoerstoer.update({
      where: { id: dbVervoerstoer.id },
      data: { bestemmingStop: { connect: { id: stop.id } } },
      include: includeVervoerstoerAggregate,
    });
    return toVervoerstoer(result);
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
      : filter.naamLike
        ? { some: { naam: { contains: filter.naamLike } } }
        : undefined,
    bestemmingStop: filter.bestemmingLike
      ? { locatie: { naam: { contains: filter.bestemmingLike } } }
      : undefined,
    aangemaaktDoor: filter.aangemaaktDoorLike
      ? { contains: filter.aangemaaktDoorLike }
      : undefined,
  };
}

function toCreateInput(
  vervoerstoer: Vervoerstoer,
): Omit<Prisma.VervoerstoerCreateInput, 'aangemaaktDoor'> {
  return {
    projects: {
      connect: vervoerstoer.projectIds.map((id) => ({ id })),
    },
    datum: vervoerstoer.datum ?? null,
    datumTerug: vervoerstoer.datumTerug ?? null,
    toeTeKennenStops: {
      create: toStopCreateInputs(vervoerstoer.toeTeKennenStops),
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
    datum: vervoerstoer.datum ?? null,
    datumTerug: vervoerstoer.datumTerug ?? null,
    projects: {
      set: vervoerstoer.projectIds.map((id) => ({ id })),
    },
    toeTeKennenStops: {
      deleteMany: {},
      create: toStopCreateInputs(vervoerstoer.toeTeKennenStops),
    },
    vervoerstoerRoutes: {
      deleteMany: {},
      create: toRouteCreateInput(vervoerstoer),
    },
  };
}

function toStopCreateInputs(stops: Vervoerstoer['toeTeKennenStops']) {
  return stops.map((stop) => ({
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
    geplandeAankomstTerug: stop.geplandeAankomstTerug ?? null,
  }));
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
        geplandeAankomstTerug: stop.geplandeAankomstTerug ?? null,
      })),
    },
    vertrekTijd: route.vertrekTijd ?? null,
    vertrekTijdTerug: route.vertrekTijdTerug ?? null,
  }));
}

function toVervoerstoer(
  dbVervoerstoer: DBVervoerstoerAggregate,
): Vervoerstoer {
  return {
    id: dbVervoerstoer.id,
    naam: toNaam(dbVervoerstoer),
    projectIds: dbVervoerstoer.projects.map((project) => project.id),
    toeTeKennenStops: dbVervoerstoer.toeTeKennenStops.map(toStop),
    bestemmingStop: dbVervoerstoer.bestemmingStop
      ? toStop(dbVervoerstoer.bestemmingStop)
      : undefined,
    datum: dbVervoerstoer.datum ?? undefined,
    datumTerug: dbVervoerstoer.datumTerug ?? undefined,
    aangemaaktDoor: dbVervoerstoer.aangemaaktDoor,
    routes: dbVervoerstoer.vervoerstoerRoutes.flatMap((route) => {
      if (!route.chauffeur) return [];
      return [
        {
          id: route.id,
          chauffeur: toOverigPersoon(route.chauffeur),
          vertrekTijd: route.vertrekTijd ?? undefined,
          vertrekTijdTerug: route.vertrekTijdTerug ?? undefined,
          vertrekadres: toAdres(route.vertrekadres),
          stops: route.stops.map(toStop),
        },
      ];
    }),
  };
}

function toStop(stop: DBStopAggregate) {
  return {
    id: stop.id,
    volgnummer: stop.volgnummer,
    locatie: toLocatie(stop.locatie),
    aanmeldersOpTePikken: stop.aanmeldersToPickup.map(toAanmelding),
    geplandeAankomst: stop.geplandeAankomst ?? undefined,
    geplandeAankomstTerug: stop.geplandeAankomstTerug ?? undefined,
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
