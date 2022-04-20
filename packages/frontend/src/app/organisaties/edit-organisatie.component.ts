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
import { bootstrap } from '../../styles';
import {
  adresControls,
  formGroup,
  FormControl,
  InputType,
  patterns,
  selectControl,
  groupedSelectControl,
} from '../forms';
import { printOrganisatie } from './organisatie.pipes';

@customElement('rock-edit-organisatie')
export class EditOrganisatieComponent extends LitElement {
  static override styles = [bootstrap];

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
  selectControl('doelgroep', doelgroepen, {
    validators: { required: true },
  }),
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
  selectControl('folderVoorkeur', folderSelecties, {
    label: 'Folder voorkeur',
    multiple: true,
  }),
  groupedSelectControl('soorten', groupedOrganisatieSoorten, {
    label: organisatieColumnNames.soorten,
    multiple: true,
  }),
];
