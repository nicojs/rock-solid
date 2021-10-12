import { html, LitElement } from 'lit';
import { BasePersoon, PersoonType } from '@kei-crm/shared';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { show } from '../shared/utility.pipes';
import { fullName } from './full-name.pipe';

@customElement('kei-personen-list')
export class PersonenComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  private personen: BasePersoon[] | undefined;

  @property()
  public type: PersoonType = 'deelnemer';

  override render() {
    return html` <div class="row">
      ${this.personen
        ? html`${this.personen.length
            ? this.renderTable()
            : html`<div>Geen ${this.type}s gevonden 🤷‍♂️</div>`}`
        : html`<kei-loading></kei-loading>`}
    </div>`;
  }

  private renderTable(): unknown {
    return html`<table class="table table-hover">
      <thead>
        <tr>
          <th>Naam</th>
          <th>Type</th>
          <th>Emailadres</th>
          <th>Geslacht</th>
          <th>Telefoonnummer</th>
          <th>Gsm</th>
          <th>Communicatievoorkeur</th>
          <th>Acties</th>
        </tr>
      </thead>
      <tbody>
        ${this.personen!.map(
          (persoon) => html`<tr>
            <td>${fullName(persoon)}</td>
            <td>${show(persoon.type)}</td>
            <td>${show(persoon.emailadres)}</td>
            <td>${show(persoon.geslacht)}</td>
            <td>${show(persoon.telefoonnummer)}</td>
            <td>${show(persoon.gsmNummer)}</td>
            <td>${show(persoon.communicatievoorkeur)}</td>
            <td>
              <kei-link
                btn
                btnSecondary
                href="/${persoon.type}s/edit/${persoon.id}"
                ><kei-icon icon="pencil"></kei-icon
              ></kei-link>
            </td>
          </tr>`,
        )}
      </tbody>
    </table>`;
  }
}
