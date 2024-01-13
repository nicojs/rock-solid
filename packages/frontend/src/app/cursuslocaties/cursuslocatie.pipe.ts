import { UpsertableCursusLocatie } from '@rock-solid/shared';

export function showCursuslocatie(
  cursuslocatie: UpsertableCursusLocatie | undefined,
): string {
  return cursuslocatie?.naam ?? '';
}
