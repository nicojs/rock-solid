import { Organisatie, OrganisatieContact } from '@rock-solid/shared';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import {
  show,
  showAdres,
  showFoldervoorkeurBadges as showFoldervoorkeurBadges,
} from '../shared';
import { privilege } from '../auth/privilege.directive';
import { ModalComponent } from '../shared/modal.component';

@customElement('rock-organisaties-list')
export class OrganisatiesListComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  private organisaties: Organisatie[] | undefined;

  private deleteOrganisatie(org: Organisatie) {
    ModalComponent.instance
      .confirm(
        html`Weet je zeker dat je organisatie <strong>${org.naam}</strong> ${org
            .contacten.length > 1
            ? html`met
                <strong>${org.contacten.length} contactpersonen</strong> `
            : ''}wilt
          verwijderen?`,
      )
      .then((confirmed) => {
        if (confirmed) {
          const deleteEvent = new CustomEvent<Organisatie>('delete', {
            bubbles: true,
            composed: true,
            detail: org,
          });

          this.dispatchEvent(deleteEvent);
        }
      });
  }

  override render() {
    console.log(this.organisaties);
    return html` ${this.organisaties
      ? html`${this.organisaties.length
          ? this.renderTable()
          : html`<div>Geen organisaties gevonden 🤷‍♂️</div>`}`
      : html`<rock-loading></rock-loading>`}`;
  }

  private renderTable() {
    return html`<div class="row">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Naam</th>
            <th>TAV</th>
            <th>Telefoonnummer</th>
            <th>Emailadres</th>
            <th>Adres</th>
            <th>Folder voorkeur</th>
            <th style="width: 190px">Acties</th>
          </tr>
        </thead>
        <tbody>
          ${this.organisaties!.map((org) => {
            const rowSpan =
              org.contacten.length === 0 ? 1 : org.contacten.length;
            return html`<tr>
                <td rowspan="${rowSpan}">${org.naam}</td>
                ${renderContactTableData(org.contacten[0])}
                <td rowspan="${rowSpan}">
                  <rock-link btn btnSecondary href="../edit/${org.id}"
                    ><rock-icon icon="pencil"></rock-icon
                  ></rock-link>
                  <button
                    @click=${() => this.deleteOrganisatie(org)}
                    type="button"
                    ${privilege('write:organisaties')}
                    class="btn btn-danger"
                  >
                    <rock-icon icon="trash"></rock-icon>
                  </button>
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
      </table>
    </div>`;
    function renderContactTableData(contact?: OrganisatieContact) {
      if (contact) {
        return html`<td>${show(contact.terAttentieVan)}</td>
          <td>${show(contact.telefoonnummer)}</td>
          <td>${show(contact.emailadres)}</td>
          <td>${showAdres(contact.adres)}</td>
          <td>${showFoldervoorkeurBadges(contact.foldervoorkeuren)}</td>`;
      }
      return html`<td class="text-center bg-body-secondary" colspan="5"></td>`;
    }
  }
}
