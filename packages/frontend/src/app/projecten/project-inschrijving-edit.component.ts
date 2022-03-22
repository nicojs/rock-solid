import { Inschrijving, Project } from '@kei-crm/shared';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { InputControl, InputType } from '../forms';
import { fullName } from '../personen/full-name.pipe';

@customElement('kei-project-inschrijving-edit')
export class ProjectInschrijvingEditComponent extends LitElement {
  static override styles = [bootstrap];

  @property()
  public project!: Project;

  @property()
  public inschrijving!: Inschrijving;

  public override render() {
    return html`<h2>
        Inschrijving van ${fullName(this.inschrijving.deelnemer!)} voor
        ${this.project.id}
      </h2>
      <kei-reactive-form
        @kei-submit="${this.save}"
        .controls="${inschrijvingControls}"
        .entity="${this.inschrijving}"
      ></kei-reactive-form>`;
  }

  private async save() {
    const event = new CustomEvent('inschrijving-updated', {
      bubbles: true,
      composed: true,
      detail: this.inschrijving,
    });
    this.dispatchEvent(event);
  }
}

const inschrijvingControls: InputControl<Inschrijving>[] = [
  {
    name: 'toestemmingFotos',
    label: 'Toestemming voor gebruik van fotos',
    type: InputType.checkbox,
  },
  {
    name: 'wachtlijst',
    label: 'Staat op de wachtlijst?',
    type: InputType.checkbox,
  },
];
