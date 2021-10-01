import { html, LitElement, PropertyValues } from 'lit';
import {
  BasePersoon,
  Persoon,
  PersoonType,
  UpsertablePersoon,
} from '@kei-crm/shared';
import { persoonService } from './persoon.service';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { router } from '../router';
import { capitalize } from '../shared';
import { createRef, ref, Ref } from 'lit/directives/ref.js';
import { fullName } from './full-name.pipe';

@customElement('kei-personen')
export class PersonenComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  private personen: BasePersoon[] | undefined;

  @property({ attribute: false })
  private persoonToEdit: Persoon | undefined;

  @property()
  public type: PersoonType = 'deelnemer';

  @property({ attribute: false })
  public path: string[] = [];

  @property({ attribute: false, type: Boolean })
  public editIsLoading = false;

  override connectedCallback() {
    super.connectedCallback();
  }

  override updated(changedProperties: PropertyValues<PersonenComponent>) {
    if (changedProperties.has('type')) {
      this.reloadPersonen();
    }
    if (
      changedProperties.has('path') &&
      this.path[0] === 'edit' &&
      this.path[1]
    ) {
      persoonService.get(this.path[1]).then((persoon) => {
        this.persoonToEdit = persoon;
      });
    }
  }

  private reloadPersonen() {
    this.personen = undefined;
    persoonService
      .getAll({ type: this.type, searchType: 'persoon' })
      .then((personen) => {
        this.personen = personen;
      });
  }

  private searchFormSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (this.searchRef.value?.value) {
      this.personen = undefined;
      persoonService
        .getAll({
          type: this.type,
          search: this.searchRef.value.value,
          searchType: 'text',
        })
        .then((personen) => (this.personen = personen));
    }
  }

  private async createNewPersoon(event: CustomEvent<UpsertablePersoon>) {
    this.editIsLoading = true;
    await persoonService.create(event.detail);
    this.editIsLoading = false;
    this.reloadPersonen();
    router.navigate(`/${this.type}s/list`);
  }

  private async updatePersoon() {
    this.editIsLoading = true;
    await persoonService.update(this.persoonToEdit!.id, this.persoonToEdit!);
    this.editIsLoading = false;
    this.reloadPersonen();
    router.navigate(`/${this.type}s/list`);
  }

  private searchRef: Ref<HTMLInputElement> = createRef();
  override render() {
    switch (this.path[0]) {
      case 'list':
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
            ? html`<kei-personen-list
                  .personen="${this.personen}"
                ></kei-personen-list>
                <kei-link href="/${this.type}s/new" btn btnSuccess
                  ><kei-icon icon="personPlus"></kei-icon> ${capitalize(
                    this.type,
                  )}</kei-link
                >`
            : html`<kei-loading></kei-loading>`}`;
      case 'new':
        const persoon: UpsertablePersoon = {
          type: this.type,
          achternaam: '',
        };
        return html` <h2>${capitalize(this.type)} toevoegen</h2>
          ${this.editIsLoading
            ? html`<kei-loading></kei-loading>`
            : html`<kei-persoon-edit
                .persoon="${persoon}"
                @persoon-submitted=${this.createNewPersoon}
              ></kei-persoon-edit>`}`;
      case 'edit':
        return html`${this.persoonToEdit
          ? html`<h2>
                ${capitalize(this.type)} ${fullName(this.persoonToEdit)}
                wijzigen
              </h2>
              <kei-persoon-edit
                .persoon="${this.persoonToEdit}"
                @persoon-submitted=${this.updatePersoon}
              ></kei-persoon-edit>`
          : html`<kei-loading></kei-loading>`}`;
      default:
        this.reloadPersonen();
        router.navigate(`/${this.type}s/list`);
        return html``;
    }
  }
}
