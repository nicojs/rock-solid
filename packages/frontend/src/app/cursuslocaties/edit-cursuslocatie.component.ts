import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import {
  CursusLocatie,
  Privilege,
  UpsertableCursusLocatie,
  cursusLocatieLabels,
} from '@rock-solid/shared';
import { showCursuslocatie } from './cursuslocatie.pipe';
import { FormControl, InputType, adresControls, formGroup } from '../forms';

@customElement('rock-edit-cursuslocatie')
export class EditOrganisatieComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  public cursuslocatie!: UpsertableCursusLocatie;

  @property()
  public errorMessage?: string;

  public override render() {
    return html`<h2>
        ${this.cursuslocatie.id
          ? `${showCursuslocatie(this.cursuslocatie)} wijzigen`
          : `Cursuslocatie toevoegen`}
      </h2>
      <rock-alert .message=${this.errorMessage}></rock-alert>

      <rock-reactive-form
        @rock-submit="${this.save}"
        privilege="${'write:cursuslocaties' satisfies Privilege}"
        .controls=${cursuslocatieControls}
        .entity="${this.cursuslocatie}"
      ></rock-reactive-form>`;
  }

  private async save() {
    const event = new CustomEvent('cursuslocatie-submitted', {
      bubbles: true,
      composed: true,
      detail: this.cursuslocatie,
    });
    this.dispatchEvent(event);
  }
}

const cursuslocatieControls: FormControl<CursusLocatie>[] = [
  {
    name: 'naam',
    label: cursusLocatieLabels.naam,
    type: InputType.text,
  },
  formGroup('adres', adresControls, {
    required: false,
    requiredLabel: 'Met adres',
  }),
];
