import {
  BaseActiviteit,
  BaseProject,
  organisatieonderdelen,
  Cursus,
  CursusActiviteit,
  ProjectType,
  UpsertableProject,
  Vakantie,
  VakantieActiviteit,
  vakantieSeizoenen,
  vakantieVerblijven,
  vakantieVervoerOptions,
  DeepPartial,
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

  @property()
  public errorMessage: string | undefined;

  public override render() {
    return html`<h2>
        ${this.project.id
          ? `${printProject(this.project)} wijzigen`
          : `${capitalize(this.type)} toevoegen`}
      </h2>
      <rock-alert .message=${this.errorMessage}></rock-alert>
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

const HALF_HOUR_SECONDS = 60 * 30;
const baseActiviteitenControls: FormControl<BaseActiviteit>[] = [
  {
    name: 'van',
    type: InputType.dateTimeLocal,
    step: HALF_HOUR_SECONDS,
    validators: { required: true },
  },
  {
    name: 'totEnMet',
    label: 'Tot en met',
    step: HALF_HOUR_SECONDS,
    type: InputType.dateTimeLocal,
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
  selectControl('organisatieonderdeel', organisatieonderdelen, {
    validators: { required: true },
  }),
  formArray('activiteiten', cursusActiviteitenControls, newActiviteit),
];

const vakantieProjectControls: FormControl<Vakantie>[] = [
  ...baseProjectControls,
  { type: InputType.currency, name: 'prijs' },
  { type: InputType.currency, name: 'voorschot' },
  selectControl('seizoen', vakantieSeizoenen),
  formArray('activiteiten', vakantieActiviteitenControls),
];
export function newActiviteit(): DeepPartial<CursusActiviteit> {
  // Default is next weekend
  const van = new Date();
  const totEnMet = new Date();
  const offsetTillNextFriday = (van.getDay() + 5) % 7 || 7;
  van.setDate(van.getDate() + offsetTillNextFriday);
  totEnMet.setDate(van.getDate() + 3);
  van.setHours(20);
  van.setMinutes(0);
  totEnMet.setHours(16);
  totEnMet.setMinutes(0);
  return { van, totEnMet, vormingsuren: 19 };
}
