import {
  folderSelecties,
  Organisatie,
  UpsertableOrganisatie,
} from '@kei-crm/shared';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { InputControl, InputType, patterns } from '../forms';
import { pluralize, show } from '../shared';
import { printOrganisatie } from './organisatie.pipes';

@customElement('kei-organisaties-list')
export class OrganisatiesListComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  private organisaties: Organisatie[] | undefined;

  override render() {
    return html` <div class="row">
      ${this.organisaties
        ? html`${this.organisaties.length
            ? this.renderTable()
            : html`<div>Geen organisaties gevonden 🤷‍♂️</div>`}`
        : html`<kei-loading></kei-loading>`}
    </div>`;
  }

  private renderTable(): unknown {
    return html`<table class="table table-hover">
      <thead>
        <tr>
          <th>Naam</th>
          <th>TAV</th>
          <th>Folder voorkeur</th>
          <th>Emailadres</th>
          <th>Telefoonnummer</th>
          <th>Acties</th>
        </tr>
      </thead>
      <tbody>
        ${this.organisaties!.map(
          (org) => html`<tr>
            <td>${org.naam}</td>
            <td>${show(org.terAttentieVan)}</td>
            <td>
              ${show(org.folderVoorkeur.map((item) => folderSelecties[item]))}
            </td>
            <td>${show(org.emailadres)}</td>
            <td>${show(org.telefoonnummer)}</td>
            <td>
              <kei-link btn btnSecondary href="../edit/${org.id}"
                ><kei-icon icon="pencil"></kei-icon
              ></kei-link>
            </td>
          </tr>`,
        )}
      </tbody>
    </table>`;
  }
}
