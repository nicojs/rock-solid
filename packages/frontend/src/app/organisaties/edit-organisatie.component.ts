import {
  folderSelecties,
  Organisatie,
  UpsertableOrganisatie,
} from '@kei-crm/shared';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { InputControl, InputType, patterns } from '../forms';
import { printOrganisatie } from './organisatie.pipes';

@customElement('kei-edit-organisatie')
export class EditOrganisatieComponent extends LitElement {
  @property({ attribute: false })
  public organisatie!: UpsertableOrganisatie;

  public override render() {
    return html`<h2>
        ${this.organisatie.id
          ? `${printOrganisatie(this.organisatie)} wijzigen`
          : `Project toevoegen`}
      </h2>
      <kei-reactive-form
        @kei-submit="${this.save}"
        .controls="${organisatieControls}"
        .entity="${this.organisatie}"
      ></kei-reactive-form>`;
  }

  private async save() {
    const event = new CustomEvent('organisatie-submitted', {
      bubbles: true,
      composed: true,
      detail: this.organisatie,
    });
    this.dispatchEvent(event);
  }
}

const organisatieControls: InputControl<Organisatie>[] = [
  {
    name: 'naam',
    type: InputType.text,
    validators: { required: true },
  },
  {
    name: 'terAttentieVan',
    type: InputType.text,
    label: 'Ter attentie van',
  },
  {
    name: 'emailadres',
    type: InputType.email,
    validators: { pattern: patterns.email },
  },
  {
    name: 'telefoonnummer',
    type: InputType.tel,
    validators: { pattern: patterns.tel },
  },
  {
    name: 'website',
    type: InputType.url,
    placeholder: 'https://dekei.be',
  },
  {
    name: 'folderVoorkeur',
    label: 'Folder voorkeur',
    multiple: true,
    type: InputType.select,
    items: folderSelecties,
  },
];
