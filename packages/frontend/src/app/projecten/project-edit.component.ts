import {
  BaseActiviteit,
  BaseProject,
  bedrijfsonderdelen,
  Cursus,
  CursusActiviteit,
  ProjectType,
  UpsertableProject,
  Vakantie,
  VakantieActiviteit,
  vakantieSeizoenen,
  vakantieVerblijven,
  vakantieVervoerOptions,
} from '@rock-solid/shared';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import {
  FormControl,
  formArray,
  InputControl,
  InputType,
  selectControl,
} from '../forms';
import { capitalize } from '../shared';
import { printProject } from './project.pipes';

@customElement('rock-project-edit')
export class ProjectEditComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  public project!: UpsertableProject;

  @property()
  public type: ProjectType = 'cursus';

  public override render() {
    return html`<h2>
        ${this.project.id
          ? `${printProject(this.project)} wijzigen`
          : `${capitalize(this.type)} toevoegen`}
      </h2>
      <rock-reactive-form
        @rock-submit="${this.save}"
        .controls="${this.type === 'cursus'
          ? cursusProjectControls
          : vakantieProjectControls}"
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
    placeholder: `DK/${new Date().getFullYear().toString().slice(-2)}/123`,
    validators: {
      required: true,
      pattern: '^((KJ)|(DK)|(DS))\\/\\d{2}\\/\\d+$',
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

const baseActiviteitenControls: FormControl<BaseActiviteit>[] = [
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
];

const cursusActiviteitenControls: FormControl<CursusActiviteit>[] = [
  ...baseActiviteitenControls,
  {
    name: 'vormingsuren',
    type: InputType.number,
  },
];
const vakantieActiviteitenControls: FormControl<VakantieActiviteit>[] = [
  ...baseActiviteitenControls,
  {
    name: 'begeleidingsuren',
    type: InputType.number,
  },
  selectControl('verblijf', vakantieVerblijven),
  selectControl('vervoer', vakantieVervoerOptions),
];

const cursusProjectControls: FormControl<Cursus>[] = [
  ...baseProjectControls,
  selectControl('organisatieonderdeel', bedrijfsonderdelen, {
    validators: { required: true },
  }),
  {
    name: 'overnachting',
    type: InputType.checkbox,
    label: 'Met overnachting',
  },
  formArray('activiteiten', cursusActiviteitenControls),
];

const vakantieProjectControls: FormControl<Vakantie>[] = [
  ...baseProjectControls,
  { type: InputType.currency, name: 'prijs' },
  { type: InputType.currency, name: 'voorschot' },
  selectControl('seizoen', vakantieSeizoenen),
  formArray('activiteiten', vakantieActiviteitenControls),
];
