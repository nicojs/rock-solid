import { Aanmelding, PatchableAanmelding, Project } from '@rock-solid/shared';
import { LitElement, PropertyValues, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { FormControl, InputType } from '../../forms';
import { fullNameWithAge } from '../persoon.pipe';
import { printProject } from './project.pipes';
import { bootstrap } from '../../../styles';
import { privilege } from '../../auth/privilege.directive';

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
        rekeninguittrekselNummerVoorschot:
          aanmelding.rekeninguittrekselNummerVoorschot,
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
      <form @submit=${(e: SubmitEvent) => this.submit(e)}>
        ${this.patchableAanmeldingen.map(
          (aanmelding, index) =>
            html`${this.project.voorschot
                ? html`<rock-reactive-form-control
                    .entity=${aanmelding}
                    .control=${rekeninguittrekselNummerControlFor(
                      aanmelding,
                      index,
                      'voorschot',
                    )}
                  ></rock-reactive-form-control>`
                : nothing}
              <rock-reactive-form-control
                .entity=${aanmelding}
                .control=${rekeninguittrekselNummerControlFor(
                  aanmelding,
                  index,
                )}
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
  voorschot: 'voorschot' | false = false,
): FormControl<PatchableAanmelding> {
  return {
    id: `reknr_${index}_${voorschot ? 'voorschot' : 'normaal'}`,
    name: voorschot
      ? 'rekeninguittrekselNummerVoorschot'
      : 'rekeninguittrekselNummer',
    label: deelnemer
      ? `${fullNameWithAge(deelnemer)}${voorschot ? ' (voorschot)' : ''}`
      : 'Deelnemer is verwijderd',
    type: InputType.text,
    nullable: true,
  };
}
