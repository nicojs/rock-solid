import {
  AanmeldingOf,
  aanmeldingsstatussen,
  notEmpty,
  organisatieonderdelen,
  Project,
  vakantieSeizoenen,
} from '@rock-solid/shared';
import { html, LitElement, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import {
  downloadCsv,
  entities,
  notAvailable,
  pluralize,
  showDatum,
  showMoney,
  toDeelnemersCsv,
} from '../shared';
import { projectService } from './project.service';
import style from './projecten-list.component.scss';
import { privilege } from '../auth/privilege.directive';
import { ModalComponent } from '../shared/modal.component';
import { printProject } from './project.pipes';

@customElement('rock-projecten-list')
export class ProjectenListComponent extends LitElement {
  static override styles = [bootstrap, unsafeCSS(style)];

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
        <strong>${entities(project.aantalAanmeldingen, 'aanmelding')}</strong>
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
    return html`<table class="table table-hover table-sm">
      <thead>
        <tr>
          ${hasStatus ? html`<th>Status</th>` : ''}
          <th>Projectnummer</th>
          ${isCursus
            ? html`<th>Naam</th>`
            : html`<th>Bestemming</th>
                <th>Land</th>`}
          <th>Prijs</th>
          ${isCursus
            ? html`
                <th>Locatie(s)</th>
                <th>Organisatieonderdeel</th>
                <th>Deelnemersuren</th>
              `
            : html`
                <th>Voorschot</th>
                <th>Seizoen</th>
              `}
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
              <td>${showMoney(project.prijs)}</td>
              ${project.type === 'cursus'
                ? html`<td>
                      ${project.activiteiten
                        .map((act) => act.locatie?.naam)
                        .filter(notEmpty)
                        .filter(
                          (item, index, arr) => arr.indexOf(item) === index,
                        )
                        .join(', ')}
                    </td>
                    <td>
                      ${project.type === 'cursus'
                        ? organisatieonderdelen[project.organisatieonderdeel]
                        : notAvailable}
                    </td>
                    <td>
                      ${project.type === 'cursus'
                        ? project.activiteiten
                            .map((act) => act.aantalDeelnemersuren)
                            .reduce<number>((acc, cur) => acc + (cur ?? 0), 0)
                        : notAvailable}
                    </td>`
                : html`
                    <td>${showMoney(project.voorschot)}</td>
                    <td>
                      ${project.seizoen
                        ? vakantieSeizoenen[project.seizoen]
                        : notAvailable}
                    </td>
                  `}

              <td>
                ${project.activiteiten.map((activiteit) => {
                  const inPast = activiteit.totEnMet < new Date();
                  const isComplete =
                    activiteit.aantalDeelnames! >= project.aantalAanmeldingen!;
                  return html` ${inPast
                    ? html`<rock-link
                        title="Open activiteit"
                        btn
                        sm
                        ?btnWarning=${!isComplete}
                        ?btnOutlinePrimary=${isComplete}
                        href="/${pluralize(
                          project.type,
                        )}/${project.id}/deelnames/${activiteit.id}"
                        ><rock-icon icon="calendar"></rock-icon> ${showDatum(
                          activiteit.van,
                        )}</rock-link
                      >`
                    : html`<span
                        title="Activiteit vindt plaats in de toekomst"
                        class="no-button-date"
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
                  ><rock-icon icon="pencil"></rock-icon
                ></rock-link>
                <rock-link
                  btn
                  sm
                  btnOutlinePrimary
                  title="Aanmeldingen"
                  href="/${pluralize(project.type)}/${project.id}/aanmeldingen"
                >
                  <rock-icon icon="pencilSquare"></rock-icon>
                  <span
                    class="badge ${(project.aantalAanmeldingen ?? 0) > 0
                      ? 'bg-success'
                      : 'bg-secondary'}"
                    >${project.aantalAanmeldingen}</span
                  >
                </rock-link>
                <span>
                  <button
                    @click=${() => this.deleteProject(project)}
                    title="${printProject(project)} Verwijderen"
                    type="button"
                    ${privilege('write:projecten')}
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
