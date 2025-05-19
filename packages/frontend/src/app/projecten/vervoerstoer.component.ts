import { customElement, property, state } from 'lit/decorators.js';
import { RockElement } from '../rock-element';
import { css, html, nothing, PropertyValues } from 'lit';
import { Aanmelding, Project, ProjectType } from '@rock-solid/shared';
import { projectService } from './project.service';
import { deelnemerLink, printProject } from './project.pipes';
import { fullName } from '../personen/persoon.pipe';
import { bootstrap } from '../../styles';
import { showLocatie } from '../locaties/locatie.pipe';

const ACTIVE_STATUSSEN = Object.freeze(['Bevestigd', 'Aangemeld']);

@customElement('rock-vervoerstoer')
export class VervoerstoerComponent extends RockElement {
  static override styles = [
    bootstrap,
    css`
      .text-vertical {
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        text-align: center;
        vertical-align: middle;
      }
    `,
  ];

  @property({ attribute: false })
  public projectIds: number[] = [];

  @property({ type: Boolean })
  public enkelVakanties = false;

  @property()
  public type: ProjectType = 'cursus';

  @state()
  public projecten?: Project[];

  @state()
  public aanmeldingen?: Aanmelding[];

  protected override update(
    changedProperties: PropertyValues<VervoerstoerComponent>,
  ): void {
    if (
      changedProperties.has('projectIds') ||
      changedProperties.has('enkelVakanties')
    ) {
      this.#loadProjecten();
    }
    super.update(changedProperties);
  }

  async #loadProjecten() {
    this.projecten = undefined;
    this.aanmeldingen = undefined;
    [this.projecten, this.aanmeldingen] = await Promise.all([
      projectService.getAll({
        ids: this.projectIds,
        type: this.type,
      }),
      Promise.all(
        this.projectIds.map((id) => projectService.getAanmeldingen(id)),
      ).then((aanmeldingen) =>
        aanmeldingen
          .flat()
          .filter((aanmelding) => ACTIVE_STATUSSEN.includes(aanmelding.status)),
      ),
    ]);
  }

  override render() {
    if (!this.projecten || !this.aanmeldingen) {
      return html`<rock-loading></rock-loading>`;
    }
    const opstapplaatsen = this.aanmeldingen
      .flatMap(
        (aanmelding) => aanmelding.deelnemer?.mogelijkeOpstapplaatsen || [],
      )
      .filter(
        (value, index, self) =>
          self.findIndex((val) => val.id === value.id) === index,
      )
      .filter(
        (opstapplaats) =>
          opstapplaats.geschiktVoorVakantie || !this.enkelVakanties,
      );

    return html`
      <h2>Vervoerstoer maken</h2>
      <p>
        Projecten geselecteerd:
        ${this.projecten.map(
          (project) =>
            html`<span class="ms-2 badge text-bg-secondary"
              >${printProject(project)}</span
            >`,
        )}
      </p>

      ${this.aanmeldingen.length === 0
        ? html`<p class="alert alert-info">
            Deze projecten hebben nog geen deelnemers met status 'Aangemeld' of
            'Bevestigd'.
          </p>`
        : opstapplaatsen.length === 0
          ? html`<p class="alert alert-info">
              Deelnemers in deze projecten hebben nog geen mogelijke
              opstapplaatsen.
            </p>`
          : nothing}
      <table class="table table-hover table-sm">
        <thead class="sticky-top">
          <tr>
            <th>Deelnemer</th>
            <th>Project</th>
            ${opstapplaatsen.map(
              (opstapplaats) =>
                html`<th class="text-vertical">${opstapplaats.naam}</th>`,
            )}
          </tr>
        </thead>
        <tbody>
          ${this.aanmeldingen.map((aanmelding) => {
            const deelnemer = aanmelding.deelnemer;
            const project = this.projecten!.find(
              (project) => project.id === aanmelding.projectId,
            )!;
            if (!deelnemer) return null;
            const naam = fullName(deelnemer);
            return html`
              <tr>
                <td>${deelnemerLink(deelnemer)}</td>
                <td>${printProject(project)}</td>
                ${opstapplaatsen.map((opstapplaats) => {
                  const isOpstapplaats =
                    deelnemer.mogelijkeOpstapplaatsen.find(
                      (value) => value.id === opstapplaats.id,
                    ) !== undefined;
                  return html`<td
                    title="${isOpstapplaats
                      ? `${naam} heeft ${showLocatie(opstapplaats)} als mogelijke opstapplaats`
                      : ''}"
                    class="text-center"
                  >
                    ${isOpstapplaats
                      ? html`<rock-icon icon="circle"></rock-icon>`
                      : ''}
                  </td>`;
                })}
              </tr>
            `;
          })}
        </tbody>
      </table>
    `;
  }
}
