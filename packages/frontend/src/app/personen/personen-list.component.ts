import { html, LitElement, nothing } from 'lit';
import {
  overigPersoonSelecties,
  Persoon,
  PersoonType,
  persoonTypes,
} from '@kei-crm/shared';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { pluralize, show } from '../shared/utility.pipes';
import { fullName } from './full-name.pipe';
import { plaatsName } from '../forms/adres.pipes';

@customElement('kei-personen-list')
export class PersonenComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  private personen: Persoon[] | undefined;

  @property()
  public type: PersoonType = 'deelnemer';

  override render() {
    return html` <div class="row">
      ${this.personen
        ? html`${this.personen.length
            ? this.renderTable()
            : html`<div>Geen ${pluralize(this.type)} gevonden 🤷‍♂️</div>`}`
        : html`<kei-loading></kei-loading>`}
    </div>`;
  }

  private renderTable(): unknown {
    return html`<table class="table table-hover">
      <thead>
        <tr>
          <th>Naam</th>
          <th>Type</th>
          ${this.type === 'overigPersoon' ? html`<th>Selectie</th>` : nothing}
          <th>Emailadres</th>
          <th>Geslacht</th>
          <th>Telefoonnummer</th>
          <th>Gsm</th>
          <th>Woonplaats</th>
          <th>Acties</th>
        </tr>
      </thead>
      <tbody>
        ${this.personen!.map(
          (persoon) => html`<tr>
            <td>${fullName(persoon)}</td>
            <td>${persoonTypes[persoon.type]}</td>
            ${persoon.type === 'overigPersoon'
              ? html`<td>
                  ${persoon.selectie
                    .map((item) => overigPersoonSelecties[item])
                    .join(', ')}
                </td>`
              : nothing}
            <td>${show(persoon.emailadres)}</td>
            <td>${show(persoon.geslacht)}</td>
            <td>${show(persoon.telefoonnummer)}</td>
            <td>${show(persoon.gsmNummer)}</td>
            <td>${plaatsName(persoon.verblijfadres.plaats)}</td>
            <td>
              <kei-link btn btnSecondary href="../edit/${persoon.id}"
                ><kei-icon icon="pencil"></kei-icon
              ></kei-link>
            </td>
          </tr>`,
        )}
      </tbody>
    </table>`;
  }
}
