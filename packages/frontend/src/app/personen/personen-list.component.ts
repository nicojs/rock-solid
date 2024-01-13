import { html, LitElement, nothing } from 'lit';
import { Persoon, PersoonType } from '@rock-solid/shared';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import {
  showFoldervoorkeurBadges,
  pluralize,
  show,
  showOverigPersoonSelectie,
  showPlaats,
} from '../shared';
import { fullName, fullNameWithAge } from './persoon.pipe';
import { ModalComponent } from '../shared/modal.component';
import { privilege } from '../auth/privilege.directive';
import { routesByPersoonType } from './routing-helper';

@customElement('rock-personen-list')
export class PersonenComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  private personen: Persoon[] | undefined;

  @property()
  public type: PersoonType = 'deelnemer';

  private async deletePersoon(persoon: Persoon) {
    const confirmed = await ModalComponent.instance.confirm(
      html`Weet je zeker dat je <strong>${fullName(persoon)}</strong> wilt
        verwijderen?`,
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
          ${this.type === 'deelnemer' ? html`<th>Woonplaats</th>` : nothing}
          <th>Folders</th>
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
              ${persoon.type === 'deelnemer'
                ? html`<td>${showPlaats(persoon.verblijfadres?.plaats)}</td>`
                : nothing}
              <td>${showFoldervoorkeurBadges(persoon.foldervoorkeuren)}</td>
              <td>
                <rock-link
                  btn
                  btnSecondary
                  sm
                  href="/${routesByPersoonType[
                    this.type
                  ]}/display/${persoon.id}"
                  ><rock-icon icon="eye"></rock-icon
                ></rock-link>
                <rock-link
                  btn
                  sm
                  btnSecondary
                  href="/${routesByPersoonType[this.type]}/edit/${persoon.id}"
                  ><rock-icon icon="pencil"></rock-icon
                ></rock-link>
                <span>
                  <button
                    @click=${() => this.deletePersoon(persoon)}
                    type="button"
                    ${privilege('write:personen')}
                    class="btn btn-danger btn-sm"
                  >
                    <rock-icon icon="trash"></rock-icon>
                  </button>
                </span>
              </td>
            </tr>`,
        )}
      </tbody>
    </table>`;
  }
}
