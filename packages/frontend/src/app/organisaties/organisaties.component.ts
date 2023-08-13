import {
  DeepPartial,
  Organisatie,
  UpsertableOrganisatie,
} from '@rock-solid/shared';
import { html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { RockElement } from '../rock-element';
import { router } from '../router';
import { handleUniquenessError } from '../shared';
import { organisatieStore } from './organisatie.store';

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
  private totalCount = 0;

  @state()
  private loading = false;

  @state()
  private errorMessage: string | undefined;

  override connectedCallback(): void {
    super.connectedCallback();
    this.subscription.add(
      organisatieStore.currentPageItem$.subscribe((orgs) => {
        this.organisaties = orgs;
      }),
    );
    this.subscription.add(
      organisatieStore.totalCount$.subscribe(
        (total) => (this.totalCount = total),
      ),
    );
    this.subscription.add(
      organisatieStore.focussedItem$.subscribe(
        (org) => (this.organisatieToEdit = org),
      ),
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

  override render() {
    switch (this.path[0]) {
      case 'list':
        return html`
          <div class="row">
            <h2 class="col">Organisaties (${this.totalCount})</h2>
          </div>
          ${this.organisaties
            ? html`
                <rock-link href="/organisaties/new" btn btnSuccess
                  ><rock-icon icon="journalPlus" size="md"></rock-icon>
                  Organisatie</rock-link
                >
                <rock-link btn btnOutlineSecondary href="../zoeken"
                  ><rock-icon icon="search"></rock-icon> Geavanceerd
                  zoeken</rock-link
                >
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
      case 'zoeken':
        return html`<rock-advanced-search-organisaties></rock-advanced-search-organisaties>`;
      default:
        router.navigate(`/organisaties/list`);
    }
  }
}

function newOrganisatie(): DeepPartial<Organisatie> {
  return { contacten: [] };
}
