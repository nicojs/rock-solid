import { Inschrijving, Project } from '@kei-crm/shared';
import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { projectService } from './project.service';
import { persoonService } from '../personen/persoon.service';
import { fullName } from '../personen/full-name.pipe';
import { showBoolean, showDatum } from '../shared';
import { TypeAheadHint } from '../shared/autocomplete.component';

@customElement('kei-project-inschrijvingen')
export class ProjectInschrijvingenComponent extends LitElement {
  static override styles = [
    bootstrap,
    css`
      .dropdown-menu {
        top: 60px;
        width: 300px;
        left: 12px;
      }
    `,
  ];

  @property({ attribute: false })
  public project!: Project;

  @state()
  private inschrijvingen: Inschrijving[] | undefined;

  public override updated(
    props: PropertyValues<ProjectInschrijvingenComponent>,
  ) {
    if (props.has('project')) {
      this.inschrijvingen = undefined;
      projectService
        .getInschrijvingen(this.project.id)
        .then((inschrijvingen) => {
          this.inschrijvingen = inschrijvingen;
        });
    }
  }

  override render() {
    return html`<h2>
        Inschrijvingen voor ${this.project.type} ${this.project.naam}
      </h2>
      ${this.renderCreateInschrijvingForm()}
      ${this.inschrijvingen
        ? this.renderInschrijvingenTable()
        : html`<kei-loading></kei-loading>`}`;
  }

  private renderInschrijvingenTable() {
    return html`${this.inschrijvingen?.length
      ? html`<table class="table table-hover">
          <thead>
            <tr>
              <th>Naam</th>
              <th>Ingeschreven op</th>
              <th>Wachtlijst?</th>
            </tr>
          </thead>
          <tbody>
            ${this.inschrijvingen.map(
              (inschrijving) => html`<tr>
                <td>${fullName(inschrijving.persoon!)}</td>
                <td>${showDatum(inschrijving.tijdstipVanInschrijven)}</td>
                <td>${showBoolean(inschrijving.wachtlijst)}</td>
              </tr>`,
            )}
          </tbody>
        </table>`
      : html`<div class="mb-3">Nog geen inschrijvingen 🤷‍♂️</div>`}`;
  }

  private renderCreateInschrijvingForm() {
    return html`<kei-autocomplete
      placeholder="Persoon inschrijven"
      .searchAction="${(val: string): Promise<TypeAheadHint[]> =>
        persoonService
          .getAll({
            type: 'deelnemer',
            searchType: 'text',
            search: val,
          })
          .then((personen) =>
            personen.map((persoon) => ({
              text: fullName(persoon),
              value: persoon.id,
            })),
          )}"
      .submitAction="${(hint: TypeAheadHint) => {
        return projectService
          .createInschrijving(this.project.id, {
            persoonId: +hint.value,
            projectId: this.project.id,
          })
          .then((inschrijving) => {
            this.inschrijvingen = [
              ...(this.inschrijvingen ?? []),
              inschrijving,
            ];
          });
      }}"
    ></kei-autocomplete>`;
  }
}
