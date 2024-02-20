import { customElement, property, state } from 'lit/decorators.js';
import { RockElement } from '../rock-element';
import { bootstrap } from '../../styles';
import {
  Locatie,
  LocatieFilter,
  DeepPartial,
  Queryfied,
  UpsertableLocatie,
  locatieLabels,
  toLocatieFilter,
  tryParseInt,
  Privilege,
} from '@rock-solid/shared';
import { locatieStore } from './locatie.store';
import { PropertyValues, html } from 'lit';
import { handleUniquenessError, toQuery } from '../shared';
import { router } from '../router';
import { InputControl, InputType } from '../forms';

@customElement('rock-locaties')
export class LocatiesComponent extends RockElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  public path: string[] = [];

  @property({ attribute: false })
  public query?: Queryfied<LocatieFilter> & { page: string };

  @state()
  private locaties?: Locatie[];

  @state()
  private locatieToEdit?: Locatie;

  @state()
  private newLocatie = newLocatie();

  @state()
  private errorMessage?: string;

  @state()
  private loading = false;

  @state()
  private filter: LocatieFilter = {};

  override connectedCallback(): void {
    super.connectedCallback();
    this.subscription.add(
      locatieStore.currentPageItem$.subscribe((locaties) => {
        this.locaties = locaties;
      }),
    );
    this.subscription.add(
      locatieStore.focussedItem$.subscribe((org) => (this.locatieToEdit = org)),
    );
  }

  override update(props: PropertyValues<LocatiesComponent>): void {
    if (props.has('path')) {
      this.errorMessage = undefined;
      if (this.path[0] === 'new') {
        this.newLocatie = newLocatie();
      }
      if (this.path[0] === 'edit' && this.path[1]) {
        locatieStore.setFocus(this.path[1]);
      } else {
        locatieStore.removeFocus();
      }
    }
    if (
      (props.has('query') || props.has('path')) &&
      this.query &&
      !this.path.length
    ) {
      const { page, ...filterParams } = this.query;
      this.filter = toLocatieFilter(filterParams);
      const currentPage = (tryParseInt(page) ?? 1) - 1;
      locatieStore.setCurrentPage(currentPage, { ...this.filter });
    }
    super.update(props);
  }

  private async createLocatie(locatie: UpsertableLocatie) {
    this.loading = true;
    this.errorMessage = '';
    locatieStore
      .create(locatie)
      .pipe(
        handleUniquenessError(
          (message) => (this.errorMessage = message),
          locatieLabels,
        ),
      )
      .subscribe({
        next: () => {
          this.errorMessage = '';
          navigateToLocatiesPage();
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  private async updateLocatie() {
    this.loading = true;
    this.errorMessage = '';
    locatieStore
      .update(this.locatieToEdit!.id, this.locatieToEdit!)
      .pipe(
        handleUniquenessError(
          (message) => (this.errorMessage = message),
          locatieLabels,
        ),
      )
      .subscribe({
        next: () => {
          this.errorMessage = '';
          navigateToLocatiesPage();
        },
        complete: () => {
          this.loading = false;
        },
      });
  }
  private async deleteLocatie(ev: CustomEvent<Locatie>) {
    locatieStore.delete(ev.detail.id).subscribe();
  }

  override render() {
    switch (this.path[0]) {
      case undefined:
        return html`<div class="row">
            <h2 class="col">Locaties</h2>
          </div>
          <div class="row">
            <div class="col">
              <rock-link href="/locaties/new" btn btnSuccess
                ><rock-icon icon="journalPlus" size="md"></rock-icon>
                Locatie</rock-link
              >
            </div>
          </div>
          <rock-search
            .mainControl=${mainSearchControl}
            .filter=${this.filter}
            @search-submitted=${() => router.setQuery(toQuery(this.filter))}
          ></rock-search>
          ${this.locaties !== undefined
            ? html`
                <rock-locatie-list
                  .locaties=${this.locaties}
                  @delete=${this.deleteLocatie}
                ></rock-locatie-list>
                <rock-paging .store=${locatieStore}></rock-paging>
              `
            : html`<rock-loading></rock-loading>`}`;
      case 'new':
        return this.loading
          ? html`<rock-loading></rock-loading>`
          : html`<rock-edit-locatie
              .locatie="${this.newLocatie}"
              .errorMessage=${this.errorMessage}
              privilege=${'create:locaties' satisfies Privilege}
              @locatie-submitted="${(event: CustomEvent<Locatie>) =>
                this.createLocatie(event.detail)}"
            ></rock-edit-locatie>`;
      case 'edit':
        return html`${this.locatieToEdit
          ? html`<rock-edit-locatie
              .locatie="${this.locatieToEdit}"
              .errorMessage=${this.errorMessage}
              privilege=${'update:locaties' satisfies Privilege}
              @locatie-submitted=${() => this.updateLocatie()}
            ></rock-edit-locatie>`
          : html`<rock-loading></rock-loading>`}`;
      default:
        navigateToLocatiesPage();
    }
  }
}
function navigateToLocatiesPage() {
  router.navigate('/locaties');
}

const mainSearchControl: InputControl<LocatieFilter> = {
  type: InputType.text,
  name: 'naam',
  label: 'Naam',
  placeholder: 'Zoek op naam',
};

function newLocatie(): DeepPartial<Locatie> {
  return {};
}
