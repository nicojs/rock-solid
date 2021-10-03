import { bedrijfsonderdelen, Project } from '@kei-crm/shared';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { notAvailable, pluralize, showDatum } from '../shared';

@customElement('kei-projecten-list')
export class ProjectenListComponent extends LitElement {
  static override styles = [bootstrap];

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
          <th>Bedrijfsonderdeel</th>
          <th>Aantal activiteiten</th>
          <th>Startdatum eerste activiteit</th>
          <th>Acties</th>
        </tr>
      </thead>
      <tbody>
        ${this.projecten.map(
          (project) => html`<tr>
            <td>${project.projectnummer}</td>
            <td>
              ${project.type === 'cursus'
                ? bedrijfsonderdelen[project.bedrijfsonderdeel]
                : notAvailable}
            </td>
            <td>${project.activiteiten.length}</td>
            <td>${showDatum(project.activiteiten[0]?.van)}</td>
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
