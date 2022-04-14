import { folderSelecties, Organisatie } from '@rock-solid/shared';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { show } from '../shared';

@customElement('rock-organisaties-list')
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
        : html`<rock-loading></rock-loading>`}
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
              <rock-link btn btnSecondary href="../edit/${org.id}"
                ><rock-icon icon="pencil"></rock-icon
              ></rock-link>
            </td>
          </tr>`,
        )}
      </tbody>
    </table>`;
  }
}
