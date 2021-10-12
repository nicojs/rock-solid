import {
  Persoon,
  PersoonType,
  PropertyFilter,
  Vrijwilliger,
  vrijwilligerSelecties,
} from '@kei-crm/shared';
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { InputControl, InputType } from '../forms';
import { fullName } from './full-name.pipe';
import { persoonService } from './persoon.service';

function toCsv(personen: Persoon[]): string {
  let csv = 'Naam,Type,Selectie\n';
  personen.forEach(
    (persoon) =>
      (csv += `${fullName(persoon)},${persoon.type},${
        persoon.type === 'vrijwilliger' ? String(persoon.selectie) : ''
      }`),
  );
  return csv;
}

@customElement('kei-advanced-search-personen')
export class AdvancedSearchPersonenComponent extends LitElement {
  public static override styles = [bootstrap];

  private filter: PropertyFilter = {
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
      return `data:text/csv;base64,${btoa(toCsv(this.personen))}`;
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
    return html`<kei-reactive-form
        .controls=${searchControls}
        .entity=${this.filter}
        submitLabel="Zoeken"
        @kei-submit=${this.search}
      ></kei-reactive-form>
      ${this.isLoading
        ? html`<kei-loading></kei-loading>`
        : this.personen
        ? html`<kei-personen-list
              .type=${this.type}
              .personen=${this.personen}
            ></kei-personen-list>
            <a href="${this.csvDataUrl}" class="btn btn-outline-secondary" download="personen.csv">
              <kei-icon icon="download"></kei-icon> Export
            </button>`
        : ''}`;
  }
}

const searchControls: InputControl<Vrijwilliger>[] = [
  {
    name: 'selectie',
    label: 'Selectie',
    type: InputType.select,
    multiple: true,
    items: vrijwilligerSelecties,
  },
];
