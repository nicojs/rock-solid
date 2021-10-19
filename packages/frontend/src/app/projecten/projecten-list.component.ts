import { bedrijfsonderdelen, Project } from '@kei-crm/shared';
import { html, LitElement, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { notAvailable, pluralize, showDatum } from '../shared';
import style from './projecten-list.component.scss';

@customElement('kei-projecten-list')
export class ProjectenListComponent extends LitElement {
  static override styles = [bootstrap, unsafeCSS(style)];

  @property()
  public projecten!: Project[];

  override render() {
    return html`${html`${this.projecten.length
      ? this.renderTable()
      : html`<div class="mb-3">Geen projecten gevonden 🤷‍♂️</div>`}`}`;
  }

  private renderTable() {
    return html`<table class="table table-hover">
      <thead>
        <tr>
          <th>Projectnummer</th>
          <th>Naam</th>
          <th>Organisatieonderdeel</th>
          <th>Activiteiten</th>
          <th>Acties</th>
        </tr>
      </thead>
      <tbody>
        ${this.projecten.map(
          (project) => html`<tr>
            <td>${project.projectnummer}</td>
            <td>${project.naam}</td>
            <td>
              ${project.type === 'cursus'
                ? bedrijfsonderdelen[project.organisatieonderdeel]
                : notAvailable}
            </td>
            <td>
              ${project.activiteiten.map(
                (activiteit) =>
                  html`<div class="mt-2">
                    ${activiteit.totEnMet < new Date()
                      ? html`<kei-link
                          title="Open activiteit"
                          btn
                          btnOutlinePrimary
                          href="/${pluralize(
                            project.type,
                          )}/${project.id}/deelnames/${activiteit.id}}"
                          ><kei-icon icon="calendar"></kei-icon> ${showDatum(
                            activiteit.van,
                          )}</kei-link
                        >`
                      : html`<span
                          title="Activiteit vindt plaats in de toekomst"
                          class="no-button-date"
                          ><kei-icon icon="calendar"></kei-icon> ${showDatum(
                            activiteit.van,
                          )}</span
                        >`}
                  </div>`,
              )}
            </td>
            <td>
              <kei-link
                btn
                btnOutlinePrimary
                title="Wijzigen"
                href="/${pluralize(project.type)}/edit/${project.id}"
                ><kei-icon icon="pencil"></kei-icon
              ></kei-link>
              <kei-link
                btn
                btnOutlinePrimary
                title="Inschrijvingen"
                href="/${pluralize(project.type)}/inschrijvingen/${project.id}"
              >
                <kei-icon icon="pencilSquare"></kei-icon>
                <span
                  class="badge ${(project.aantalInschrijvingen ?? 0) > 0
                    ? 'bg-success'
                    : 'bg-secondary'}"
                  >${project.aantalInschrijvingen}</span
                >
              </kei-link>
            </td>
          </tr>`,
        )}
      </tbody>
    </table> `;
  }
}
