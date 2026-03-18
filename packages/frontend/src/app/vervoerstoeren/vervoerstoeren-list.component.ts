import { Vervoerstoer } from '@rock-solid/shared';
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { ModalComponent } from '../shared/modal.component';
import { entities } from '../shared';

@customElement('rock-vervoerstoeren-list')
export class VervoerstoerenListComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  private vervoerstoeren!: Vervoerstoer[];

  private deleteVervoerstoer(v: Vervoerstoer) {
    ModalComponent.instance
      .confirm(
        html`Weet je zeker dat je vervoerstoer
          <strong>${v.naam}</strong> wilt verwijderen?`,
      )
      .then((confirmed) => {
        if (confirmed) {
          this.dispatchEvent(
            new CustomEvent<Vervoerstoer>('delete', {
              bubbles: true,
              composed: true,
              detail: v,
            }),
          );
        }
      });
  }

  override render() {
    return html`${this.vervoerstoeren.length
      ? this.renderTable()
      : html`<div>Geen vervoerstoeren gevonden</div>`}`;
  }

  private renderTable() {
    return html`<div class="row">
      <table class="table table-hover table-sm">
        <thead class="sticky-top">
          <tr>
            <th>Naam</th>
            <th>Bestemming</th>
            <th>Routes</th>
            <th>Aangemaakt door</th>
            <th>Compleet</th>
            <th style="width: 190px">Acties</th>
          </tr>
        </thead>
        <tbody>
          ${this.vervoerstoeren.map(
            (v) =>
              html`<tr>
                <td>${v.naam}</td>
                <td>${v.bestemmingStop?.locatie.naam ?? ''}</td>
                <td>${entities(v.routes.length, 'route')}</td>
                <td>${v.aangemaaktDoor}</td>
                <td>
                  ${v.compleet
                    ? html`<rock-icon icon="checkCircle" class="text-success"></rock-icon>`
                    : ''}
                </td>
                <td>
                  <rock-link
                    btn
                    sm
                    keepQuery
                    btnOutlinePrimary
                    href="/vervoerstoeren/edit/${v.id}/opstapplaatsen-kiezen"
                    ><rock-icon icon="pencil"></rock-icon
                  ></rock-link>
                  <rock-link
                    btn
                    sm
                    keepQuery
                    btnOutlineSecondary
                    href="/vervoerstoeren/edit/${v.id}/bekijken"
                    ><rock-icon icon="eye"></rock-icon
                  ></rock-link>
                  <button
                    @click=${() => this.deleteVervoerstoer(v)}
                    type="button"
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
