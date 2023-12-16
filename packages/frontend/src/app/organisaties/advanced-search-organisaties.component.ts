import {
  OrganisatieFilter,
  Organisatie,
  foldersoorten,
} from '@rock-solid/shared';
import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { checkboxesControl, FormControl } from '../forms';
import { downloadCsv, toOrganisatiesCsv } from '../shared';
import { organisatieService } from './organisatie.service';

@customElement('rock-advanced-search-organisaties')
export class AdvancedSearchOrganisatiesComponent extends LitElement {
  public static override styles = [bootstrap];

  private filter: OrganisatieFilter = {};

  @state()
  private organisaties?: Organisatie[];

  @state()
  private isLoading = false;

  private download(): void {
    if (this.organisaties) {
      downloadCsv(toOrganisatiesCsv(this.organisaties), 'organisaties');
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
    return html`<rock-reactive-form
        .controls=${searchControls}
        .entity=${this.filter}
        submitLabel="Zoeken"
        @rock-submit=${this.search}
      ></rock-reactive-form>
      ${this.isLoading
        ? html`<rock-loading></rock-loading>`
        : this.organisaties
          ? html`<button
                @click=${() => this.download()}
                class="btn btn-outline-secondary"
              >
                <rock-icon icon="download"></rock-icon> Export
              </button>
              <rock-organisaties-list
                .organisaties=${this.organisaties}
              ></rock-organisaties-list>`
          : ''}`;
  }
}
const searchControls: FormControl<OrganisatieFilter>[] = [
  checkboxesControl('folders', false, foldersoorten, { label: 'Folders' }),
];
