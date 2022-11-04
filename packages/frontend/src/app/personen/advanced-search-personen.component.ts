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
  BasePersoon,
} from '@rock-solid/shared';
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { InputControl, InputType, selectControl } from '../forms';
import {
  showAdres,
  pluralize,
  toCsvDownloadUrl,
  ValueFactory,
  show,
  foldervoorkeurenCsv,
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

  get csvDataUrl(): string | undefined {
    if (this.personen) {
      const persoonColumns = [
        'voornaam',
        'achternaam',
        'emailadres',
        'geboortedatum',
        'verblijfadres',
        'domicilieadres',
        'geslacht',
        'gsmNummer',
        'telefoonnummer',
        'rekeningnummer',
        'rijksregisternummer',
        'opmerking',
      ] as const;
      const adresValueFactories: ValueFactory<BasePersoon> = {
        verblijfadres: showAdres,
        domicilieadres: showAdres,
      };
      if (this.type === 'deelnemer') {
        return toCsvDownloadUrl<Deelnemer>(
          this.personen as Deelnemer[],
          [
            ...persoonColumns,
            'werksituatie',
            'werksituatieOpmerking',
            'woonsituatie',
            'woonsituatieOpmerking',
          ],
          deelnemerLabels,
          adresValueFactories,
        );
      } else {
        return toCsvDownloadUrl<OverigPersoon>(
          this.personen as OverigPersoon[],
          [...persoonColumns, 'selectie', 'foldervoorkeuren'],
          overigPersoonLabels,
          {
            ...adresValueFactories,
            selectie: show,
            foldervoorkeuren: foldervoorkeurenCsv,
          },
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
        ? html`
        <a href="${
          this.csvDataUrl
        }" class="btn btn-outline-secondary" download="${pluralize(
            this.type,
          )}.csv">
              <rock-icon icon="download"></rock-icon> Export
            </button>
            </a>
        <rock-personen-list
            .type=${this.type}
            .personen=${this.personen}
          ></rock-personen-list>`
        : ''}`;
  }
}

const overigPersoonSearchControls: InputControl<PersoonDetailsFilter>[] = [
  selectControl('selectie', overigPersoonSelecties, {
    label: overigPersoonLabels.selectie,
    multiple: true,
  }),
  selectControl('foldersoorten', foldersoorten, {
    label: 'folders',
    multiple: true,
  }),
];

const deelnemerSearchControls: InputControl<PersoonDetailsFilter>[] = [
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
    label: 'Laatste inschrijving',
    name: 'laatsteInschrijvingJaarGeleden',
    postfix: 'jaar geleden',
  },
];
