import { Locatie } from '@rock-solid/shared';
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { ModalComponent } from '../shared/modal.component';
import { show, showAdres } from '../shared';
import { privilege } from '../auth/privilege.directive';

@customElement('rock-locatie-list')
export class LocatieListComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  private locaties!: Locatie[];

  private deleteLocatie(loc: Locatie) {
    ModalComponent.instance
      .confirm(
        html`Weet je zeker dat je locatie <strong>${loc.naam}</strong> wilt
          verwijderen?`,
      )
      .then((confirmed) => {
        if (confirmed) {
          const deleteEvent = new CustomEvent<Locatie>('delete', {
            bubbles: true,
            composed: true,
            detail: loc,
          });

          this.dispatchEvent(deleteEvent);
        }
      });
  }

  override render() {
    return html`${this.locaties.length
      ? this.renderTable()
      : html`<div>Geen locaties gevonden 🤷‍♂️</div>`}`;
  }
  private renderTable() {
    return html`<div class="row">
      <table class="table table-hover table-sm">
        <thead class="sticky-top">
          <tr>
            <th>Naam</th>
            <th>Adres</th>
            <th>Opmerking</th>
            <th style="width: 190px">Acties</th>
          </tr>
        </thead>
        <tbody>
          ${this.locaties!.map(
            (loc) =>
              html`<tr>
                <td>${loc.naam}</td>
                <td>${showAdres(loc.adres)}</td>
                <td>${show(loc.opmerking)}</td>
                <td>
                  <rock-link
                    btn
                    sm
                    keepQuery
                    btnOutlinePrimary
                    href="/locaties/edit/${loc.id}"
                    ><rock-icon icon="pencil"></rock-icon
                  ></rock-link>
                  <button
                    @click=${() => this.deleteLocatie(loc)}
                    type="button"
                    ${privilege('delete:locaties')}
                    class="btn btn-outline-danger btn-sm"
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
