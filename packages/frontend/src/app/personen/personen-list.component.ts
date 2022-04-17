import { html, LitElement, nothing } from 'lit';
import {
  overigPersoonSelecties,
  Persoon,
  PersoonType,
} from '@rock-solid/shared';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { pluralize, show, showAdres } from '../shared';
import { fullName } from './full-name.pipe';

@customElement('rock-personen-list')
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
        : html`<rock-loading></rock-loading>`}
    </div>`;
  }

  private renderTable(): unknown {
    return html`<table class="table table-hover">
      <thead>
        <tr>
          <th>Naam</th>
          ${this.type === 'overigPersoon' ? html`<th>Selectie</th>` : nothing}
          <th>Emailadres</th>
          <th>Geslacht</th>
          <th>Telefoonnummer</th>
          <th>Gsm</th>
          <th>Verblijfadres</th>
          <th>Acties</th>
        </tr>
      </thead>
      <tbody>
        ${this.personen!.map(
          (persoon) => html`<tr>
            <td>${fullName(persoon)}</td>
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
            <td>${showAdres(persoon.verblijfadres)}</td>
            <td>
              <rock-link btn btnSecondary href="../edit/${persoon.id}"
                ><rock-icon icon="pencil"></rock-icon
              ></rock-link>
            </td>
          </tr>`,
        )}
      </tbody>
    </table>`;
  }
}
