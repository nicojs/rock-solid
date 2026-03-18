import { Injectable } from '@nestjs/common';
import {
  OverigPersoon,
  Vervoerstoer,
  VervoerstoerFilter,
  VervoerstoerRoute,
  VervoerstoerStop,
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
import { aanmeldingsstatusMapper } from './enum.mapper.js';

type DBStopAggregate = db.VervoerstoerStop & {
  locatie: DBLocatieAggregate;
  aanmeldersToPickup: DBAanmeldingAggregate[];
};

type DBVervoerstoerAggregate = db.Vervoerstoer & {
  toeTeKennenStops: DBStopAggregate[];
  bestemmingStop: DBStopAggregate | null;
  projects: (db.Project & { _count: { aanmeldingen: number } })[];
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
    include: {
      _count: {
        select: {
          aanmeldingen: {
            where: { status: aanmeldingsstatusMapper.toDB('Bevestigd') },
          },
        },
      },
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
    return toVervoerstoer(created);
  }

  async update(id: number, vervoerstoer: Vervoerstoer): Promise<Vervoerstoer> {
    // Delete orphaned stops and routes, then upsert remaining
    const existingStopIds = vervoerstoer.toeTeKennenStops
      .map((s) => s.id)
      .filter((id) => id > 0);
    const existingRouteIds = vervoerstoer.routes
      .map((r) => r.id)
      .filter((id) => id > 0);

    // Collect all stop ids that should be kept (route stops + toeTeKennen stops)
    const allRouteStopIds = vervoerstoer.routes
      .flatMap((r) => r.stops.map((s) => s.id))
      .filter((id) => id > 0);

    await this.db.vervoerstoerStop.deleteMany({
      where: {
        OR: [
          { vervoerstoerId: id, id: { notIn: existingStopIds } },
          { route: { vervoerstoerId: id }, id: { notIn: allRouteStopIds } },
        ],
      },
    });
    await this.db.vervoerstoerRoute.deleteMany({
      where: { vervoerstoerId: id, id: { notIn: existingRouteIds } },
    });

    const updated = await handleKnownPrismaErrors(
      this.db.vervoerstoer.update({
        where: { id },
        data: toUpdateInput(vervoerstoer),
        include: includeVervoerstoerAggregate,
      }),
    );
    if(updated.bestemmingStop && !vervoerstoer.bestemmingStop) {
      // Bestemming stop was removed, delete it
      await this.db.vervoerstoerStop.delete({ where: { id: updated.bestemmingStop.id } });
      updated.bestemmingStop = null;
    }
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
      create: vervoerstoer.toeTeKennenStops.map(toStopCreateData),
    },
    vervoerstoerRoutes: {
      create: vervoerstoer.routes.map(toRouteCreateData),
    },
    bestemmingStop: vervoerstoer.bestemmingStop
      ? {
          create: toStopCreateData(vervoerstoer.bestemmingStop),
        }
      : undefined,
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
      upsert: vervoerstoer.toeTeKennenStops
        .filter((s) => s.id > 0)
        .map((stop) => ({
          where: { id: stop.id },
          update: toStopUpdateData(stop),
          create: toStopCreateData(stop),
        })),
      create: vervoerstoer.toeTeKennenStops
        .filter((s) => !s.id)
        .map(toStopCreateData),
    },
    vervoerstoerRoutes: {
      upsert: vervoerstoer.routes
        .filter((r) => r.id > 0)
        .map((route) => ({
          where: { id: route.id },
          update: toRouteUpdateData(route),
          create: toRouteCreateData(route),
        })),
      create: vervoerstoer.routes.filter((r) => !r.id).map(toRouteCreateData),
    },
    bestemmingStop: vervoerstoer.bestemmingStop
      ? {
          upsert: {
            create: toStopCreateData(vervoerstoer.bestemmingStop),
            update: toStopUpdateData(vervoerstoer.bestemmingStop),
          },
        }
      : undefined,
  };
}

function toStopCreateData(stop: VervoerstoerStop) {
  return {
    volgnummer: stop.volgnummer,
    locatie: { connect: { id: stop.locatie.id } },
    aanmeldersToPickup: {
      connect: stop.aanmeldersOpTePikken.map((a) => ({ id: a.id })),
    },
    geplandeAankomst: stop.geplandeAankomst ?? null,
    geplandeAankomstTerug: stop.geplandeAankomstTerug ?? null,
  };
}

function toStopUpdateData(stop: VervoerstoerStop) {
  return {
    volgnummer: stop.volgnummer,
    locatie: { connect: { id: stop.locatie.id } },
    aanmeldersToPickup: {
      set: stop.aanmeldersOpTePikken.map((a) => ({ id: a.id })),
    },
    geplandeAankomst: stop.geplandeAankomst ?? null,
    geplandeAankomstTerug: stop.geplandeAankomstTerug ?? null,
  };
}

function toRouteCreateData(route: VervoerstoerRoute) {
  return {
    chauffeur: { connect: { id: route.chauffeur.id } },
    vertrekadres: toCreateAdresInput(route.vertrekadres),
    stops: {
      create: route.stops.map(toStopCreateData),
    },
    vertrekTijd: route.vertrekTijd ?? null,
    vertrekTijdTerug: route.vertrekTijdTerug ?? null,
  };
}

function toRouteUpdateData(route: VervoerstoerRoute) {
  const existingStopIds = route.stops.map((s) => s.id).filter((id) => id > 0);
  return {
    chauffeur: { connect: { id: route.chauffeur.id } },
    vertrekadres: toCreateAdresInput(route.vertrekadres),
    stops: {
      deleteMany: { id: { notIn: existingStopIds } },
      upsert: route.stops
        .filter((s) => s.id > 0)
        .map((stop) => ({
          where: { id: stop.id },
          update: toStopUpdateData(stop),
          create: toStopCreateData(stop),
        })),
      create: route.stops
        .filter((s) => !s.id || s.id === 0)
        .map(toStopCreateData),
    },
    vertrekTijd: route.vertrekTijd ?? null,
    vertrekTijdTerug: route.vertrekTijdTerug ?? null,
  };
}

function toVervoerstoer(dbVervoerstoer: DBVervoerstoerAggregate): Vervoerstoer {
  const toeTeKennenStops = dbVervoerstoer.toeTeKennenStops.map(toStop);
  const bestemmingStop = dbVervoerstoer.bestemmingStop
    ? toStop(dbVervoerstoer.bestemmingStop)
    : undefined;
  const routes = dbVervoerstoer.vervoerstoerRoutes.flatMap((route) => {
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
  });

  // Bereken compleet: alle bevestigde aanmeldingen in stops, geen toeTeKennen stops,
  // en alle routes hebben tijden ingevuld
  const totaalBevestigd = dbVervoerstoer.projects.reduce(
    (sum, p) => sum + p._count.aanmeldingen,
    0,
  );
  const aanmeldingenInStops = new Set<number>();
  for (const route of routes) {
    for (const stop of route.stops) {
      for (const a of stop.aanmeldersOpTePikken) {
        aanmeldingenInStops.add(a.id);
      }
    }
  }
  if (bestemmingStop) {
    for (const a of bestemmingStop.aanmeldersOpTePikken) {
      aanmeldingenInStops.add(a.id);
    }
  }
  const alleAanmeldingenIngedeeld = aanmeldingenInStops.size >= totaalBevestigd;
  const geenToeTeKennen = toeTeKennenStops.every(
    (s) => s.aanmeldersOpTePikken.length === 0,
  );
  const alleTijdenIngevuld =
    routes.length > 0 &&
    routes.every(
      (route) =>
        Boolean(route.vertrekTijd) &&
        Boolean(route.vertrekTijdTerug) &&
        route.stops.every(
          (s) =>
            Boolean(s.geplandeAankomst) && Boolean(s.geplandeAankomstTerug),
        ),
    );

  return {
    id: dbVervoerstoer.id,
    naam: toNaam(dbVervoerstoer),
    projectIds: dbVervoerstoer.projects.map((project) => project.id),
    toeTeKennenStops,
    bestemmingStop,
    datum: dbVervoerstoer.datum ?? undefined,
    datumTerug: dbVervoerstoer.datumTerug ?? undefined,
    aangemaaktDoor: dbVervoerstoer.aangemaaktDoor,
    routes,
    compleet:
      alleAanmeldingenIngedeeld && geenToeTeKennen && alleTijdenIngevuld,
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
