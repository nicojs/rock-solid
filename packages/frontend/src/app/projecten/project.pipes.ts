import { UpsertableProject } from '@kei-crm/shared';

export function printProject(project: UpsertableProject) {
  return `${project.projectnummer}: ${project.naam}`;
}
