import {
  aanmeldingLabels,
  aanmeldingsstatussen,
  geslachten,
  Privilege,
  Project,
  UpdatableAanmelding,
  werksituaties,
  woonsituaties,
} from '@rock-solid/shared';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { FormControl, InputType, plaatsControl } from '../forms';
import { fullNameOrUnknown } from '../personen/persoon.pipe';
import { printProject } from './project.pipes';

@customElement('rock-project-aanmelding-edit')
export class ProjectAanmeldingEditComponent extends LitElement {
  static override styles = [bootstrap];

  @property()
  public project!: Project;

  @property()
  public aanmelding!: UpdatableAanmelding;

  public override render() {
    return html`<h2>
        Aanmelding van ${fullNameOrUnknown(this.aanmelding.deelnemer)} voor
        ${printProject(this.project)}
      </h2>
      ${this.aanmelding.deelnemer
        ? html`<div class="row mb-3">
            <div class="col-lg-2 col-md-4"></div>
            <div class="col">
              <button
                @click=${() => this.copyDeelnemerFields()}
                class="btn btn-outline-primary"
              >
                <rock-icon icon="clipboardCheck"></rock-icon>
                Kopieer velden deelnemer
              </button>
            </div>
          </div>`
        : nothing}

      <rock-reactive-form
        @rock-submit="${() => this.save()}"
        privilege="${'update:aanmeldingen' satisfies Privilege}"
        .controls=${aanmeldingControls}
        .entity=${this.aanmelding}
      ></rock-reactive-form>`;
  }

  private copyDeelnemerFields() {
    if (this.aanmelding.deelnemer) {
      const { deelnemer } = this.aanmelding;
      this.aanmelding.plaats =
        deelnemer.domicilieadres?.plaats ?? deelnemer.verblijfadres?.plaats;
      this.aanmelding.woonsituatie = deelnemer.woonsituatie;
      this.aanmelding.werksituatie = deelnemer.werksituatie;
      this.aanmelding.geslacht = deelnemer.geslacht;
      this.aanmelding = {
        ...this.aanmelding,
      };
    }
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

const aanmeldingControls: FormControl<UpdatableAanmelding>[] = [
  {
    name: 'status',
    label: aanmeldingLabels.status,
    type: InputType.select,
    grouped: false,
    items: aanmeldingsstatussen,
  },
  plaatsControl('plaats', { label: aanmeldingLabels.plaats }),
  {
    name: 'woonsituatie',
    label: aanmeldingLabels.woonsituatie,
    type: InputType.radio,
    items: woonsituaties,
  },
  {
    name: 'werksituatie',
    label: aanmeldingLabels.werksituatie,
    type: InputType.radio,
    items: werksituaties,
  },
  {
    name: 'geslacht',
    label: aanmeldingLabels.geslacht,
    type: InputType.radio,
    items: geslachten,
    allowDeselect: true,
  },
  {
    name: 'tijdstipVanAanmelden',
    label: aanmeldingLabels.tijdstipVanAanmelden,
    type: InputType.date,
  },
  {
    name: 'bevestigingsbriefVerzondenOp',
    label: aanmeldingLabels.bevestigingsbriefVerzondenOp,
    type: InputType.date,
  },
  {
    name: 'vervoersbriefVerzondenOp',
    label: aanmeldingLabels.vervoersbriefVerzondenOp,
    type: InputType.date,
  },
  {
    name: 'rekeninguittrekselNummer',
    label: 'Rekeninguittreksel nummer',
    type: InputType.text,
  },
  {
    name: 'opmerking',
    label: aanmeldingLabels.opmerking,
    type: InputType.text,
  },
  {
    name: 'overrideDeelnemerFields',
    type: InputType.checkbox,
    label: `Update ook de '${
      'woonsituatie' satisfies keyof UpdatableAanmelding
    }', '${'werksituatie' satisfies keyof UpdatableAanmelding}' en '${
      'geslacht' satisfies keyof UpdatableAanmelding
    }' bij de deelnemer`,
  },
];
