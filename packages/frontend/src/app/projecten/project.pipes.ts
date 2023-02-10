import { UpsertableProject } from '@rock-solid/shared';
import { html } from 'lit';

export function printProject(project: UpsertableProject) {
  return `${project.projectnummer}: ${project.naam}`;
}

export const deelnemerVerwijderd = html`<span title="Deelnemer is verwijderd"
  >❓</span
>`;
