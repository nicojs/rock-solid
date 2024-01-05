import { html, LitElement } from 'lit';
import {
  geslachten,
  UpsertablePersoon,
  Deelnemer,
  woonsituaties,
  werksituaties,
  BasePersoon,
  OverigPersoon,
  overigPersoonSelecties,
  voedingswensen,
  Privilege,
  persoonLabels,
  Contactpersoon,
  deelnemerLabels,
  fotoToestemmingLabels,
  PersoonType,
  PersoonByType,
} from '@rock-solid/shared';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import {
  FormControl,
  InputType,
  formGroup,
  adresControls,
  formArray,
  foldervoorkeurControls,
  checkboxesItemsControl,
  radioControl,
  checkboxesPropsControl,
  InputControl,
} from '../forms';

@customElement('rock-edit-persoon')
export class EditPersoonComponent extends LitElement {
  @property({ attribute: false })
  private persoon!: UpsertablePersoon;

  static override styles = [bootstrap];

  private async submit() {
    const event = new CustomEvent('persoon-submitted', {
      bubbles: true,
      composed: true,
      detail: this.persoon,
    });
    this.dispatchEvent(event);
  }

  override render() {
    return html`<rock-reactive-form
      @rock-submit="${this.submit}"
      privilege="${'write:personen' satisfies Privilege}"
      .controls="${controlsByType[this.persoon.type]}"
      .entity="${this.persoon}"
    ></rock-reactive-form>`;
  }
}

const controlsByType: { [K in PersoonType]: FormControl<PersoonByType[K]>[] } =
  {
    deelnemer: controlsFor('deelnemer'),
    overigPersoon: controlsFor('overigPersoon'),
  };

function controlsFor<TType extends PersoonType>(
  type: TType,
): FormControl<TType extends 'deelnemer' ? Deelnemer : OverigPersoon>[] {
  const voedingswensControls: FormControl<BasePersoon>[] = [
    radioControl('voedingswens', voedingswensen, { allowDeselect: true }),
    {
      name: 'voedingswensOpmerking',
      type: InputType.text,
      label: persoonLabels.voedingswensOpmerking,
      validators: {
        custom(value, entity) {
          if (value || entity.voedingswens !== 'anders') {
            return '';
          }
          return `${persoonLabels.voedingswensOpmerking} is wanneer bij ${persoonLabels.voedingswens} "${voedingswensen.anders}" gevuld is.`;
        },
      },
      dependsOn: ['voedingswens'],
    },
  ];

  const controls: FormControl<OverigPersoon & Deelnemer>[] = [];
  if (type === 'overigPersoon') {
    controls.push(checkboxesItemsControl('selectie', overigPersoonSelecties));
  }

  controls.push(
    { name: 'voornaam', type: InputType.text },
    {
      name: 'achternaam',
      label: 'Naam',
      type: InputType.text,
      validators: {
        minLength: 3,
        required: true,
      },
    },
    formGroup('verblijfadres', adresControls, {
      required: false,
      requiredLabel: 'Verblijfadres invullen',
    }),
  );
  if (type === 'deelnemer') {
    controls.push(
      formGroup('domicilieadres', adresControls, {
        required: false,
        requiredLabel: 'Domicilieadres is anders dan het verblijfadres',
      }),
    );
  }
  controls.push(
    {
      name: 'gsmNummer',
      label: 'GSM',
      type: InputType.tel,
    },
    {
      name: 'telefoonnummer',
      type: InputType.tel,
    },
    { name: 'emailadres', type: InputType.email },
    {
      name: 'geboortedatum',
      type: InputType.date,
      validators: {
        min: new Date(1910, 1, 1),
        max: new Date(new Date().getFullYear() - 5, 1, 1),
      },
    },
    radioControl('geslacht', geslachten, { allowDeselect: true }),
    {
      name: 'geslachtOpmerking',
      type: InputType.text,
      label: persoonLabels.geslachtOpmerking,
    },
  );

  if (type === 'deelnemer') {
    controls.push(
      radioControl('werksituatie', werksituaties, { allowDeselect: true }),
      {
        name: 'werksituatieOpmerking',
        label: deelnemerLabels.werksituatieOpmerking,
        type: InputType.text,
      },
      radioControl('woonsituatie', woonsituaties, { allowDeselect: true }),
      {
        name: 'woonsituatieOpmerking',
        label: deelnemerLabels.woonsituatieOpmerking,
        type: InputType.text,
        validators: {
          custom(value, entity) {
            if (value || entity.woonsituatie !== 'anders') {
              return '';
            }
            return `Woonsituatie opmerking is verplicht bij woonsituatie "${woonsituaties.anders}" is`;
          },
        },
        dependsOn: ['woonsituatie'],
      } as FormControl<Deelnemer>,
      {
        name: 'begeleidendeDienst',
        label: deelnemerLabels.begeleidendeDienst,
        type: InputType.text,
      },
      formGroup(
        'contactpersoon',
        [
          {
            name: 'naam',
            type: InputType.text,
          },
          {
            name: 'email',
            type: InputType.email,
          },
          {
            name: 'telefoon',
            type: InputType.tel,
          },
          {
            name: 'gsm',
            label: 'GSM',
            type: InputType.tel,
          },
        ],
        { required: true },
      ),
      ...voedingswensControls,
      checkboxesPropsControl('fotoToestemming', fotoToestemmingLabels, {
        label: deelnemerLabels.fotoToestemming,
      }),
    );
  }
  controls.push(
    ...voedingswensControls,
    formArray('foldervoorkeuren', foldervoorkeurControls),
    {
      name: 'rekeningnummer',
      type: InputType.text,
      placeholder: 'BE12 3456 7890 1234',
      validators: {
        //https://stackoverflow.com/questions/44656264/iban-regex-design
        pattern:
          '^([A-Z]{2}[ -]?[0-9]{2})(?=(?:[ -]?[A-Z0-9]){9,30}$)((?:[ -]?[A-Z0-9]{3,5}){2,7})([ -]?[A-Z0-9]{1,3})?$',
      },
    },
    {
      name: 'rijksregisternummer',
      type: InputType.text,
      placeholder: '90.02.01-999-02',
      validators: {
        // https://nl.wikipedia.org/wiki/Rijksregisternummer
        pattern: '^\\d{2}\\.\\d{2}\\.\\d{2}-\\d{3}-\\d{2}$',
      },
    },
    {
      name: 'opmerking',
      type: InputType.text,
    },
  );

  return controls as FormControl<
    TType extends 'deelnemer' ? Deelnemer : OverigPersoon
  >[];
}
