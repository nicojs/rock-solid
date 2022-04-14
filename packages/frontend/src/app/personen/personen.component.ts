import { html, PropertyValues } from 'lit';
import {
  BasePersoon,
  DeepPartial,
  Persoon,
  PersoonType,
  persoonTypes,
  UpsertablePersoon,
} from '@rock-solid/shared';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { router } from '../router';
import { capitalize, pluralize } from '../shared';
import { createRef, ref, Ref } from 'lit/directives/ref.js';
import { fullName } from './full-name.pipe';
import { RockElement } from '../rock-element';
import { personenStore } from './personen.store';

@customElement('rock-personen')
export class PersonenComponent extends RockElement {
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
      personenStore.setFilter({
        type: this.type,
        searchType: 'persoon',
      });
    }
    if (
      changedProperties.has('path') &&
      this.path[0] === 'edit' &&
      this.path[1]
    ) {
      personenStore.setFocus(this.path[1]);
    }
  }

  @state()
  private totalCount = 0;

  override connectedCallback(): void {
    super.connectedCallback();
    this.subscription.add(
      personenStore.currentPageItem$.subscribe(
        (personen) => (this.personen = personen),
      ),
    );
    this.subscription.add(
      personenStore.totalCount$.subscribe((count) => (this.totalCount = count)),
    );
    this.subscription.add(
      personenStore.focussedItem$.subscribe(
        (item) => (this.persoonToEdit = item),
      ),
    );
  }

  private searchFormSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (this.searchRef.value?.value) {
      personenStore.setCurrentPage(0, {
        type: this.type,
        search: this.searchRef.value.value,
        searchType: 'text',
      });
    } else {
      personenStore.setCurrentPage(0, undefined);
    }
  }

  private async createNewPersoon(event: CustomEvent<UpsertablePersoon>) {
    this.editIsLoading = true;
    personenStore.create(event.detail).subscribe(() => {
      this.editIsLoading = false;
      router.navigate('../list');
    });
  }

  private async updatePersoon() {
    this.editIsLoading = true;
    personenStore
      .update(this.persoonToEdit!.id, this.persoonToEdit!)
      .subscribe(() => {
        this.editIsLoading = false;
        router.navigate('../../list');
      });
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
                  <rock-icon icon="search"></rock-icon>
                </button>
              </form>
            </div>
          </div>
          <div class="row">
            <div class="col">
              <rock-link href="../new" btn btnSuccess
                ><rock-icon icon="personPlus"></rock-icon> ${capitalize(
                  persoonTypes[this.type],
                )}</rock-link
              >
              <rock-link btn btnOutlineSecondary href="../zoeken"
                ><rock-icon icon="search"></rock-icon> Geavanceerd
                zoeken</rock-link
              >
            </div>
          </div>
          ${this.personen
            ? html`<rock-personen-list
                  .type=${this.type}
                  .personen=${this.personen}
                ></rock-personen-list>
                <rock-paging
                  @navigate-page=${(event: CustomEvent<number>) =>
                    personenStore.setCurrentPage(event.detail)}
                  .store=${personenStore}
                ></rock-paging> `
            : html`<rock-loading></rock-loading>`}`;
      case 'new':
        const persoon: DeepPartial<Persoon> = {
          type: this.type,
          verblijfadres: {},
        };
        return html` <h2>${capitalize(persoonTypes[this.type])} toevoegen</h2>
          ${this.editIsLoading
            ? html`<rock-loading></rock-loading>`
            : html`<rock-persoon-edit
                .persoon="${persoon}"
                @persoon-submitted=${this.createNewPersoon}
              ></rock-persoon-edit>`}`;
      case 'edit':
        return html`${this.persoonToEdit
          ? html`<h2>
                ${capitalize(this.type)} ${fullName(this.persoonToEdit)}
                wijzigen
              </h2>
              <rock-persoon-edit
                .persoon="${this.persoonToEdit}"
                @persoon-submitted=${this.updatePersoon}
              ></rock-persoon-edit>`
          : html`<rock-loading></rock-loading>`}`;
      case 'zoeken':
        return html`<rock-advanced-search-personen
          .type=${this.type}
        ></rock-advanced-search-personen>`;
      default:
        router.navigate('./list');
        return html``;
    }
  }
}
