import {
  Activiteit,
  BaseProject,
  bedrijfsonderdelen,
  Cursus,
  UpsertableProject,
} from '@rock-solid/shared';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { FormControl, formArray, InputControl, InputType } from '../forms';
import { printProject } from './project.pipes';

@customElement('rock-project-edit')
export class ProjectEditComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  public project!: UpsertableProject;

  public override render() {
    return html`<h2>
        ${this.project.id
          ? `${printProject(this.project)} wijzigen`
          : `Project toevoegen`}
      </h2>
      <rock-reactive-form
        @rock-submit="${this.save}"
        .controls="${cursusProjectControls}"
        .entity="${this.project}"
      ></rock-reactive-form>`;
  }

  private async save() {
    const event = new CustomEvent('project-submitted', {
      bubbles: true,
      composed: true,
      detail: this.project,
    });
    this.dispatchEvent(event);
  }
}

const baseProjectControls: InputControl<BaseProject>[] = [
  {
    name: 'projectnummer',
    type: InputType.text,
    placeholder: `DK ${new Date().getFullYear().toString().slice(-2)}-123`,
    validators: {
      required: true,
      pattern: '^((KJ)|(DK)) \\d{2}-\\d+$',
    },
  },
  {
    name: 'naam',
    type: InputType.text,
    validators: {
      minLength: 3,
      required: true,
    },
  },
];

const activiteitenControls: InputControl<Activiteit>[] = [
  {
    name: 'van',
    type: InputType.date,
    validators: { required: true },
  },
  {
    name: 'totEnMet',
    label: 'Tot en met',
    type: InputType.date,
    validators: { required: true },
  },
  {
    name: 'vormingsuren',
    type: InputType.number,
  },
];

const cursusProjectControls: FormControl<Cursus>[] = [
  ...baseProjectControls,
  {
    name: 'organisatieonderdeel',
    type: InputType.select,
    items: bedrijfsonderdelen,
    validators: {
      required: true,
    },
    grouped: false,
  },
  {
    name: 'overnachting',
    type: InputType.checkbox,
    label: 'Met overnachting',
  },
  formArray('activiteiten', activiteitenControls),
];
