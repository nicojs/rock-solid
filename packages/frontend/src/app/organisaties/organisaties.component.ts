import {
  DeepPartial,
  Organisatie,
  UpsertableOrganisatie,
} from '@rock-solid/shared';
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { router } from '../router';
import { organisatieService } from './organistatie.service';

@customElement('rock-organisaties')
export class OrganisatiesComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  public path: string[] = [];

  @state()
  private organisaties: Organisatie[] | undefined;

  @state()
  private organisatieToEdit: Organisatie | undefined;

  @state()
  private page = 0;

  @state()
  private totalCount = 0;

  @state()
  private loading = false;

  override update(props: PropertyValues<OrganisatiesComponent>): void {
    if (props.has('path')) {
      if (this.path[0] === 'list') {
        this.loadOrganisaties();
      }
      if (this.path[0] === 'edit' && this.path[1]) {
        organisatieService.get(this.path[1]).then((org) => {
          this.organisatieToEdit = org;
        });
      }
    }
    super.update(props);
  }

  private loadOrganisaties() {
    this.organisaties = undefined;
    organisatieService.getPage(this.page).then(({ items, totalCount }) => {
      this.organisaties = items;
      this.totalCount = totalCount;
      console.log(this.totalCount, 'total');
    });
  }

  private async createOrganisatie(organisatie: UpsertableOrganisatie) {
    this.loading = true;
    await organisatieService.create(organisatie);
    this.loading = false;
    router.navigate(`../list`);
  }

  private async updateOrganisatie() {
    this.loading = true;
    await organisatieService.update(
      this.organisatieToEdit!.id,
      this.organisatieToEdit!,
    );
    this.loading = false;
    this.loadOrganisaties();
    router.navigate('../../list');
  }

  public navigatePage(page: number) {
    this.page = page;
    this.loadOrganisaties();
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
                  .organisaties=${this.organisaties}
                ></rock-organisaties-list>
                <rock-paging
                  @navigate-page=${(event: CustomEvent<number>) =>
                    this.navigatePage(event.detail)}
                  .currentPage=${this.page}
                  .totalCount=${this.totalCount}
                ></rock-paging>
              `
            : html`<rock-loading></rock-loading>`}
        `;
      case 'new':
        const organisatie: DeepPartial<Organisatie> = {
          folderVoorkeur: [],
          adres: {},
        };
        return this.loading
          ? html`<rock-loading></rock-loading>`
          : html`<rock-edit-organisatie
              .organisatie="${organisatie}"
              @organisatie-submitted="${(event: CustomEvent<Organisatie>) =>
                this.createOrganisatie(event.detail)}"
            ></rock-edit-organisatie>`;
      case 'edit':
        return html`${this.organisatieToEdit
          ? html`<h2>${this.organisatieToEdit.naam} wijzigen</h2>
              <rock-edit-organisatie
                .organisatie="${this.organisatieToEdit}"
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
