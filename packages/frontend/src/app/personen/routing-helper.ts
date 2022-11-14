import { PersoonType } from '@rock-solid/shared';

export const routesByPersoonType: Readonly<Record<PersoonType, string>> =
  Object.freeze({
    deelnemer: 'deelnemers',
    overigPersoon: 'overige-personen',
  });
