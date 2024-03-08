import { Aanmelding, PatchableAanmelding, Project } from '@rock-solid/shared';
import { LitElement, PropertyValues, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { FormControl, InputType } from '../forms';
import { fullNameWithAge } from '../personen/persoon.pipe';
import { printProject } from './project.pipes';
import { bootstrap } from '../../styles';
import { privilege } from '../auth/privilege.directive';

@customElement('rock-project-rekeninguittreksels')
export class ProjectRekeninguittrekselsComponent extends LitElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  public project!: Project;

  @property({ attribute: false, type: Array })
  public aanmeldingen!: Aanmelding[];

  @state()
  private patchableAanmeldingen: PatchableAanmelding[] = [];

  override update(props: PropertyValues<ProjectRekeninguittrekselsComponent>) {
    if (props.has('aanmeldingen')) {
      this.patchableAanmeldingen = this.aanmeldingen.map((aanmelding) => ({
        id: aanmelding.id,
        rekeninguittrekselNummer: aanmelding.rekeninguittrekselNummer,
        deelnemer: aanmelding.deelnemer,
      }));
    }
    super.update(props);
  }

  async submit(e: SubmitEvent) {
    e.preventDefault();
    const event = new CustomEvent('rekeninguittreksels-updated', {
      bubbles: true,
      composed: true,
      detail: this.patchableAanmeldingen,
    });
    this.dispatchEvent(event);
  }

  override render() {
    return html`<h2>
        Rekeninguittreksels voor bevestigde inschrijvingen van
        ${printProject(this.project)}
      </h2>
      <form @submit=${this.submit}>
        ${this.patchableAanmeldingen.map(
          (aanmelding, index) =>
            html` <rock-reactive-form-control
              .entity=${aanmelding}
              .control=${rekeninguittrekselNummerControlFor(aanmelding, index)}
            ></rock-reactive-form-control>`,
        )}
        <button
          ${privilege('update:aanmeldingen')}
          class="btn btn-primary offset-sm-2"
          type="submit"
        >
          Opslaan
        </button>
      </form>`;
  }
}

function rekeninguittrekselNummerControlFor(
  { deelnemer }: PatchableAanmelding,
  index: number,
): FormControl<PatchableAanmelding> {
  return {
    id: `reknr_${index}`,
    name: 'rekeninguittrekselNummer',
    label: deelnemer ? fullNameWithAge(deelnemer) : 'Deelnemer is verwijderd',
    type: InputType.text,
    nullable: true,
  };
}
