import * as db from '@prisma/client';
import { Adres, UpsertableAdres } from '@rock-solid/shared';
import { toPlaats } from './plaats.mapper.js';

export type DBAdresWithPlaats = db.Adres & { plaats: db.Plaats };

export function toAdres(adres: DBAdresWithPlaats): Adres {
  const { plaats, plaatsId, busnummer, ...props } = adres;
  return {
    plaats: toPlaats(plaats),
    busnummer: busnummer ?? undefined,
    ...props,
  };
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
  adres: UpsertableAdres,
): db.Prisma.AdresCreateNestedOneWithoutVerblijfpersonenInput {
  const { plaats, id, ...props } = adres;
  return {
    create: {
      ...props,
      plaats: { connect: { id: plaats.id } },
    },
  };
}

export function toNullableCreateAdresInput(
  adres?: UpsertableAdres,
): db.Prisma.AdresCreateNestedOneWithoutVerblijfpersonenInput | undefined {
  if (adres) {
    return toCreateAdresInput(adres);
  }
  return;
}

export function toUpdateAdresInput(
  adres: UpsertableAdres,
): db.Prisma.AdresUpdateOneRequiredWithoutVerblijfpersonenNestedInput {
  const { id, plaats, ...props } = adres;
  return {
    upsert: {
      create: {
        ...props,
        plaats: { connect: { id: plaats.id } },
      },
      update: {
        ...props,
        plaats: { connect: { id: plaats.id } },
      },
    },
  };
}

export function toNullableUpdateAdresInput(
  adres?: UpsertableAdres,
): db.Prisma.AdresUpdateOneWithoutDomiciliepersonenNestedInput {
  if (adres) {
    return toUpdateAdresInput(adres);
  } else {
    return {};
  }
}
