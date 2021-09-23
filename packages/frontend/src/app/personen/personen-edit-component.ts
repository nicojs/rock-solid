import { html, LitElement } from 'lit';
import { Persoon, UpsertablePersoon } from '@kei-crm/shared';
import { customElement, property } from 'lit/decorators.js';
import { persoonService } from './persoon.service';
import { bootstrap } from '../../styles';
import { InputDescription, InputType } from '../forms';
import { fullName } from './full-name.pipe';

const persoonControls: InputDescription<Persoon>[] = [
  {
    name: 'achternaam',
    label: 'Naam',
    type: InputType.text,
    validators: {
      minLength: 3,
      required: true,
    },
  },
  { name: 'voornaam', label: 'Voornaam', type: InputType.text },
  { name: 'emailadres', label: 'Emailadres', type: InputType.email },
];

@customElement('kei-personen-edit')
export class PersonenEditComponent extends LitElement {
  @property()
  public entityId?: string;

  @property({ attribute: false })
  public isLoading = false;

  @property({ attribute: false })
  private persoon: UpsertablePersoon = {
    achternaam: '',
  };

  static override styles = [bootstrap];

  override connectedCallback() {
    super.connectedCallback();

    if (this.entityId) {
      this.isLoading = true;
      persoonService.get(this.entityId).then((p) => {
        this.persoon = p;
        this.isLoading = false;
      });
    }
  }

  override render() {
    return html`${this.isLoading
      ? html`<kei-loading></kei-loading>`
      : this.renderForm()}`;
  }

  private save() {
    console.log('submit', this.persoon);
  }

  renderForm() {
    return html` <h2>
        ${this.entityId
          ? `${fullName(this.persoon)} wijzigen`
          : 'Persoon toevoegen'}
      </h2>
      <kei-reactive-form
        @kei-submit="${this.save}"
        .controls="${persoonControls}"
        .entity="${this.persoon}"
      ></kei-reactive-form>`;
  }
}
