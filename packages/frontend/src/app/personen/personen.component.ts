import { html, LitElement, PropertyValues } from 'lit';
import { createRef, Ref, ref } from 'lit/directives/ref.js';
import { BasePersoon, PersoonType } from '@kei-crm/shared';
import { persoonService } from './persoon.service';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { capitalize, show } from '../shared/utility.pipes';
import { fullName } from './full-name.pipe';

@customElement('kei-personen')
export class PersonenComponent extends LitElement {
  static override styles = [bootstrap];

  constructor(private persoon = persoonService) {
    super();
  }

  @property({ attribute: false })
  private personen: BasePersoon[] | undefined;

  @property()
  public type: PersoonType = 'deelnemer';

  override connectedCallback() {
    super.connectedCallback();
  }

  override updated(changedProperties: PropertyValues<PersonenComponent>) {
    if (changedProperties.has('type')) {
      this.personen = undefined;
      this.persoon
        .getAll({ type: this.type, searchType: 'persoon' })
        .then((personen) => {
          this.personen = personen;
        });
    }
  }

  private searchRef: Ref<HTMLInputElement> = createRef();

  private searchFormSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (this.searchRef.value) {
      this.personen = undefined;
      this.persoon
        .getAll({
          type: this.type,
          search: this.searchRef.value.value,
          searchType: 'text',
        })
        .then((personen) => (this.personen = personen));
    }
  }

  override render() {
    return html` <div class="row">
        <h2 class="col-sm-6 col-md-8">${capitalize(this.type)}s</h2>
        <div class="col">
          <form @submit="${this.searchFormSubmit}" class="input-group">
            <input
              type="text"
              ${ref(this.searchRef)}
              class="form-control"
              placeholder="Zoek op naam"
            />
            <button type="submit" class="btn btn-outline-secondary">
              <kei-icon icon="search"></kei-icon>
            </button>
          </form>
        </div>
      </div>
      ${this.personen
        ? this.personen.length
          ? this.renderTable()
          : html`Geen ${this.type}s gevonden 🤷‍♂️`
        : html`<kei-loading></kei-loading>`}`;
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
                  href="/${this.type}s/edit/${persoon.id}"
                  ><kei-icon icon="pencil"></kei-icon
                ></kei-link>
              </td>
            </tr>`,
          )}
        </tbody>
      </table>
      <kei-link href="/${this.type}s/new" btn btnSuccess
        ><kei-icon icon="personPlus" size="lg"></kei-icon> ${capitalize(
          this.type,
        )}</kei-link
      > `;
  }
}
