import { CursusLocatie } from '@rock-solid/shared';
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { ModalComponent } from '../shared/modal.component';
import { showAdres } from '../shared';
import { privilege } from '../auth/privilege.directive';

@customElement('rock-cursuslocatie-list')
export class CursuslocatieListComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  private cursuslocaties!: CursusLocatie[];

  private deleteCursuslocatie(loc: CursusLocatie) {
    ModalComponent.instance
      .confirm(
        html`Weet je zeker dat je cursuslocatie
          <strong>${loc.naam}</strong> wilt verwijderen?`,
      )
      .then((confirmed) => {
        if (confirmed) {
          const deleteEvent = new CustomEvent<CursusLocatie>('delete', {
            bubbles: true,
            composed: true,
            detail: loc,
          });

          this.dispatchEvent(deleteEvent);
        }
      });
  }

  override render() {
    return html`${this.cursuslocaties.length
      ? this.renderTable()
      : html`<div>Geen cursuslocaties gevonden 🤷‍♂️</div>`}`;
  }
  private renderTable() {
    return html`<div class="row">
      <table class="table table-hover">
        <thead>
          <tr>
            <th>Naam</th>
            <th>Adres</th>
            <th style="width: 190px">Acties</th>
          </tr>
        </thead>
        <tbody>
          ${this.cursuslocaties!.map(
            (loc) =>
              html`<tr>
                <td>${loc.naam}</td>
                <td>${showAdres(loc.adres)}</td>
                <td>
                  <rock-link
                    btn
                    btnSecondary
                    href="/cursuslocaties/edit/${loc.id}"
                    ><rock-icon icon="pencil"></rock-icon
                  ></rock-link>
                  <button
                    @click=${() => this.deleteCursuslocatie(loc)}
                    type="button"
                    ${privilege('write:cursuslocaties')}
                    class="btn btn-danger"
                  >
                    <rock-icon icon="trash"></rock-icon>
                  </button>
                </td>
              </tr>`,
          )}
        </tbody>
      </table>
    </div>`;
  }
}
