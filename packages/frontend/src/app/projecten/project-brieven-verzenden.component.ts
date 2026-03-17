import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { type Project, type Aanmelding, showDatum } from '@rock-solid/shared';
import { privilege } from '../auth/privilege.directive';
import { deelnemerVerwijderd, printProject } from './project.pipes';
import { FormControl, InputType } from '../forms';
import { fullNameWithAge } from '../personen/persoon.pipe';
import { capitalize } from '../shared';

@customElement('rock-project-brieven-verzenden')
export class ProjectBrievenVerzendenComponent extends LitElement {
  static override styles = [
    bootstrap,
    css`
      td {
        line-height: 0.25;
      }
    `,
  ];

  @property({ attribute: false })
  public project!: Project;

  @property({ attribute: false, type: Array })
  public aanmeldingen!: Aanmelding[];

  async submit(e: SubmitEvent) {
    e.preventDefault();
    const event = new CustomEvent('brieven-verzonden', {
      bubbles: true,
      composed: true,
      detail: this.aanmeldingen,
    });
    this.dispatchEvent(event);
  }

  private autoFill(type: 'bevestiging' | 'vervoer') {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (const aanmelding of this.aanmeldingen) {
      if (!aanmelding[`${type}sbriefVerzondenOp`]) {
        aanmelding[`${type}sbriefVerzondenOp`] = today;
      }
    }
    this.requestUpdate();
  }

  override render() {
    return html`<h2 class="mb-4">
        Brieven verzenden voor ${printProject(this.project)}
      </h2>
      <form @submit=${(e: SubmitEvent) => this.submit(e)}>
        <table class="table table-sm">
          <thead>
            <tr>
              <th style="width: 300px;"></th>
              <th style="width: 200px;">Ingeschreven op</th>
              <th>Bevestigingsbrief</th>
              <th>Vervoersbrief</th>
            </tr>
          </thead>
          <tbody>
            ${this.aanmeldingen.map(
              (aanmelding) =>
                html` <tr>
                  <th class="align-middle">
                    ${aanmelding.deelnemer
                      ? fullNameWithAge(aanmelding.deelnemer)
                      : deelnemerVerwijderd}
                  </th>
                  <td class="align-middle">
                    ${showDatum(aanmelding.tijdstipVanAanmelden)}
                  </td>
                  <td>
                    <rock-reactive-form-input-control
                      .entity=${aanmelding}
                      .control=${briefControlFor('bevestiging')}
                    ></rock-reactive-form-input-control>
                  </td>
                  <td>
                    <rock-reactive-form-input-control
                      .entity=${aanmelding}
                      .control=${briefControlFor('vervoer')}
                    ></rock-reactive-form-input-control>
                  </td>
                </tr>`,
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2"></td>
              <td>
                <button
                  @click=${() => this.autoFill('bevestiging')}
                  class="btn btn-outline-secondary"
                  type="button"
                >
                  Bevestigingsbrieven automatisch invullen
                </button>
              </td>
              <td>
                <button
                  @click=${() => this.autoFill('vervoer')}
                  class="btn btn-outline-secondary"
                  type="button"
                >
                  Vervoersbrieven automatisch invullen
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
        <button
          ${privilege('update:aanmeldingen')}
          class="btn btn-primary offset-sm-3"
          type="submit"
        >
          Opslaan
        </button>
      </form>`;
  }
}

function briefControlFor(
  name: 'bevestiging' | 'vervoer',
): FormControl<Aanmelding> {
  return {
    name: `${name}sbriefVerzondenOp`,
    label: `${capitalize(name)}sbrief`,
    type: InputType.date,
  };
}
