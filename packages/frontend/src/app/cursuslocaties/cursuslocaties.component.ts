import { customElement, property, state } from 'lit/decorators.js';
import { RockElement } from '../rock-element';
import { bootstrap } from '../../styles';
import {
  CursusLocatie,
  CursusLocatieFilter,
  DeepPartial,
  Queryfied,
  UpsertableCursusLocatie,
  cursusLocatieLabels,
  toCursusLocatieFilter,
  tryParseInt,
} from '@rock-solid/shared';
import { cursusLocatieStore } from './cursuslocatie.store';
import { PropertyValues, html } from 'lit';
import { handleUniquenessError, toQuery } from '../shared';
import { router } from '../router';
import { InputControl, InputType } from '../forms';

@customElement('rock-cursuslocaties')
export class CursusLocatiesComponent extends RockElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  public path: string[] = [];

  @property({ attribute: false })
  public query?: Queryfied<CursusLocatieFilter> & { page: string };

  @state()
  private cursuslocaties?: CursusLocatie[];

  @state()
  private cursuslocatieToEdit?: CursusLocatie;

  @state()
  private newCursuslocatie = newCursuslocatie();

  @state()
  private errorMessage?: string;

  @state()
  private loading = false;

  @state()
  private filter: CursusLocatieFilter = {};

  override connectedCallback(): void {
    super.connectedCallback();
    this.subscription.add(
      cursusLocatieStore.currentPageItem$.subscribe((cursuslocaties) => {
        this.cursuslocaties = cursuslocaties;
      }),
    );
    this.subscription.add(
      cursusLocatieStore.focussedItem$.subscribe(
        (org) => (this.cursuslocatieToEdit = org),
      ),
    );
  }

  override update(props: PropertyValues<CursusLocatiesComponent>): void {
    if (props.has('path')) {
      this.errorMessage = undefined;
      if (this.path[0] === 'new') {
        this.newCursuslocatie = newCursuslocatie();
      }
      if (this.path[0] === 'edit' && this.path[1]) {
        cursusLocatieStore.setFocus(this.path[1]);
      } else {
        cursusLocatieStore.removeFocus();
      }
    }
    if (
      (props.has('query') || props.has('path')) &&
      this.query &&
      !this.path.length
    ) {
      const { page, ...filterParams } = this.query;
      this.filter = toCursusLocatieFilter(filterParams);
      const currentPage = (tryParseInt(page) ?? 1) - 1;
      cursusLocatieStore.setCurrentPage(currentPage, { ...this.filter });
    }
    super.update(props);
  }

  private async createCursuslocatie(locatie: UpsertableCursusLocatie) {
    this.loading = true;
    this.errorMessage = '';
    cursusLocatieStore
      .create(locatie)
      .pipe(
        handleUniquenessError(
          (message) => (this.errorMessage = message),
          cursusLocatieLabels,
        ),
      )
      .subscribe({
        next: () => {
          this.errorMessage = '';
          navigateToCursuslocatiesPage();
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  private async updateCursuslocatie() {
    this.loading = true;
    this.errorMessage = '';
    cursusLocatieStore
      .update(this.cursuslocatieToEdit!.id, this.cursuslocatieToEdit!)
      .pipe(
        handleUniquenessError(
          (message) => (this.errorMessage = message),
          cursusLocatieLabels,
        ),
      )
      .subscribe({
        next: () => {
          this.errorMessage = '';
          navigateToCursuslocatiesPage();
        },
        complete: () => {
          this.loading = false;
        },
      });
  }
  private async deleteCursuslocatie(ev: CustomEvent<CursusLocatie>) {
    cursusLocatieStore.delete(ev.detail.id).subscribe();
  }

  override render() {
    switch (this.path[0]) {
      case undefined:
        return html`<div class="row">
            <h2 class="col">Cursuslocaties</h2>
          </div>
          <div class="row">
            <div class="col">
              <rock-link href="/cursuslocaties/new" btn btnSuccess
                ><rock-icon icon="journalPlus" size="md"></rock-icon>
                Cursuslocatie</rock-link
              >
            </div>
          </div>
          <rock-search
            .mainControl=${mainSearchControl}
            .filter=${this.filter}
            @search-submitted=${() => router.setQuery(toQuery(this.filter))}
          ></rock-search>
          ${this.cursuslocaties !== undefined
            ? html`
                <rock-cursuslocatie-list
                  .cursuslocaties=${this.cursuslocaties}
                  @delete=${this.deleteCursuslocatie}
                ></rock-cursuslocatie-list>
                <rock-paging .store=${cursusLocatieStore}></rock-paging>
              `
            : html`<rock-loading></rock-loading>`}`;
      case 'new':
        return this.loading
          ? html`<rock-loading></rock-loading>`
          : html`<rock-edit-cursuslocatie
              .cursuslocatie="${this.newCursuslocatie}"
              .errorMessage=${this.errorMessage}
              @cursuslocatie-submitted="${(event: CustomEvent<CursusLocatie>) =>
                this.createCursuslocatie(event.detail)}"
            ></rock-edit-cursuslocatie>`;
      case 'edit':
        return html`${this.cursuslocatieToEdit
          ? html`<rock-edit-cursuslocatie
              .cursuslocatie="${this.cursuslocatieToEdit}"
              .errorMessage=${this.errorMessage}
              @cursuslocatie-submitted=${() => this.updateCursuslocatie()}
            ></rock-edit-cursuslocatie>`
          : html`<rock-loading></rock-loading>`}`;
      default:
        navigateToCursuslocatiesPage();
    }
  }
}
function navigateToCursuslocatiesPage() {
  router.navigate('/cursuslocaties');
}

const mainSearchControl: InputControl<CursusLocatieFilter> = {
  type: InputType.text,
  name: 'naam',
  label: 'Naam',
  placeholder: 'Zoek op naam',
};

function newCursuslocatie(): DeepPartial<CursusLocatie> {
  return {};
}
