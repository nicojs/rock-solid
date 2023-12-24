import { Aanmelding, Project } from '@rock-solid/shared';
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
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

  async submit(e: SubmitEvent) {
    e.preventDefault();
    const event = new CustomEvent('rekeninguittreksels-updated', {
      bubbles: true,
      composed: true,
      detail: this.aanmeldingen,
    });
    this.dispatchEvent(event);
  }

  override render() {
    return html` <h2>
        Rekeninguittreksels voor bevestigde inschrijvingen van
        ${printProject(this.project)}
      </h2>
      <form @submit=${this.submit}>
        ${this.aanmeldingen.map(
          (aanmelding) =>
            html` <rock-reactive-form-control
              .entity=${aanmelding}
              .control=${rekeninguittrekselNummerControlFor(aanmelding)}
            ></rock-reactive-form-control>`,
        )}
        <button
          ${privilege('write:aanmeldingen')}
          class="btn btn-primary offset-sm-2"
          type="submit"
        >
          Opslaan
        </button>
      </form>`;
  }
}

function rekeninguittrekselNummerControlFor({
  deelnemer,
}: Aanmelding): FormControl<Aanmelding> {
  return {
    name: 'rekeninguittrekselNummer',
    label: fullNameWithAge(deelnemer!),
    type: InputType.text,
  };
}
