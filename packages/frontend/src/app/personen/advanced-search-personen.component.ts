import {
  Persoon,
  PersoonType,
  PersoonDetailsFilter,
  Deelnemer,
  deelnemerLabels,
  OverigPersoon,
  overigPersoonSelecties,
  geslachten,
  werksituaties,
  overigPersoonLabels,
  foldersoorten,
} from '@rock-solid/shared';
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import {
  checkboxesControl,
  FormControl,
  InputType,
  selectControl,
} from '../forms';
import {
  downloadCsv,
  pluralize,
  toDeelnemersCsv,
  toOverigePersonenCsv,
} from '../shared';
import { persoonService } from './persoon.service';

@customElement('rock-advanced-search-personen')
export class AdvancedSearchPersonenComponent extends LitElement {
  public static override styles = [bootstrap];

  private filter: PersoonDetailsFilter = {
    searchType: 'persoon',
    type: 'deelnemer',
  };

  @state()
  private personen?: Persoon[];

  @state()
  private isLoading = false;

  @property()
  public type: PersoonType = 'deelnemer';

  private downloadCsv(): void {
    if (this.personen) {
      if (this.type === 'deelnemer') {
        downloadCsv(
          toDeelnemersCsv(this.personen as Deelnemer[]),
          pluralize(this.type),
        );
      } else {
        downloadCsv(
          toOverigePersonenCsv(this.personen as OverigPersoon[]),
          pluralize(this.type),
        );
      }
    }
    return undefined;
  }

  override updated(values: PropertyValues<AdvancedSearchPersonenComponent>) {
    if (values.has('type')) {
      this.filter.type = this.type;
    }
  }

  private search() {
    this.isLoading = true;
    persoonService.getAll(this.filter).then((personen) => {
      this.isLoading = false;
      this.personen = personen;
    });
  }

  override render() {
    return html`<rock-reactive-form
        .controls=${this.type === 'deelnemer'
          ? deelnemerSearchControls
          : overigPersoonSearchControls}
        .entity=${this.filter}
        submitLabel="Zoeken"
        @rock-submit=${this.search}
      ></rock-reactive-form>
      ${this.isLoading
        ? html`<rock-loading></rock-loading>`
        : this.personen
          ? html` <button
                type="button"
                class="btn btn-outline-secondary"
                @click=${() => this.downloadCsv()}
              >
                <rock-icon icon="download"></rock-icon> Export
                (${this.personen.length})
              </button>
              <rock-personen-list
                .type=${this.type}
                .personen=${this.personen}
              ></rock-personen-list>`
          : ''}`;
  }
}

const overigPersoonSearchControls: FormControl<PersoonDetailsFilter>[] = [
  checkboxesControl('selectie', false, overigPersoonSelecties, {
    label: overigPersoonLabels.selectie,
  }),
  checkboxesControl('foldersoorten', false, foldersoorten, {
    label: 'Folders',
  }),
];

const deelnemerSearchControls: FormControl<PersoonDetailsFilter>[] = [
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
  checkboxesControl('foldersoorten', false, foldersoorten, {
    label: 'Folders',
  }),
];
