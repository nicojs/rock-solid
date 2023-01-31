import {
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
  notAvailable,
  pluralize,
  showDatum,
  showMoney,
  toDeelnemersCsv,
} from '../shared';
import { projectService } from './project.service';
import style from './projecten-list.component.scss';

@customElement('rock-projecten-list')
export class ProjectenListComponent extends LitElement {
  static override styles = [bootstrap, unsafeCSS(style)];

  @property()
  public projecten!: Project[];

  override render() {
    return html`<div class="row">
      ${html`${this.projecten.length
        ? this.renderTable()
        : html`<div class="mb-3">Geen projecten gevonden 🤷‍♂️</div>`}`}
    </div>`;
  }

  private downloadDeelnemersLijst(project: Project) {
    projectService.getInschrijvingen(project.id).then((inschrijvingen) => {
      downloadCsv(
        toDeelnemersCsv(
          inschrijvingen.map(({ deelnemer }) => deelnemer).filter(notEmpty),
        ),
        `Deelnemerslijst ${project.naam}`,
      );
    });
  }

  private renderTable() {
    return html`<table class="table table-hover table-sm">
      <thead>
        <tr>
          <th>Projectnummer</th>
          <th>Naam</th>
          ${this.projecten[0]!.type === 'cursus'
            ? html`<th>Organisatieonderdeel</th>
                <th>Deelnemersuren</th>`
            : html`<th>Seizoen</th>
                <th>Prijs</th>
                <th>Voorschot</th>`}
          <th>Activiteiten</th>
          <th>Acties</th>
        </tr>
      </thead>
      <tbody>
        ${this.projecten.map(
          (project) => html`<tr>
            <td>${project.projectnummer}</td>
            <td>${project.naam}</td>
            ${project.type === 'cursus'
              ? html`<td>
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
              : html`<td>
                    ${project.seizoen
                      ? vakantieSeizoenen[project.seizoen]
                      : notAvailable}
                  </td>
                  <td>${showMoney(project.prijs)}</td>
                  <td>${showMoney(project.voorschot)}</td>`}

            <td>
              ${project.activiteiten.map((activiteit) => {
                const inPast = activiteit.totEnMet < new Date();
                const isComplete =
                  activiteit.aantalDeelnames! >= project.aantalInschrijvingen!;
                return html` ${inPast
                  ? html`<rock-link
                      title="Open activiteit"
                      btn
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
                class="btn btn-outline-primary "
                type="button"
                @click=${() => this.downloadDeelnemersLijst(project)}
              >
                <rock-icon icon="download"></rock-icon>
              </button>

              <rock-link
                btn
                btnOutlinePrimary
                title="Wijzigen"
                href="/${pluralize(project.type)}/${project.id}/edit"
                ><rock-icon icon="pencil"></rock-icon
              ></rock-link>
              <rock-link
                btn
                btnOutlinePrimary
                title="Inschrijvingen"
                href="/${pluralize(project.type)}/${project.id}/inschrijvingen"
              >
                <rock-icon icon="pencilSquare"></rock-icon>
                <span
                  class="badge ${(project.aantalInschrijvingen ?? 0) > 0
                    ? 'bg-success'
                    : 'bg-secondary'}"
                  >${project.aantalInschrijvingen}</span
                >
              </rock-link>
            </td>
          </tr>`,
        )}
      </tbody>
    </table> `;
  }
}
