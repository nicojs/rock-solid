import { Organisatie, OrganisatieContact } from '@rock-solid/shared';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { show, showAdres, folderVoorkeurBadges } from '../shared';

@customElement('rock-organisaties-list')
export class OrganisatiesListComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  private organisaties: Organisatie[] | undefined;

  override render() {
    return html` ${this.organisaties
      ? html`${this.organisaties.length
          ? this.renderTable()
          : html`<div>Geen organisaties gevonden 🤷‍♂️</div>`}`
      : html`<rock-loading></rock-loading>`}`;
  }

  private renderTable(): unknown {
    return html`<table class="table table-hover">
      <thead>
        <tr>
          <th>Naam</th>
          <th>Website</th>
          <th>TAV</th>
          <th>Telefoonnummer</th>
          <th>Emailadres</th>
          <th>Adres</th>
          <th>Folder voorkeur</th>
          <th>Acties</th>
        </tr>
      </thead>
      <tbody>
        ${this.organisaties!.map((org) => {
          const rowSpan = org.contacten.length === 0 ? 1 : org.contacten.length;
          return html`<tr>
              <td rowspan="${rowSpan}">${org.naam}</td>
              <td rowspan="${rowSpan}">${show(org.website)}</td>
              ${renderContactTableData(org.contacten[0]!)}
              <td rowspan="${rowSpan}">
                <rock-link btn btnSecondary href="../edit/${org.id}"
                  ><rock-icon icon="pencil"></rock-icon
                ></rock-link>
              </td>
            </tr>
            ${org.contacten.slice(1).map(
              (contact) =>
                html`<tr>
                  ${renderContactTableData(contact)}
                </tr>`,
            )}`;
        })}
      </tbody>
    </table>`;
    function renderContactTableData(contact: OrganisatieContact) {
      return html`<td>${show(contact.terAttentieVan)}</td>
        <td>${show(contact.telefoonnummer)}</td>
        <td>${show(contact.emailadres)}</td>
        <td>${showAdres(contact.adres)}</td>
        <td>${folderVoorkeurBadges(contact.folderVoorkeur)}</td>`;
    }
  }
}
