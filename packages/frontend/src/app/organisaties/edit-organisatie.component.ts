import {
  Organisatie,
  Privilege,
  UpsertableOrganisatie,
  doelgroepen,
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
  formArray,
  foldervoorkeurControls,
  checkboxesControl,
} from '../forms';
import { printOrganisatie } from './organisatie.pipes';
@customElement('rock-edit-organisatie')
export class EditOrganisatieComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  public organisatie!: UpsertableOrganisatie;

  @property()
  public errorMessage: string | undefined;

  public override render() {
    return html`<h2>
        ${this.organisatie.id
          ? `${printOrganisatie(this.organisatie)} wijzigen`
          : `Organisatie toevoegen`}
      </h2>
      <rock-alert .message=${this.errorMessage}></rock-alert>

      <rock-reactive-form
        @rock-submit="${this.save}"
        privilege="${'write:organisaties' satisfies Privilege}"
        .controls=${organisatieControls}
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
    name: 'naam',
    type: InputType.text,
    validators: { required: true },
  },
  {
    name: 'website',
    type: InputType.url,
    placeholder: 'https://dekei.be',
  },
  checkboxesControl('soorten', true, groupedOrganisatieSoorten),
  formArray(
    'contacten',
    [
      {
        name: 'terAttentieVan',
        type: InputType.text,
        label: 'Ter attentie van',
      },
      {
        name: 'afdeling',
        type: InputType.text,
      },
      selectControl('doelgroepen', doelgroepen, {
        validators: { required: true },
        multiple: true,
      }),
      formArray('foldervoorkeuren', foldervoorkeurControls),
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
      formGroup('adres', adresControls, {
        required: false,
        requiredLabel: 'Met adres',
      }),
    ],
    () => ({ terAttentieVan: '' }),
  ),
];
