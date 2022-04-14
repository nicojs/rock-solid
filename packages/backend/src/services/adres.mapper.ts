import * as db from '@prisma/client';
import { Adres, UpsertableAdres } from '@rock-solid/shared';
import { toPlaats } from './plaats.mapper.js';

export function toAdres(adres: db.Adres & { plaats: db.Plaats }): Adres {
  const { plaats, plaatsId, busnummer, ...props } = adres;
  return {
    plaats: toPlaats(plaats),
    busnummer: busnummer ?? undefined,
    ...props,
  };
}

export function toCreateAdresInput(
  adres: UpsertableAdres,
): db.Prisma.AdresCreateNestedOneWithoutVerblijfpersoonInput {
  const { plaats, id, ...props } = adres;
  return {
    create: {
      ...props,
      plaats: { connect: { id: plaats.id } },
    },
  };
}

export function toUpdateAdresInput(
  adres: UpsertableAdres,
): db.Prisma.AdresUpdateOneRequiredWithoutVerblijfpersoonInput {
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
): db.Prisma.AdresUpdateOneWithoutDomiciliepersonenInput {
  if (adres) {
    return toUpdateAdresInput(adres);
  } else {
    return {};
  }
}
