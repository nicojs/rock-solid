import { UpsertableProject } from '@rock-solid/shared';

export function printProject(project: UpsertableProject) {
  return `${project.projectnummer}: ${project.naam}`;
}
