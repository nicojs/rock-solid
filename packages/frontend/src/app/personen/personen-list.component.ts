import { html, LitElement, nothing } from 'lit';
import { Persoon, PersoonType } from '@rock-solid/shared';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import {
  showFoldervoorkeurBadges,
  pluralize,
  show,
  showAdres,
  showOverigPersoonSelectie,
} from '../shared';
import { fullName, fullNameWithAge } from './full-name.pipe';
import { ModalComponent } from '../shared/modal.component';

@customElement('rock-personen-list')
export class PersonenComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  private personen: Persoon[] | undefined;

  @property()
  public type: PersoonType = 'deelnemer';

  private async deletePersoon(persoon: Persoon) {
    const confirmed = await ModalComponent.instance.confirm(
      `Weet je zeker dat je ${fullName(persoon)} wilt verwijderen?`,
    );
    if (confirmed) {
      const deleteEvent = new CustomEvent<Persoon>('delete', {
        bubbles: true,
        composed: true,
        detail: persoon,
      });

      this.dispatchEvent(deleteEvent);
    }
  }

  override render() {
    return html` <div class="row">
      <div class="col">
        ${this.personen
          ? html`${this.personen.length
              ? this.renderTable()
              : html`<div>Geen ${pluralize(this.type)} gevonden 🤷‍♂️</div>`}`
          : html`<rock-loading></rock-loading>`}
      </div>
    </div>`;
  }

  private renderTable(): unknown {
    return html`<table class="table table-hover">
      <thead>
        <tr>
          <th>Naam (leeftijd)</th>
          ${this.type === 'overigPersoon' ? html`<th>Selectie</th>` : nothing}
          <th>Emailadres</th>
          <th>Telefoonnummer</th>
          ${this.type === 'deelnemer'
            ? html`<th>Verblijfadres</th>`
            : html`<th>Folders</th>`}
          <th style="width: 190px">Acties</th>
        </tr>
      </thead>
      <tbody>
        ${this.personen!.map(
          (persoon) =>
            html`<tr>
              <td>${fullNameWithAge(persoon)}</td>
              ${persoon.type === 'overigPersoon'
                ? html`<td>${showOverigPersoonSelectie(persoon.selectie)}</td>`
                : nothing}
              <td>${show(persoon.emailadres)}</td>
              <td>${show(persoon.gsmNummer ?? persoon.telefoonnummer)}</td>
              <td>
                ${persoon.type === 'deelnemer'
                  ? showAdres(persoon.verblijfadres)
                  : showFoldervoorkeurBadges(persoon.foldervoorkeuren)}
              </td>
              <td>
                <rock-link btn btnSecondary href="../display/${persoon.id}"
                  ><rock-icon icon="eye"></rock-icon
                ></rock-link>
                <rock-link btn btnSecondary href="../edit/${persoon.id}"
                  ><rock-icon icon="pencil"></rock-icon
                ></rock-link>
                <button
                  @click=${() => this.deletePersoon(persoon)}
                  type="button"
                  class="btn btn-danger"
                >
                  <rock-icon icon="trash"></rock-icon>
                </button>
              </td>
            </tr>`,
        )}
      </tbody>
    </table>`;
  }
}
