import { Doelgroep, UpsertableProject, doelgroepen } from '@rock-solid/shared';
import { html } from 'lit';

export function printProject(project: UpsertableProject) {
  return `${project.projectnummer}: ${project.naam}`;
}

export const deelnemerVerwijderd = html`<rock-icon
  title="Deelnemer is verwijderd"
  icon="questionCircle"
></rock-icon>`;

export const showDoelgroep = (doelgroep?: Doelgroep) => {
  if (doelgroep) {
    return doelgroepen[doelgroep];
  }
  return '';
};
