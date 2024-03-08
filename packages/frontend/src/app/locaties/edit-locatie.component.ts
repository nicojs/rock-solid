import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import {
  Locatie,
  Privilege,
  UpsertableLocatie,
  locatieLabels,
} from '@rock-solid/shared';
import { showLocatie } from './locatie.pipe';
import { FormControl, InputType, adresControls, formGroup } from '../forms';

@customElement('rock-edit-locatie')
export class EditLocatieComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  public locatie!: UpsertableLocatie;

  @property()
  public errorMessage?: string;

  @property()
  public privilege?: Privilege;

  public override render() {
    return html`<h2>
        ${this.locatie.id
          ? `${showLocatie(this.locatie)} wijzigen`
          : `Locatie toevoegen`}
      </h2>
      <rock-alert .message=${this.errorMessage}></rock-alert>

      <rock-reactive-form
        @rock-submit="${this.save}"
        privilege="${this.privilege}"
        .controls=${locatieControls}
        .entity="${this.locatie}"
      ></rock-reactive-form>`;
  }

  private async save() {
    const event = new CustomEvent('locatie-submitted', {
      bubbles: true,
      composed: true,
      detail: this.locatie,
    });
    this.dispatchEvent(event);
  }
}

const locatieControls: FormControl<Locatie>[] = [
  {
    name: 'naam',
    label: locatieLabels.naam,
    type: InputType.text,
    validators: { required: true },
  },
  {
    name: 'opmerking',
    label: locatieLabels.opmerking,
    type: InputType.text,
  },
  formGroup('adres', adresControls, {
    required: false,
    requiredLabel: 'Met adres',
  }),
];
