import { UpsertableLocatie } from '@rock-solid/shared';

export function showLocatie(locatie: UpsertableLocatie | undefined): string {
  return locatie?.naam ?? '';
}
