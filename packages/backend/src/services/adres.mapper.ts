import * as db from '@prisma/client';
import { Adres, UpsertableAdres } from '@rock-solid/shared';
import { toPlaats } from './plaats.mapper.js';

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

export function toCreateAdresInput(
  adres: UpsertableAdres | undefined | null,
): db.Prisma.AdresCreateNestedOneWithoutVerblijfpersonenInput | undefined {
  if (adres) {
    const { plaats, id, ...props } = adres;
    return {
      create: {
        ...props,
        plaats: { connect: { id: plaats.id } },
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
export function toUpdateAdresInput(
  adres: UpsertableAdres | undefined | null,
  adresCurrentlyExists: boolean,
): db.Prisma.AdresUpdateOneWithoutDomiciliepersonenNestedInput {
  if (adres) {
    const { id, plaats, ...props } = adres;
    return {
      upsert: {
        create: {
          ...props,
          plaats: { connect: { id: plaats.id } },
        },
        update: {
          ...props,
          busnummer: props.busnummer ?? null,
          plaats: { connect: { id: plaats.id } },
        },
      },
    };
  } else if (adresCurrentlyExists) {
    return { delete: true };
  } else {
    return {};
  }
}
