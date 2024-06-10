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
  OverigPersoon,
  OverigPersoonSelectie,
  cursusLabels,
  Privilege,
  activiteitLabels,
  doelgroepen,
  cursusCategorieën,
} from '@rock-solid/shared';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import {
  FormControl,
  formArray,
  InputType,
  radioControl,
  tagsControl,
} from '../forms';
import { fullName } from '../personen/persoon.pipe';
import { persoonService } from '../personen/persoon.service';
import { capitalize } from '../shared';
import { printProject } from './project.pipes';
import { locatieService } from '../locaties/locatie.service';
import { showLocatie } from '../locaties/locatie.pipe';

@customElement('rock-project-edit')
export class ProjectEditComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  public project!: UpsertableProject;

  @property()
  public type: ProjectType = 'cursus';

  @property()
  public errorMessage: string | undefined;

  @property()
  public privilege?: Privilege;

  public override render() {
    return html`<h2>
        ${this.project.id
          ? `${printProject(this.project)} wijzigen`
          : `${capitalize(this.type)} toevoegen`}
      </h2>
      <rock-alert .message=${this.errorMessage}></rock-alert>
      <rock-reactive-form
        @rock-submit="${this.save}"
        privilege="${this.privilege}"
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

const baseProjectControls: FormControl<BaseProject>[] = [
  {
    name: 'projectnummer',
    type: InputType.text,
    placeholder: `DK/${new Date().getFullYear().toString().slice(-2)}/123`,
    validators: {
      required: true,
      pattern: '^((KJ)|(DK)|(DS))\\/\\d{2}\\/\\d+$',
    },
  },
  { type: InputType.currency, name: 'saldo' },
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
    validators: {
      required: true,
      custom(value, entity) {
        if (value && value.getTime() < entity.van.getTime()) {
          return `De "${activiteitLabels.totEnMet}" moet na de "${activiteitLabels.van}"-datum liggen.`;
        }
        return '';
      },
    },
    dependsOn: ['van'],
  },
  {
    name: 'vormingsuren',
    type: InputType.number,
  },
  {
    name: 'begeleidingsuren',
    type: InputType.number,
  },
];

const cursusActiviteitenControls: FormControl<CursusActiviteit>[] = [
  ...baseActiviteitenControls,
  {
    name: 'locatie',
    type: InputType.autocomplete,
    label: 'Locatie',
    searchAction: (text) => locatieService.getAll({ naam: text }),
    labelFor: showLocatie,
  },
];
const vakantieActiviteitenControls: FormControl<VakantieActiviteit>[] = [
  ...baseActiviteitenControls,
  radioControl('verblijf', vakantieVerblijven, {
    validators: { required: true },
  }),
  radioControl('vervoer', vakantieVervoerOptions, {
    validators: { required: true },
  }),
];

const cursusProjectControls: FormControl<Cursus>[] = [
  {
    name: 'naam',
    type: InputType.text,
    validators: {
      minLength: 3,
      required: true,
    },
  },
  ...baseProjectControls,
  begeleidersTagsControl('personeel'),
  radioControl('organisatieonderdeel', organisatieonderdelen, {
    validators: { required: true },
    label: cursusLabels.organisatieonderdeel,
  }),
  radioControl('doelgroep', doelgroepen, {
    allowDeselect: true,
    validators: {
      custom: (val, cursus) => {
        if (
          cursus.type === 'cursus' &&
          cursus.organisatieonderdeel === 'keiJong'
        ) {
          if (!val) {
            return 'Doelgroep is verplicht voor KEI-JONG';
          }
        } else if (val) {
          return 'Doelgroep is enkel toegestaan voor KEI-JONG';
        }
        return '';
      },
    },
    dependsOn: ['organisatieonderdeel'],
  }),
  radioControl('categorie', cursusCategorieën, {
    validators: { required: true },
  }),
  formArray('activiteiten', cursusActiviteitenControls, newActiviteit),
];

const vakantieProjectControls: FormControl<Vakantie>[] = [
  {
    name: 'bestemming',
    type: InputType.text,
    validators: {
      minLength: 3,
      required: true,
    },
  },
  {
    name: 'land',
    type: InputType.text,
    validators: {
      minLength: 3,
      required: true,
    },
  },
  ...baseProjectControls,
  { type: InputType.currency, name: 'voorschot' },
  begeleidersTagsControl('vakantieVrijwilliger', 2),
  radioControl('seizoen', vakantieSeizoenen, {
    validators: { required: true },
  }),
  formArray('activiteiten', vakantieActiviteitenControls),
];
export function newActiviteit(): DeepPartial<CursusActiviteit> {
  // Default is next weekend
  const van = new Date();
  const totEnMet = new Date();
  const offsetTillNextFriday = (van.getDay() + 5) % 7 || 7;
  van.setDate(van.getDate() + offsetTillNextFriday);
  totEnMet.setDate(van.getDate() + 3);
  van.setHours(19);
  van.setMinutes(30);
  totEnMet.setHours(16);
  totEnMet.setMinutes(0);
  return { van, totEnMet, vormingsuren: 19 };
}

function begeleidersTagsControl(
  overigePersoonSelectie: OverigPersoonSelectie,
  minCharacters = 0,
) {
  return tagsControl<BaseProject, 'begeleiders'>(
    'begeleiders',
    (tag) => fullName(tag),
    async (volledigeNaamLike) => {
      const personen = await persoonService.getAll({
        type: 'overigPersoon',
        selectie: [overigePersoonSelectie],
        volledigeNaamLike,
      });
      return personen.map((persoon) => ({
        text: fullName(persoon),
        value: persoon as OverigPersoon,
      }));
    },
    { minCharacters },
  );
}
