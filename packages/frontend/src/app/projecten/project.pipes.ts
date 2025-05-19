import {
  Aanmelding,
  Deelnemer,
  Doelgroep,
  UpsertableProject,
  doelgroepen,
} from '@rock-solid/shared';
import { html, nothing } from 'lit';
import { fullName } from '../personen/persoon.pipe';

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

export function deelnemerLink(deelnemer: Deelnemer) {
  return html`<a
    class="link-body-emphasis"
    href="/deelnemers/display/${deelnemer.id}"
    >${fullName(deelnemer)}</a
  >`;
}

export function statusIcon(aanmelding: Aanmelding): unknown {
  return aanmelding.status === 'Bevestigd'
    ? html`<rock-icon
        title="${aanmelding.deelnemer
          ? fullName(aanmelding.deelnemer)
          : 'Deelnemer'} is bevestigd"
        icon="checkCircle"
        class="text-success"
      ></rock-icon>`
    : nothing;
}
