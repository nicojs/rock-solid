import {
  AanmeldingOf,
  aanmeldingsstatussen,
  Cursus,
  cursusLabels,
  notEmpty,
  organisatieonderdelen,
  Project,
  showDatum,
  vakantieSeizoenen,
} from '@rock-solid/shared';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { join } from 'lit/directives/join.js';
import { bootstrap } from '../../styles';
import {
  downloadCsv,
  entities,
  notAvailable,
  pluralize,
  showMoney,
  showNumber,
  toDeelnemersCsv,
} from '../shared';
import { projectService } from './project.service';
import { privilege } from '../auth/privilege.directive';
import { ModalComponent } from '../shared/modal.component';
import { printProject, showDoelgroep } from './project.pipes';

@customElement('rock-projecten-list')
export class ProjectenListComponent extends LitElement {
  static override styles = [bootstrap];

  @property()
  public projecten!: Project[] | AanmeldingOf<Project>[];

  override render() {
    return html`<div class="row">
      ${html`${this.projecten.length
        ? this.renderTable()
        : html`<div class="mb-3">Geen projecten gevonden 🤷‍♂️</div>`}`}
    </div>`;
  }

  private downloadDeelnemersLijst(project: Project) {
    projectService.getAanmeldingen(project.id).then((aanmelding) => {
      downloadCsv(
        toDeelnemersCsv(
          aanmelding.map(({ deelnemer }) => deelnemer).filter(notEmpty),
        ),
        `Deelnemerslijst ${project.naam}`,
      );
    });
  }

  private async deleteProject(project: Project) {
    const confirmed = await ModalComponent.instance.confirm(
      html`Weet je zeker dat je <strong>${printProject(project)}</strong> met
        <strong>${entities(project.activiteiten.length, 'activiteit')}</strong>
        en
        <strong
          >${entities(project.aantalInschrijvingen, 'inschrijving')}</strong
        >
        verwijderen?`,
    );
    if (confirmed) {
      const deleteEvent = new CustomEvent<Project>('delete', {
        bubbles: true,
        composed: true,
        detail: project,
      });
      this.dispatchEvent(deleteEvent);
    }
  }

  private renderTable() {
    const isCursus = this.projecten[0]!.type === 'cursus';
    const hasStatus = 'status' in (this.projecten[0] ?? {});
    const hasDoelgroepen = this.projecten.some(
      (project) => project.type === 'cursus' && project.doelgroep,
    );
    const showDeelnemersuren = this.projecten.some(
      (project) =>
        project.type === 'cursus' && project.organisatieonderdeel === 'keiJong',
    );
    const showVormingsuren = this.projecten.some(
      (project) =>
        project.type === 'cursus' && project.organisatieonderdeel === 'deKei',
    );
    return html`<table class="table table-hover table-sm">
      <thead class="sticky-top">
        <tr>
          ${hasStatus ? html`<th>Status</th>` : ''}
          <th>Projectnummer</th>
          ${isCursus
            ? html`<th>Naam</th>`
            : html`<th>Bestemming</th>
                <th>Land</th>`}
          ${isCursus
            ? html`
                <th>Locatie(s)</th>
                <th>Organisatieonderdeel</th>
                ${hasDoelgroepen
                  ? html`<th>${cursusLabels.doelgroep}</th>`
                  : ''}
                ${showDeelnemersuren ? html`<th>Deelnemersuren</th>` : ''}
                ${showVormingsuren ? html`<th>Vormingsuren</th>` : ''}
              `
            : html`
                <th class="text-end">Voorschot</th>
                <th class="text-center">Seizoen</th>
              `}
          <th class="text-end">Prijs</th>
          <th>Activiteiten</th>
          <th style="width: 230px">Acties</th>
        </tr>
      </thead>
      <tbody>
        ${this.projecten.map(
          (project) =>
            html`<tr>
              ${hasStatus
                ? html`<td>
                    ${'status' in project
                      ? aanmeldingsstatussen[project.status]
                      : notAvailable}
                  </td>`
                : ''}
              <td>${project.projectnummer}</td>
              ${project.type === 'cursus'
                ? html`<td>${project.naam}</td>`
                : html`
                    <td>${project.bestemming}</td>
                    <td>${project.land}</td>
                  `}
              ${project.type === 'cursus'
                ? html`<td>${renderLocaties(project)}</td>

                    <td>
                      ${project.type === 'cursus'
                        ? organisatieonderdelen[project.organisatieonderdeel]
                        : notAvailable}
                    </td>
                    ${hasDoelgroepen
                      ? html`<td>${showDoelgroep(project.doelgroep)}</td>`
                      : ''}
                    ${showDeelnemersuren
                      ? html`<td>
                          ${project.organisatieonderdeel === 'keiJong'
                            ? showNumber(
                                project.activiteiten
                                  .map((act) => act.aantalDeelnemersuren)
                                  .reduce<number>(
                                    (acc, cur) => acc + (cur ?? 0),
                                    0,
                                  ),
                              )
                            : ''}
                        </td>`
                      : ''}
                    ${showVormingsuren
                      ? html`<td>
                          ${project.organisatieonderdeel === 'deKei'
                            ? showNumber(
                                project.activiteiten
                                  .map((act) => act.vormingsuren)
                                  .reduce<number>(
                                    (acc, cur) => acc + (cur ?? 0),
                                    0,
                                  ),
                              )
                            : ''}
                        </td>`
                      : ''}

                    <td class="text-end">${showMoney(project.prijs)}</td> `
                : html`
                    <td class="text-end">${showMoney(project.voorschot)}</td>
                    <td class="text-center">
                      ${project.seizoen
                        ? vakantieSeizoenen[project.seizoen]
                        : notAvailable}
                    </td>
                  `}

              <td>
                ${project.activiteiten.map((activiteit) => {
                  const inPast = activiteit.totEnMet < new Date();
                  return html` ${inPast
                    ? html`<rock-link
                        title="Open activiteit"
                        btn
                        sm
                        keepQuery
                        ?btnWarning=${!activiteit.isCompleted}
                        ?btnOutlinePrimary=${activiteit.isCompleted}
                        href="/${pluralize(
                          project.type,
                        )}/${project.id}/aanmeldingen/deelnames/${activiteit.id}"
                        ><rock-icon icon="calendar"></rock-icon> ${showDatum(
                          activiteit.van,
                        )}</rock-link
                      >`
                    : html`<span
                        title="Activiteit vindt plaats in de toekomst"
                        class="btn btn-sm disabled"
                        ><rock-icon icon="calendar"></rock-icon> ${showDatum(
                          activiteit.van,
                        )}</span
                      >`}`;
                })}
              </td>
              <td>
                <button
                  title="Deelnemerslijst downloaden (voor mailing)"
                  class="btn btn-outline-primary btn-sm"
                  type="button"
                  @click=${() => this.downloadDeelnemersLijst(project)}
                >
                  <rock-icon icon="download"></rock-icon>
                </button>

                <rock-link
                  btn
                  sm
                  btnOutlinePrimary
                  title="Wijzigen"
                  href="/${pluralize(project.type)}/${project.id}/edit"
                  keepQuery
                  ><rock-icon icon="pencil"></rock-icon
                ></rock-link>
                <rock-link
                  btn
                  sm
                  btnOutlinePrimary
                  title="Aanmeldingen"
                  keepQuery
                  href="/${pluralize(project.type)}/${project.id}/aanmeldingen"
                >
                  <rock-icon icon="pencilSquare"></rock-icon>
                  <span
                    class="badge ${(project.aantalInschrijvingen ?? 0) > 0
                      ? 'bg-success'
                      : 'bg-secondary'}"
                    >${project.aantalInschrijvingen}</span
                  >
                </rock-link>
                <span>
                  <button
                    @click=${() => this.deleteProject(project)}
                    title="${printProject(project)} Verwijderen"
                    type="button"
                    ${privilege('delete:projecten')}
                    class="btn btn-outline-danger btn-sm"
                  >
                    <rock-icon icon="trash"></rock-icon>
                  </button>
                </span>
              </td>
            </tr>`,
        )}
      </tbody>
    </table> `;
  }
}
function renderLocaties(project: Cursus): unknown {
  return join(
    project.activiteiten
      .map((act) => act.locatie?.naam)
      .filter(notEmpty)
      .filter((item, index, arr) => arr.indexOf(item) === index)
      .map((item) => html`<span class="text-nowrap">${item}</span>`),
    ', ',
  );
}
