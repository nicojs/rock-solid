import { html, PropertyValues } from 'lit';
import {
  BasePersoon,
  deelnemerLabels,
  DeepPartial,
  foldersoorten,
  geslachten,
  overigPersoonLabels,
  overigPersoonSelecties,
  Persoon,
  PersoonFilter,
  PersoonType,
  persoonTypes,
  Queryfied,
  toPersoonFilter,
  tryParseInt,
  UpsertablePersoon,
  werksituaties,
} from '@rock-solid/shared';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { router } from '../router';
import {
  capitalize,
  pluralize,
  toDeelnemersCsv,
  toOverigePersonenCsv,
  toQuery,
} from '../shared';
import { fullName } from './persoon.pipe';
import { RockElement } from '../rock-element';
import { personenStore } from './personen.store';
import { routesByPersoonType } from './routing-helper';
import {
  checkboxesItemsControl,
  FormControl,
  InputControl,
  InputType,
  selectControl,
} from '../forms';
import { distinctUntilChanged, map } from 'rxjs';
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

  @state()
  private filter: PersoonFilter = {
    type: 'deelnemer',
  };

  override update(changedProperties: PropertyValues<PersonenComponent>) {
    if (
      changedProperties.has('path') &&
      ['edit', 'display'].includes(this.path[0] ?? '') &&
      this.path[1]
    ) {
      personenStore.setFocus(this.path[1]);
    }
    super.update(changedProperties);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.subscription.add(
      personenStore.currentPageItem$.subscribe(
        (personen) => (this.personen = personen),
      ),
    );

    this.subscription.add(
      personenStore.focussedItem$.subscribe(
        (item) => (this.focussedPersoon = item),
      ),
    );
    this.subscription.add(
      router.routeChange$
        .pipe(
          map(
            ({ query }) => query as Queryfied<PersoonFilter> & { page: string },
          ),
        )
        .pipe(distinctUntilChanged())
        .subscribe((query) => {
          const { page, ...filterParams } = query;
          this.filter = toPersoonFilter(filterParams);
          this.filter.type = this.type;
          const currentPage = (tryParseInt(page) ?? 1) - 1;
          personenStore.setCurrentPage(currentPage, { ...this.filter });
        }),
    );
  }

  private async createNewPersoon(event: CustomEvent<UpsertablePersoon>) {
    this.editIsLoading = true;
    personenStore.create(event.detail).subscribe(() => {
      this.editIsLoading = false;
      router.navigate('../list');
    });
  }

  private doSearch() {
    const query = toQuery(this.filter);
    delete query['type']; // not needed, already in the path
    router.setQuery(query);
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

  private async deletePersoon(ev: CustomEvent<Persoon>) {
    personenStore.delete(ev.detail.id).subscribe();
  }

  override render() {
    switch (this.path[0]) {
      case 'list':
        return html`<div class="row">
            <h2 class="col">${capitalize(pluralize(this.type))}</h2>
          </div>
          <div class="row">
            <div class="col">
              <rock-link href="../new" btn btnSuccess
                ><rock-icon icon="personPlus"></rock-icon> ${capitalize(
                  persoonTypes[this.type],
                )}</rock-link
              >
              <rock-export
                .store=${personenStore}
                .filter=${this.filter}
                .toCsv=${this.type === 'deelnemer'
                  ? toDeelnemersCsv
                  : toOverigePersonenCsv}
                .exportTitle=${capitalize(pluralize(this.type))}
              ></rock-export>
            </div>
          </div>
          <rock-search
            .mainControl=${mainSearchControl}
            .advancedControls=${this.type === 'deelnemer'
              ? deelnemerSearchControls
              : overigPersoonSearchControls}
            .filter=${this.filter}
            @search-submitted=${() => this.doSearch()}
          ></rock-search>
          ${this.personen
            ? html`<rock-personen-list
                  .type=${this.type}
                  .personen=${this.personen}
                  @delete=${this.deletePersoon}
                ></rock-personen-list>
                <rock-paging .store=${personenStore}></rock-paging> `
            : html`<rock-loading></rock-loading>`}`;
      case 'new':
        const persoon: DeepPartial<Persoon> = {
          type: this.type,
          verblijfadres: {},
          foldervoorkeuren: [],
          fotoToestemming: {},
        };
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
      default:
        router.navigate(`/${routesByPersoonType[this.type]}/list`);
        return html``;
    }
  }
}

const mainSearchControl: InputControl<PersoonFilter> = {
  type: InputType.text,
  name: 'volledigeNaamLike',
  label: 'Naam',
  placeholder: 'Zoek op naam',
};

const overigPersoonSearchControls: FormControl<PersoonFilter>[] = [
  checkboxesItemsControl('selectie', overigPersoonSelecties, {
    label: overigPersoonLabels.selectie,
  }),
  checkboxesItemsControl('foldersoorten', foldersoorten, {
    label: 'Folders',
  }),
];

const deelnemerSearchControls: FormControl<PersoonFilter>[] = [
  selectControl('geslacht', geslachten, {
    label: deelnemerLabels.geslacht,
    placeholder: 'Geen filter',
  }),
  selectControl('werksituatie', werksituaties, {
    label: deelnemerLabels.werksituatie,
    placeholder: 'Geen filter',
  }),
  {
    type: InputType.number,
    label: 'Laatste aanmelding',
    name: 'laatsteAanmeldingJaarGeleden',
    postfix: 'jaar geleden',
  },
  {
    type: InputType.number,
    label: 'Min leeftijd',
    name: 'minLeeftijd',
    postfix: 'jaar oud',
  },
  {
    type: InputType.number,
    label: 'Max leeftijd',
    name: 'maxLeeftijd',
    postfix: 'jaar oud',
  },
  checkboxesItemsControl('foldersoorten', foldersoorten, {
    label: 'Folders',
  }),
];
