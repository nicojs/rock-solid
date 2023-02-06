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
import { routesByPersoonType } from './routing-helper';

@customElement('rock-personen')
export class PersonenComponent extends RockElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  private personen: BasePersoon[] | undefined;

  @property({ attribute: false })
  private focussedPersoon: Persoon | undefined;

  @property({})
  public type: PersoonType = 'deelnemer';

  @property({ attribute: false })
  public path: string[] = [];

  @property({ attribute: false, type: Boolean })
  public editIsLoading = false;

  override update(changedProperties: PropertyValues<PersonenComponent>) {
    if (changedProperties.has('type')) {
      personenStore.setFilter({
        type: this.type,
        searchType: 'persoon',
      });
    }
    if (
      changedProperties.has('path') &&
      ['edit', 'display'].includes(this.path[0] ?? '') &&
      this.path[1]
    ) {
      personenStore.setFocus(this.path[1]);
    }
    super.update(changedProperties);
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
        (item) => (this.focussedPersoon = item),
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
      .update(this.focussedPersoon!.id, this.focussedPersoon!)
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
          voedingswens: 'geen',
          verblijfadres: {},
          geslacht: 'onbekend',
        };
        if (persoon.type === 'overigPersoon') {
          persoon.foldervoorkeuren = [];
        }
        if (persoon.type === 'deelnemer') {
          persoon.werksituatie = 'onbekend';
          persoon.woonsituatie = 'onbekend';
        }
        return html`<h2>${capitalize(persoonTypes[this.type])} toevoegen</h2>
          ${this.editIsLoading
            ? html`<rock-loading></rock-loading>`
            : html`<rock-edit-persoon
                .persoon="${persoon}"
                @persoon-submitted=${this.createNewPersoon}
              ></rock-edit-persoon>`}`;
      case 'edit':
        return html`${this.focussedPersoon
          ? html`<h2>
                ${capitalize(persoonTypes[this.type])}
                ${fullName(this.focussedPersoon)} wijzigen
              </h2>
              <rock-edit-persoon
                .persoon="${this.focussedPersoon}"
                @persoon-submitted=${this.updatePersoon}
              ></rock-edit-persoon>`
          : html`<rock-loading></rock-loading>`}`;
      case 'display':
        return html`${this.focussedPersoon
          ? html`<h2>
                ${capitalize(persoonTypes[this.type])}
                ${fullName(this.focussedPersoon)} bekijken
              </h2>
              <rock-display-persoon
                .persoon="${this.focussedPersoon}"
              ></rock-display-persoon>`
          : html`<rock-loading></rock-loading>`}`;
      case 'zoeken':
        return html`<rock-advanced-search-personen
          .type=${this.type}
        ></rock-advanced-search-personen>`;
      default:
        router.navigate(`/${routesByPersoonType[this.type]}/list`);
        return html``;
    }
  }
}
