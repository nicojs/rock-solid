import { html, LitElement } from 'lit';
import {
  communicatievoorkeuren,
  geslachten,
  UpsertablePersoon,
  Deelnemer,
  woonsituaties,
  werksituaties,
  BasePersoon,
  Vrijwilliger,
} from '@kei-crm/shared';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { InputDescription, InputType } from '../forms';

@customElement('kei-persoon-edit')
export class PersonenEditComponent extends LitElement {
  @property({ attribute: false })
  private persoon!: UpsertablePersoon;

  static override styles = [bootstrap];

  private async submit() {
    const event = new CustomEvent('persoon-submitted', {
      bubbles: true,
      composed: true,
      detail: this.persoon,
    });
    this.dispatchEvent(event);
  }

  override render() {
    return html`<kei-reactive-form
      @kei-submit="${this.submit}"
      .controls="${this.persoon.type === 'deelnemer'
        ? deelnemerFormControls
        : vrijwilligerFormControls}"
      .entity="${this.persoon}"
    ></kei-reactive-form>`;
  }
}

const basePersoonFormControls: InputDescription<BasePersoon>[] = [
  {
    name: 'achternaam',
    label: 'Naam',
    type: InputType.text,
    validators: {
      minLength: 3,
      required: true,
    },
  },
  { name: 'voornaam', type: InputType.text },
  { name: 'emailadres', type: InputType.email },
  {
    name: 'communicatievoorkeur',
    type: InputType.select,
    items: communicatievoorkeuren,
  },
  {
    name: 'geslacht',
    type: InputType.select,
    items: geslachten,
  },
  {
    name: 'geboortedatum',
    type: InputType.date,
    validators: {
      min: new Date(1910, 1, 1),
      max: new Date(new Date().getFullYear() - 5, 1, 1),
    },
  },
  {
    name: 'gsmNummer',
    label: 'GSM',
    type: InputType.tel,
  },
  {
    name: 'telefoonnummer',
    type: InputType.tel,
  },
  {
    name: 'rekeningnummer',
    type: InputType.text,
    placeholder: 'BE12 3456 7890 1234',
    validators: {
      //https://stackoverflow.com/questions/44656264/iban-regex-design
      pattern:
        '^([A-Z]{2}[ -]?[0-9]{2})(?=(?:[ -]?[A-Z0-9]){9,30}$)((?:[ -]?[A-Z0-9]{3,5}){2,7})([ -]?[A-Z0-9]{1,3})?$',
    },
  },
  {
    name: 'rijksregisternummer',
    type: InputType.text,
    placeholder: '90.02.01-999-02',
    validators: {
      // https://nl.wikipedia.org/wiki/Rijksregisternummer
      pattern: '^\\d{2}\\.\\d{2}\\.\\d{2}-\\d{3}-\\d{2}$',
    },
  },
];

const vrijwilligerFormControls: InputDescription<Vrijwilliger>[] = [
  ...basePersoonFormControls,
  {
    name: 'vrijwilligerOpmerking',
    label: 'Vrijwilliger opmerking',
    type: InputType.text,
  },
  {
    name: 'begeleidtVakanties',
    label: 'Begeleidt vakanties?',
    type: InputType.checkbox,
  },
  {
    name: 'begeleidtCursus',
    label: 'Begeleidt cursussen?',
    type: InputType.checkbox,
  },
];

const deelnemerFormControls: InputDescription<Deelnemer>[] = [
  ...basePersoonFormControls,
  {
    name: 'woonsituatie',
    type: InputType.select,
    items: woonsituaties,
  },
  {
    name: 'woonsituatieOpmerking',
    label: 'Woonsituatie opmerking',
    type: InputType.text,
  },
  {
    name: 'werksituatie',
    type: InputType.select,
    items: werksituaties,
  },
  {
    name: 'werksituatieOpmerking',
    label: 'Werksituatie opmerking',
    type: InputType.text,
  },
];
