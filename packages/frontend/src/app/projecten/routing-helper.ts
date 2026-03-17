import { ProjectType } from '@rock-solid/shared';

export const routesByProjectType: Readonly<Record<ProjectType, string>> =
  Object.freeze({
    vakantie: 'vakanties',
    cursus: 'cursussen',
  });
