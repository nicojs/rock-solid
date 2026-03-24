import * as db from '../../generated/prisma/index.js';
import { Adres, UpsertableAdres } from '@rock-solid/shared';
import { toPlaats } from './plaats.mapper.js';
import { PlaatsMapper } from './plaats.mapper.js';

export type DBAdresWithPlaats = db.Adres & { plaats: db.Plaats };

export const includeAdresWithPlaats = {
  include: { plaats: true } satisfies db.Prisma.AdresInclude,
} as const;

export function toAdres(adres: DBAdresWithPlaats | null): Adres | undefined {
  if (adres) {
    const { plaats, plaatsId, busnummer, ...props } = adres;
    return {
      plaats: toPlaats(plaats),
      busnummer: busnummer ?? undefined,
      ...props,
    };
  }
  return undefined;
}

export function toNullableAdres(
  adres: DBAdresWithPlaats | null | undefined,
): Adres | undefined {
  if (adres) {
    return toAdres(adres);
  }
  return;
}

async function resolvePlaatsId(
  adres: UpsertableAdres,
  plaatsMapper: PlaatsMapper,
): Promise<number> {
  if (adres.plaats.id) {
    return adres.plaats.id;
  }
  const dbPlaats = await plaatsMapper.findOrCreate(adres.plaats);
  return dbPlaats.id;
}

export async function toCreateAdresInput(
  adres: UpsertableAdres | undefined | null,
  plaatsMapper: PlaatsMapper,
): Promise<
  db.Prisma.AdresCreateNestedOneWithoutVerblijfpersonenInput | undefined
> {
  if (adres) {
    const { plaats, id, ...props } = adres;
    const plaatsId = await resolvePlaatsId(adres, plaatsMapper);
    return {
      create: {
        ...props,
        plaats: { connect: { id: plaatsId } },
      },
    };
  }
  return;
}

/**
 * @see https://github.com/prisma/prisma/issues/9460
 * @param adres The updated adres fields
 * @param adresCurrentlyExists True if the current adres exists in the database. Unfortunately, `deleteIfExists` doesn't currently exist.
 */
export async function toUpdateAdresInput(
  adres: UpsertableAdres | undefined | null,
  adresCurrentlyExists: boolean,
  plaatsMapper: PlaatsMapper,
): Promise<db.Prisma.AdresUpdateOneWithoutDomiciliepersonenNestedInput> {
  if (adres) {
    const { id, plaats, ...props } = adres;
    const plaatsId = await resolvePlaatsId(adres, plaatsMapper);
    return {
      upsert: {
        create: {
          ...props,
          plaats: { connect: { id: plaatsId } },
        },
        update: {
          ...props,
          busnummer: props.busnummer ?? null,
          plaats: { connect: { id: plaatsId } },
        },
      },
    };
  } else if (adresCurrentlyExists) {
    return { delete: true };
  } else {
    return {};
  }
}
