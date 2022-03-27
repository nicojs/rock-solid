import {
  OrganisatieFilter,
  Organisatie,
  organisatieColumnNames,
  folderSelecties,
} from '@kei-crm/shared';
import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { InputControl, InputType } from '../forms';
import { adresName } from '../forms/adres.pipes';
import { toCsvDownloadUrl } from '../shared';
import { organisatieService } from './organistatie.service';

@customElement('kei-advanced-search-organisaties')
export class AdvancedSearchOrganisatiesComponent extends LitElement {
  public static override styles = [bootstrap];

  private filter: OrganisatieFilter = {};

  @state()
  private organisaties?: Organisatie[];

  @state()
  private isLoading = false;

  get csvDataUrl(): string | undefined {
    if (this.organisaties) {
      return toCsvDownloadUrl(
        this.organisaties,
        [
          'naam',
          'terAttentieVan',
          'folderVoorkeur',
          'communicatieVoorkeur',
          'adres',
          'doelgroep',
          'emailadres',
          'telefoonnummer',
          'website',
        ],
        organisatieColumnNames,
        {
          folderVoorkeur(val) {
            return val.map((val) => folderSelecties[val]).join(', ');
          },
          adres: adresName,
        },
      );
    }
    return undefined;
  }

  private search() {
    this.isLoading = true;
    organisatieService.getAll(this.filter).then((organisaties) => {
      this.isLoading = false;
      this.organisaties = organisaties;
    });
  }

  override render() {
    return html`<kei-reactive-form
        .controls=${searchControls}
        .entity=${this.filter}
        submitLabel="Zoeken"
        @kei-submit=${this.search}
      ></kei-reactive-form>
      ${this.isLoading
        ? html`<kei-loading></kei-loading>`
        : this.organisaties
        ? html`<a
              href="${this.csvDataUrl}"
              class="btn btn-outline-secondary"
              download="organisaties.csv"
            >
              <kei-icon icon="download"></kei-icon> Export
            </a>
            <kei-organisaties-list
              .organisaties=${this.organisaties}
            ></kei-organisaties-list>`
        : ''}`;
  }
}
const searchControls: InputControl<OrganisatieFilter>[] = [
  {
    name: 'folderVoorkeur',
    label: 'Folder voorkeur',
    type: InputType.select,
    multiple: true,
    items: folderSelecties,
    grouped: false,
    size: Object.keys(folderSelecties).length,
  },
];
