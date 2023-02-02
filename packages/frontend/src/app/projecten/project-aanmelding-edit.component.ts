import { Aanmelding, aanmeldingsstatussen, Project } from '@rock-solid/shared';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { InputControl, InputType } from '../forms';
import { fullName } from '../personen/full-name.pipe';
import { printProject } from './project.pipes';

@customElement('rock-project-aanmelding-edit')
export class ProjectAanmeldingEditComponent extends LitElement {
  static override styles = [bootstrap];

  @property()
  public project!: Project;

  @property()
  public aanmelding!: Aanmelding;

  public override render() {
    return html`<h2>
        Aanmelding van ${fullName(this.aanmelding.deelnemer!)} voor
        ${printProject(this.project)}
      </h2>
      <rock-reactive-form
        @rock-submit="${this.save}"
        .controls="${aanmeldingControls}"
        .entity="${this.aanmelding}"
      ></rock-reactive-form>`;
  }

  private async save() {
    const event = new CustomEvent('aanmelding-updated', {
      bubbles: true,
      composed: true,
      detail: this.aanmelding,
    });
    this.dispatchEvent(event);
  }
}

const aanmeldingControls: InputControl<Aanmelding>[] = [
  {
    name: 'toestemmingFotos',
    label: "Toestemming voor gebruik van foto's",
    type: InputType.checkbox,
  },
  {
    name: 'status',
    label: 'Status',
    type: InputType.select,
    grouped: false,
    items: aanmeldingsstatussen,
  },
  {
    name: 'rekeninguittrekselNummer',
    label: 'Rekeninguittreksel nummer',
    type: InputType.text,
  },
];
