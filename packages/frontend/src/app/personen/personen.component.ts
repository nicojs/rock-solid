import { html, LitElement, PropertyValues } from 'lit';
import {
  BasePersoon,
  Persoon,
  PersoonType,
  persoonTypes,
  UpsertablePersoon,
} from '@kei-crm/shared';
import { persoonService } from './persoon.service';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { router } from '../router';
import { capitalize, pluralize } from '../shared';
import { createRef, ref, Ref } from 'lit/directives/ref.js';
import { fullName } from './full-name.pipe';

@customElement('kei-personen')
export class PersonenComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  private personen: BasePersoon[] | undefined;

  @property({ attribute: false })
  private persoonToEdit: Persoon | undefined;

  @property({})
  public type: PersoonType = 'deelnemer';

  @property({ attribute: false })
  public path: string[] = [];

  @property({ attribute: false, type: Boolean })
  public editIsLoading = false;

  override updated(changedProperties: PropertyValues<PersonenComponent>) {
    if (changedProperties.has('type')) {
      this.loadPersonen();
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

  @state()
  private page = 0;
  @state()
  private totalCount = 0;

  private loadPersonen() {
    this.personen = undefined;
    persoonService
      .getPage(this.page, { type: this.type, searchType: 'persoon' })
      .then(({ items, totalCount }) => {
        this.personen = items;
        this.totalCount = totalCount;
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
        .then((personen) => {
          this.personen = personen;
          this.page = 0;
          this.totalCount = personen.length; // remove paging
        });
    }
  }

  private async createNewPersoon(event: CustomEvent<UpsertablePersoon>) {
    this.editIsLoading = true;
    await persoonService.create(event.detail);
    this.editIsLoading = false;
    this.loadPersonen();
    router.navigate('../list');
  }

  private async updatePersoon() {
    this.editIsLoading = true;
    await persoonService.update(this.persoonToEdit!.id, this.persoonToEdit!);
    this.editIsLoading = false;
    this.loadPersonen();
    router.navigate('../../list');
  }

  public navigatePage(page: number) {
    this.page = page;
    this.loadPersonen();
  }

  private searchRef: Ref<HTMLInputElement> = createRef();
  override render() {
    switch (this.path[0]) {
      case 'list':
        return html` <div class="row">
            <h2 class="col-sm-6 col-md-8">
              ${capitalize(pluralize(this.type))}${this.personen
                ? html` (${this.totalCount})`
                : ''}
            </h2>
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
          <div class="row">
            <div class="col">
              <kei-link href="../new" btn btnSuccess
                ><kei-icon icon="personPlus"></kei-icon> ${capitalize(
                  persoonTypes[this.type],
                )}</kei-link
              >
              <kei-link btn btnOutlineSecondary href="../zoeken"
                ><kei-icon icon="search"></kei-icon> Geavanceerd
                zoeken</kei-link
              >
            </div>
          </div>
          ${this.personen
            ? html`<kei-personen-list
                  .type=${this.type}
                  .personen=${this.personen}
                ></kei-personen-list>
                <kei-paging
                  @navigate-page=${(event: CustomEvent<number>) =>
                    this.navigatePage(event.detail)}
                  .currentPage=${this.page}
                  .totalCount=${this.totalCount}
                ></kei-paging> `
            : html`<kei-loading></kei-loading>`}`;
      case 'new':
        const persoon = {
          type: this.type,
          adres: {},
        };
        return html` <h2>${capitalize(persoonTypes[this.type])} toevoegen</h2>
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
      case 'zoeken':
        return html`<kei-advanced-search-personen
          .type=${this.type}
        ></kei-advanced-search-personen>`;
      default:
        this.loadPersonen();
        router.navigate('./list');
        return html``;
    }
  }
}
