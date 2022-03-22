import * as db from '@prisma/client';
import { Adres } from '@kei-crm/shared';
import { toPlaats } from './plaats.mapper';

export function toAdres(adres: db.Adres & { plaats: db.Plaats }): Adres {
  const { plaats, plaatsId, busnummer, ...props } = adres;
  return {
    plaats: toPlaats(plaats),
    busnummer: busnummer ?? undefined,
    ...props,
  };
}
