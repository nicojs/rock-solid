import { Persoon } from '@kei-crm/shared';
import { persoonService } from '../persoon.service';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../../styles';
import { show } from '../../shared/utility.pipes';
import { fullName } from '../full-name.pipe';

@customElement('kei-personen')
export class PersonenComponent extends LitElement {
  static override styles = [bootstrap];

  constructor(private persoon = persoonService) {
    super();
  }

  @property({ attribute: false })
  private personen: Persoon[] | undefined;

  override connectedCallback() {
    super.connectedCallback();
    this.persoon.getAll().then((personen) => {
      this.personen = personen;
    });
  }

  override render() {
    return html` <h2>Personen</h2>
      ${this.personen
        ? html`<table class="table table-hover">
            <thead>
              <tr>
                <th>Naam</th>
                <th>Emailadres</th>
                <th>Geslacht</th>
                <th>Telefoonnummer</th>
                <th>Gsm</th>
                <th>Communicatievoorkeur</th>
                <th>Acties</th>
              </tr>
            </thead>
            <tbody>
              ${this.personen.map(
                (persoon) =>
                  html`<tr>
                    <td>${fullName(persoon)}</td>
                    <td>${show(persoon.emailadres)}</td>
                    <td>${show(persoon.geslacht)}</td>
                    <td>${show(persoon.telefoonnummer)}</td>
                    <td>${show(persoon.gsmNummer)}</td>
                    <td>${show(persoon.communicatievoorkeur)}</td>
                    <td>
                      <kei-edit-button href="/personen/edit/${
                        persoon.id
                      }"></kei-link>
                    </td>
                  </tr>`,
              )}
            </tbody>
          </table>`
        : html`<kei-loading></kei-loading>`}`;
  }
}
