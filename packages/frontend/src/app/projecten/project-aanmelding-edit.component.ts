import {
  Aanmelding,
  aanmeldingLabels,
  aanmeldingsstatussen,
  geslachten,
  Privilege,
  Project,
  werksituaties,
  woonsituaties,
} from '@rock-solid/shared';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { FormControl, InputType } from '../forms';
import { fullNameOrOnbekend } from '../personen/persoon.pipe';
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
        Aanmelding van ${fullNameOrOnbekend(this.aanmelding.deelnemer)} voor
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
        @rock-submit="${this.save}"
        privilege="${'write:aanmeldingen' satisfies Privilege}"
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

const aanmeldingControls: FormControl<Aanmelding>[] = [
  {
    name: 'status',
    label: aanmeldingLabels.status,
    type: InputType.select,
    grouped: false,
    items: aanmeldingsstatussen,
  },
  {
    name: 'plaats',
    label: aanmeldingLabels.plaats,
    type: InputType.plaats,
  },
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
];
