import {
  folderSelecties,
  Organisatie,
  UpsertableOrganisatie,
  doelgroepen,
  organisatieColumnNames,
  groupedOrganisatieSoorten,
} from '@rock-solid/shared';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
  adresControls,
  formGroup,
  FormControl,
  InputType,
  patterns,
} from '../forms';
import { printOrganisatie } from './organisatie.pipes';

@customElement('rock-edit-organisatie')
export class EditOrganisatieComponent extends LitElement {
  @property({ attribute: false })
  public organisatie!: UpsertableOrganisatie;

  public override render() {
    return html`<h2>
        ${this.organisatie.id
          ? `${printOrganisatie(this.organisatie)} wijzigen`
          : `Project toevoegen`}
      </h2>
      <rock-reactive-form
        @rock-submit="${this.save}"
        .controls="${organisatieControls}"
        .entity="${this.organisatie}"
      ></rock-reactive-form>`;
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

const organisatieControls: FormControl<Organisatie>[] = [
  {
    name: 'doelgroep',
    type: InputType.select,
    items: doelgroepen,
    grouped: false,
    validators: { required: true },
  },
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
  formGroup('adres', adresControls, {
    required: false,
    requiredLabel: 'Met adres',
  }),
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
    grouped: false,
    size: Object.keys(folderSelecties).length,
  },
  {
    name: 'soorten',
    label: organisatieColumnNames.soorten,
    type: InputType.select,
    multiple: true,
    grouped: true,
    items: groupedOrganisatieSoorten,
    size: Object.entries(groupedOrganisatieSoorten).reduce(
      (acc, [, items]) => Object.entries(items).length + 1 + acc,
      0,
    ),
  },
];
