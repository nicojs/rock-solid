import {
  Persoon,
  PersoonType,
  Deelnemer,
  deelnemerLabels,
  OverigPersoon,
  overigPersoonSelecties,
  geslachten,
  werksituaties,
  overigPersoonLabels,
  foldersoorten,
  PersoonFilter,
} from '@rock-solid/shared';
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import {
  checkboxesItemsControl,
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

  private filter: PersoonFilter = {
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
