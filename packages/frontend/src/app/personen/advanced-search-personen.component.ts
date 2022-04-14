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
} from '@rock-solid/shared';
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { InputControl, InputType } from '../forms';
import { pluralize, toCsvDownloadUrl } from '../shared';
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
        'geslacht',
        'gsmNummer',
        'telefoonnummer',
        'rekeningnummer',
        'rijksregisternummer',
      ] as const;
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
          {},
        );
      } else {
        return toCsvDownloadUrl<OverigPersoon>(
          this.personen as OverigPersoon[],
          [...persoonColumns, 'selectie', 'vrijwilligerOpmerking'],
          overigPersoonLabels,
          {},
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

const overigPersoonSearchControls: InputControl<OverigPersoon>[] = [
  {
    name: 'selectie',
    label: overigPersoonLabels.selectie,
    type: InputType.select,
    multiple: true,
    items: overigPersoonSelecties,
    grouped: false,
    size: Object.keys(overigPersoonSelecties).length,
  },
];

const deelnemerSearchControls: InputControl<Deelnemer>[] = [
  {
    name: 'geslacht',
    label: deelnemerLabels.geslacht,
    type: InputType.select,
    items: geslachten,
    grouped: false,
    placeholder: 'Geen filter',
  },
  {
    name: 'werksituatie',
    label: deelnemerLabels.werksituatie,
    type: InputType.select,
    items: werksituaties,
    grouped: false,
    placeholder: 'Geen filter',
  },
];
