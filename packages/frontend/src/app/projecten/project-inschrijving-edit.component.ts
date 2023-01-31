import { Inschrijving, Project } from '@rock-solid/shared';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { InputControl, InputType } from '../forms';
import { fullName } from '../personen/full-name.pipe';
import { printProject } from './project.pipes';

@customElement('rock-project-inschrijving-edit')
export class ProjectInschrijvingEditComponent extends LitElement {
  static override styles = [bootstrap];

  @property()
  public project!: Project;

  @property()
  public inschrijving!: Inschrijving;

  public override render() {
    return html`<h2>
        Inschrijving van ${fullName(this.inschrijving.deelnemer!)} voor
        ${printProject(this.project)}
      </h2>
      <rock-reactive-form
        @rock-submit="${this.save}"
        .controls="${inschrijvingControls}"
        .entity="${this.inschrijving}"
      ></rock-reactive-form>`;
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
  {
    name: 'rekeninguittrekselNummer',
    label: 'Rekeninguittreksel nummer',
    type: InputType.text,
  },
];
