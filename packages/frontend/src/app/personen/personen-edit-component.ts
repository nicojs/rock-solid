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
  PersoonType,
} from '@kei-crm/shared';
import { customElement, property } from 'lit/decorators.js';
import { persoonService } from './persoon.service';
import { bootstrap } from '../../styles';
import { InputDescription, InputType } from '../forms';
import { fullName } from './full-name.pipe';
import { router } from '../router';
import { capitalize } from '../shared';

@customElement('kei-personen-edit')
export class PersonenEditComponent extends LitElement {
  @property()
  public entityId?: string;

  @property()
  public type!: PersoonType;

  @property({ attribute: false })
  public isLoading = false;

  @property({ attribute: false })
  private persoon?: UpsertablePersoon;

  static override styles = [bootstrap];

  override connectedCallback() {
    super.connectedCallback();
    if (this.entityId) {
      this.isLoading = true;
      persoonService.get(this.entityId).then((persoon) => {
        this.persoon = persoon;
        this.type = persoon.type;
        this.isLoading = false;
      });
    } else {
      this.persoon = {
        type: this.type,
        achternaam: '',
      };
    }
  }

  override render() {
    return html`${this.isLoading
      ? html`<kei-loading></kei-loading>`
      : this.renderForm()}`;
  }

  private async save() {
    this.isLoading = true;
    if (this.entityId) {
      await persoonService.update(this.entityId, this.persoon!);
    } else {
      await persoonService.create(this.persoon!);
    }
    router.navigate('/personen');
  }

  private renderForm() {
    return html` <h2>
        ${this.entityId
          ? `${capitalize(this.type)} ${fullName(this.persoon!)} wijzigen`
          : `${capitalize(this.type)} toevoegen`}
      </h2>
      <kei-reactive-form
        @kei-submit="${this.save}"
        .controls="${this.type === 'deelnemer'
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
