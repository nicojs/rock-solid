import { customElement, property } from 'lit/decorators.js';
import { RockElement } from '../rock-element';
import { bootstrap } from '../../styles';
import {
  Aanmelding,
  Contactpersoon,
  Project,
  notEmpty,
} from '@rock-solid/shared';
import { css, html, nothing } from 'lit';
import { printProject } from './project.pipes';
import {
  fullName,
  showFotoToestemming,
  showVoedingswens,
} from '../personen/persoon.pipe';
import { show, showDatum, showPlaats } from '../shared';

@customElement('rock-deelnemerslijst-printen')
export class DeelnemerslijstPrintenComponent extends RockElement {
  static override styles = [
    bootstrap,
    css`
      @media print {
        h1 {
          font-size: 1em;
        }
        td {
          font-size: 0.5em;
        }
        th {
          font-size: 0.6em;
        }
      }
    `,
  ];

  @property()
  public project!: Project;

  @property()
  public aanmeldingen!: Aanmelding[];

  public override firstUpdated() {
    window.print();
  }

  public override render() {
    return html`<div data-bs-theme="light">
      <h1>${printProject(this.project)}</h1>
      <div class="row">
        <table class="table table-striped table-sm table-bordered">
          <thead>
            <tr>
              <th>Naam</th>
              <th>Gemeente</th>
              <th>Geboortedatum</th>
              <th>Foto</th>
              <th>Voedingswens</th>
              <th>Telefoonnummer</th>
              <th>GSM</th>
              <th>Begeleidende dienst</th>
              <th>Contactpersoon</th>
            </tr>
          </thead>
          <tbody>
            ${this.aanmeldingen
              .map(({ deelnemer }) => deelnemer)
              .filter(notEmpty)
              .map(
                (deelnemer) =>
                  html`<tr>
                    <td>${fullName(deelnemer)}</td>
                    <td>${showPlaats(deelnemer.verblijfadres?.plaats)}</td>
                    <td>${showDatum(deelnemer.geboortedatum)}</td>
                    <td>${showFotoToestemming(deelnemer.fotoToestemming)}</td>
                    <td>${showVoedingswens(deelnemer)}</td>
                    <td>${deelnemer.telefoonnummer}</td>
                    <td>${deelnemer.gsmNummer}</td>
                    <td>${deelnemer.begeleidendeDienst}</td>
                    <td>
                      ${this.renderContactpersoon(deelnemer.contactpersoon)}
                    </td>
                  </tr>`,
              )}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  private renderContactpersoon(contactpersoon: Contactpersoon) {
    if (Object.values(contactpersoon).every((v) => !v)) {
      return nothing;
    }
    return html`${show(contactpersoon.naam)}${contactpersoon.gsm
      ? html`<br />${contactpersoon.gsm}`
      : nothing}${contactpersoon.telefoon
      ? html`<br />${contactpersoon.telefoon}`
      : nothing}`;
  }
}
