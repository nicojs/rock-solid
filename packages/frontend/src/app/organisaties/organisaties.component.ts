import { Organisatie, UpsertableOrganisatie } from '@kei-crm/shared';
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { router } from '../router';
import { organisatieService } from './organistatie.service';

@customElement('kei-organisaties')
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

  override updated(props: PropertyValues<OrganisatiesComponent>): void {
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
            ? html`<kei-organisaties-list
                  .organisaties=${this.organisaties}
                ></kei-organisaties-list>
                <kei-paging
                  @navigate-page=${(event: CustomEvent<number>) =>
                    this.navigatePage(event.detail)}
                  .currentPage=${this.page}
                  .totalCount=${this.totalCount}
                ></kei-paging>
                <kei-link href="/organisaties/new" btn btnSuccess
                  ><kei-icon icon="journalPlus" size="md"></kei-icon>
                  Organisatie</kei-link
                >
                <kei-link btn btnOutlineSecondary href="../zoeken"
                  ><kei-icon icon="search"></kei-icon> Geavanceerd
                  zoeken</kei-link
                >`
            : html`<kei-loading></kei-loading>`}
        `;
      case 'new':
        const organisatie: UpsertableOrganisatie = {
          naam: '',
          doelgroep: 'deKei',
          folderVoorkeur: [],
        };
        return this.loading
          ? html`<kei-loading></kei-loading>`
          : html`<kei-edit-organisatie
              .organisatie="${organisatie}"
              @organisatie-submitted="${(event: CustomEvent<Organisatie>) =>
                this.createOrganisatie(event.detail)}"
            ></kei-edit-organisatie>`;
      case 'edit':
        return html`${this.organisatieToEdit
          ? html`<h2>${this.organisatieToEdit.naam} wijzigen</h2>
              <kei-edit-organisatie
                .organisatie="${this.organisatieToEdit}"
                @organisatie-submitted=${this.updateOrganisatie}
              ></kei-edit-organisatie>`
          : html`<kei-loading></kei-loading>`}`;
      case 'zoeken':
        return html`<kei-advanced-search-organisaties></kei-advanced-search-organisaties>`;
      default:
        router.navigate(`/organisaties/list`);
    }
  }
}
