import {
  DeepPartial,
  Organisatie,
  OrganisatieFilter,
  Queryfied,
  UpsertableOrganisatie,
  foldersoorten,
  toOrganisatieFilter,
  tryParseInt,
} from '@rock-solid/shared';
import { html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { RockElement } from '../rock-element';
import { router } from '../router';
import { handleUniquenessError, toOrganisatiesCsv, toQuery } from '../shared';
import { organisatieStore } from './organisatie.store';
import {
  FormControl,
  InputControl,
  InputType,
  checkboxesItemsControl,
} from '../forms';
import { distinctUntilChanged, map } from 'rxjs';

@customElement('rock-organisaties')
export class OrganisatiesComponent extends RockElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  public path: string[] = [];

  @state()
  private organisaties: Organisatie[] | undefined;

  @state()
  private organisatieToEdit: Organisatie | undefined;

  @state()
  private newOrganisatie = newOrganisatie();

  @state()
  private loading = false;

  @state()
  private errorMessage: string | undefined;

  @state()
  private filter: OrganisatieFilter = {};

  override connectedCallback(): void {
    super.connectedCallback();
    this.subscription.add(
      organisatieStore.currentPageItem$.subscribe((orgs) => {
        this.organisaties = orgs;
      }),
    );
    this.subscription.add(
      organisatieStore.focussedItem$.subscribe(
        (org) => (this.organisatieToEdit = org),
      ),
    );
    this.subscription.add(
      router.routeChange$
        .pipe(
          map(
            ({ query }) =>
              query as Queryfied<OrganisatieFilter> & { page: string },
          ),
        )
        .pipe(distinctUntilChanged())
        .subscribe((query) => {
          const { page, ...filterParams } = query;
          this.filter = toOrganisatieFilter(filterParams);
          const currentPage = (tryParseInt(page) ?? 1) - 1;
          organisatieStore.setCurrentPage(currentPage, { ...this.filter });
        }),
    );
  }

  override update(props: PropertyValues<OrganisatiesComponent>): void {
    if (props.has('path')) {
      this.errorMessage = undefined;
      if (this.path[0] === 'new') {
        this.newOrganisatie = newOrganisatie();
      }
      if (this.path[0] === 'edit' && this.path[1]) {
        organisatieStore.setFocus(this.path[1]);
      } else {
        organisatieStore.removeFocus();
      }
    }
    super.update(props);
  }

  private async createOrganisatie(organisatie: UpsertableOrganisatie) {
    this.loading = true;
    this.errorMessage = '';
    organisatieStore
      .create(organisatie)
      .pipe(handleUniquenessError((message) => (this.errorMessage = message)))
      .subscribe({
        next: () => {
          this.errorMessage = '';
          router.navigate(`../list`);
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  private async updateOrganisatie() {
    this.loading = true;
    this.errorMessage = '';
    organisatieStore
      .update(this.organisatieToEdit!.id, this.organisatieToEdit!)
      .pipe(handleUniquenessError((message) => (this.errorMessage = message)))
      .subscribe({
        next: () => {
          this.errorMessage = '';
          router.navigate('../../list');
        },
        complete: () => {
          this.loading = false;
        },
      });
  }
  private async deleteOrganisatie(ev: CustomEvent<Organisatie>) {
    organisatieStore.delete(ev.detail.id).subscribe();
  }

  private doSearch() {
    router.setQuery(toQuery(this.filter));
  }

  override render() {
    switch (this.path[0]) {
      case 'list':
        return html`
          <div class="row">
            <h2 class="col">Organisaties</h2>
          </div>
          <div class="row">
            <div class="col">
              <rock-link href="/organisaties/new" btn btnSuccess
                ><rock-icon icon="journalPlus" size="md"></rock-icon>
                Organisatie</rock-link
              >
              <rock-export
                .store=${organisatieStore}
                .filter=${this.filter}
                .toCsv=${toOrganisatiesCsv}
                exportTitle="organisaties"
              ></rock-export>
            </div>
          </div>
          <rock-search
            .mainControl=${mainSearchControl}
            .advancedControls=${advancedSearchControls}
            .filter=${this.filter}
            @search-submitted=${() => this.doSearch()}
          ></rock-search>
          ${this.organisaties
            ? html`
                <rock-organisaties-list
                  class="row"
                  .organisaties=${this.organisaties}
                  @delete=${this.deleteOrganisatie}
                ></rock-organisaties-list>
                <rock-paging .store=${organisatieStore}></rock-paging>
              `
            : html`<rock-loading></rock-loading>`}
        `;
      case 'new':
        return this.loading
          ? html`<rock-loading></rock-loading>`
          : html`<rock-edit-organisatie
              .organisatie="${this.newOrganisatie}"
              .errorMessage=${this.errorMessage}
              @organisatie-submitted="${(event: CustomEvent<Organisatie>) =>
                this.createOrganisatie(event.detail)}"
            ></rock-edit-organisatie>`;
      case 'edit':
        return html`${this.organisatieToEdit
          ? html`<rock-edit-organisatie
              .organisatie="${this.organisatieToEdit}"
              .errorMessage=${this.errorMessage}
              @organisatie-submitted=${this.updateOrganisatie}
            ></rock-edit-organisatie>`
          : html`<rock-loading></rock-loading>`}`;
      default:
        router.navigate(`/organisaties/list`);
    }
  }
}

function newOrganisatie(): DeepPartial<Organisatie> {
  return { contacten: [{ foldervoorkeuren: [{}] }] };
}

const mainSearchControl: InputControl<OrganisatieFilter> = {
  type: InputType.text,
  name: 'naam',
  label: 'Naam',
  placeholder: 'Zoek op organisatienaam',
};

const advancedSearchControls: FormControl<OrganisatieFilter>[] = [
  checkboxesItemsControl('folders', foldersoorten, { label: 'Folders' }),
];
