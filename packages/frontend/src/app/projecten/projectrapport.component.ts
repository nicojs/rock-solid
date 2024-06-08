import {
  Aanmelding,
  Cursus,
  Geslacht,
  OverigPersoon,
  Werksituatie,
  Woonsituatie,
  calculateAge,
  showDatum,
  showTijd,
  werksituaties,
  woonsituaties,
} from '@rock-solid/shared';
import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { fullName } from '../personen/persoon.pipe';
import { pluralize, unknown } from '../shared';
import { createRef, ref } from 'lit/directives/ref.js';

@customElement('rock-projectrapport')
export class ProjectRapportComponent extends LitElement {
  static override styles = [bootstrap];

  @property()
  public project!: Cursus;

  @property()
  public aanmeldingen!: Aanmelding[];

  @state()
  private copied = false;

  private rapportContentRef = createRef<HTMLDivElement>();
  private get rapportContent() {
    return this.rapportContentRef.value!;
  }

  protected override firstUpdated(): void {
    // This is a workaround for the fact that the clipboard API does not support global styles
    // Also, if it were to support global styles, it would also override word's defaults for font, color, size, etc
    // Also, we don't want to repeat all these styles in each render function.
    // All in all, I think this imperative approach is the best.
    this.rapportContent.querySelectorAll('table').forEach((table) => {
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.border = '1px solid black';
    });
    this.rapportContent.querySelectorAll('th').forEach((th) => {
      th.style.textAlign = 'left';
      th.style.border = '1px solid black';
      th.style.padding = '5px';
    });
    this.rapportContent.querySelectorAll('td').forEach((td) => {
      td.style.border = '1px solid black';
      td.style.padding = '5px';
    });
  }

  private copyButtonResetTimeout?: number;
  private async copy() {
    const type = 'text/html';
    const blob = new Blob([this.rapportContent.innerHTML], { type });
    const data = [new ClipboardItem({ [type]: blob })];
    await navigator.clipboard.write(data);
    this.copied = true;
    clearTimeout(this.copyButtonResetTimeout);
    this.copyButtonResetTimeout = setTimeout(() => {
      this.copied = false;
    }, 3000);
  }

  public override render() {
    return html`<rock-link
        btn
        btnOutlineSecondary
        href="/${pluralize(this.project.type)}/${this.project.id}/aanmeldingen"
        ><rock-icon icon="arrowLeft"></rock-icon> Terug naar
        aanmeldingen</rock-link
      >
      <button
        title="Kopieer het rapport naar het klembord"
        @click=${() => this.copy()}
        class="btn ${!this.copied ? 'btn-primary' : ''} btn-sm"
      >
        ${this.copied
          ? html`<rock-icon
              class="text-success"
              icon="checkCircle"
            ></rock-icon>`
          : html`<rock-icon icon="copy"></rock-icon>`}
      </button>

      <div ${ref(this.rapportContentRef)}>
        <h1>
          PROJECTRAPPORT ${this.project.projectnummer}<br />
          (${this.project.naam})
        </h1>
        <h2>Situering</h2>
        ${this.project.organisatieonderdeel === 'deKei'
          ? this.renderSitueringDeKei()
          : this.renderSitueringKeiJong()}
      </div>`;
  }

  private renderSitueringDeKei() {
    return html` ${this.renderBegeleiding()} ${this.renderActiviteitLocaties()}
    ${this.renderVormingEnBegeleidingsurenDeKei()} ${this.renderProvincies()}
    ${this.renderWoonsituaties()} ${this.renderWerksituaties()}
    ${this.renderRekrutering()} ${this.renderDiversiteit()}`;
  }

  private renderSitueringKeiJong() {
    return html`
      ${this.renderBegeleiding()} ${this.renderActiviteitLocaties()}
      ${this.renderVormingsurenKeiJong()} ${this.renderProvincies()}
      ${this.renderWoonsituaties()} ${this.renderWerksituaties()}
      ${this.renderRekrutering()}
    `;
  }

  private renderBegeleiding() {
    return html`<h3>Begeleiding</h3>
      <table class="table">
        <tbody>
          <tr>
            <th>Cursusverantwoordelijke</th>
            <td>${renderBegeleider(this.project.begeleiders[0])}</td>
          </tr>
          <tr>
            <th>Overige begeleiding</th>
            <td>
              ${this.project.begeleiders
                .slice(1)
                .map(
                  (begeleider) => html`${renderBegeleider(begeleider)}<br />`,
                )}
            </td>
          </tr>
        </tbody>
      </table>`;
  }

  private renderActiviteitLocaties() {
    return html`<h3>Data en cursushuis per activiteit</h3>
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Activiteit</th>
            <th>Data</th>
            <th>Cursushuis</th>
          </tr>
        </thead>
        <tbody>
          ${this.project.activiteiten.map(
            (activiteit, i) =>
              html`<tr>
                <td>${renderRangtelwoord(i)}</td>
                <td>
                  ${showDatum(activiteit.van)} tot en met
                  ${showDatum(activiteit.totEnMet)}
                </td>
                <td>${activiteit.locatie?.naam}</td>
              </tr>`,
          )}
        </tbody>
      </table>`;
  }

  private renderVormingEnBegeleidingsurenDeKei() {
    const totaalVormingsuren = this.project.activiteiten.reduce(
      (acc, act) => acc + (act.vormingsuren ?? 0),
      0,
    );
    const totaalBegeleidingsuren = this.project.activiteiten.reduce(
      (acc, act) => acc + (act.begeleidingsuren ?? 0),
      0,
    );
    return html`<h3>Vormingsuren en begeleidingsuren</h3>
      <table class="table table-bordered">
        <tbody>
          <tr>
            <th>Gezamenlijk</th>
            <td>${totaalVormingsuren}u</td>
          </tr>
          <tr>
            <th>Gesplitste</th>
            <td>/</td>
          </tr>
          <tr>
            <th>Totaal</th>
            <td><strong>${totaalVormingsuren}u</strong></td>
          </tr>
          <tr>
            <th>Begeleidingsuren</th>
            <td>${totaalBegeleidingsuren}u</td>
          </tr>
        </tbody>
      </table>`;
  }

  private renderVormingsurenKeiJong() {
    return html`<h3>Vormingsuren met begin- en einduur</h3>
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Activiteit</th>
            ${this.project.activiteiten.map(
              (_, i) => html`<th>${renderRangtelwoord(i)}</th>`,
            )}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Vormingsuren</th>
            ${this.project.activiteiten.map(
              (activiteit) => html`<td>${activiteit.vormingsuren}</td>`,
            )}
          </tr>
          <tr>
            <th>Beginuur</th>
            ${this.project.activiteiten.map(
              (activiteit) => html`<td>${showTijd(activiteit.van)}</td>`,
            )}
          </tr>
          <tr>
            <th>Einduur</th>
            ${this.project.activiteiten.map(
              (activiteit) => html`<td>${showTijd(activiteit.totEnMet)}</td>`,
            )}
          </tr>
          <tr>
            <th># dlnrs.</th>
            ${this.project.activiteiten.map(
              (activiteit) => html`<td>${activiteit.aantalDeelnames}</td>`,
            )}
          </tr>
          <tr>
            <th>Opmerkingen</th>
            <td colspan="${this.project.activiteiten.length}"></td>
          </tr>
        </tbody>
      </table>`;
  }

  private renderProvincies() {
    const provincies = [
      ...new Set(
        this.aanmeldingen.map((aanmelding) => aanmelding.plaats?.provincie),
      ),
    ].sort();

    return html`<h3>Provincies</h3>
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Activiteit</th>
            ${provincies.map(
              (provincie) => html`<th>${renderProvincie(provincie)}</th>`,
            )}
          </tr>
        </thead>
        <tbody>
          ${this.project.activiteiten.map(
            (activiteit, i) =>
              html`<tr>
                <th>${renderRangtelwoord(i)}</th>
                ${provincies.map(
                  (provincie) =>
                    html`<td>
                      ${this.aanmeldingen.filter(
                        (aanmelding) =>
                          aanmelding.deelnames.find(
                            (deelname) =>
                              deelname.activiteitId === activiteit.id &&
                              deelname.effectieveDeelnamePerunage > 0,
                          ) && aanmelding.plaats?.provincie === provincie,
                      ).length}
                    </td>`,
                )}
              </tr>`,
          )}
        </tbody>
      </table>`;
  }

  private renderWoonsituaties() {
    const situaties = [
      ...new Set(
        this.aanmeldingen.map((aanmelding) => aanmelding.woonsituatie),
      ),
    ].sort();
    return html`<h3>Woonsituatie</h3>
      <table class="table table-bordered">
        <thead>
          <tr>
            ${situaties.map(
              (woonsituatie) =>
                html`<th>${renderWoonsituatie(woonsituatie)}</th>`,
            )}
          </tr>
        </thead>
        <tbody>
          <tr>
            ${situaties.map(
              (woonsituatie) =>
                html`<td>
                  ${this.aanmeldingen.filter(
                    (aanmelding) => aanmelding.woonsituatie === woonsituatie,
                  ).length}
                </td>`,
            )}
          </tr>
        </tbody>
      </table>`;
  }

  private renderWerksituaties() {
    const situaties = [
      ...new Set(
        this.aanmeldingen.map((aanmelding) => aanmelding.werksituatie),
      ),
    ].sort();
    return html`<h3>Werksituatie</h3>
      <table class="table table-bordered">
        <thead>
          <tr>
            ${situaties.map(
              (werksituatie) =>
                html`<th>${renderWerksituatie(werksituatie)}</th>`,
            )}
          </tr>
        </thead>
        <tbody>
          <tr>
            ${situaties.map(
              (werksituatie) =>
                html`<td>
                  ${this.aanmeldingen.filter(
                    (aanmelding) => aanmelding.werksituatie === werksituatie,
                  ).length}
                </td>`,
            )}
          </tr>
        </tbody>
      </table>`;
  }

  private renderRekrutering() {
    return html`<h3>Rekrutering</h3>
      <p>
        <em>ZELF INVULLEN!</em> verdeel de ${this.aanmeldingen.length}
        inschrijvingen over deze tabel
      </p>
      <table class="table table-bordered">
        <thead>
          <tr>
            <th></th>
            <th>Begeleiding woonsituatie</th>
            <th>Begeleiding werksituatie</th>
            <th>School</th>
            <th>Individueel</th>
            <th>Vakantiewerking</th>
            <th>Andere (specificiëren)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Nieuw</th>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <th>Gekend</th>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table> `;
  }
  private renderDiversiteit() {
    const countGeslacht = (geslacht: Geslacht) =>
      this.aanmeldingen.filter((aanmelding) => aanmelding.geslacht === geslacht)
        .length;

    const byAge = {
      unknown: 0,
      '<20': 0,
      '20-29': 0,
      '30-39': 0,
      '40-49': 0,
      '50-59': 0,
      '60-69': 0,
      '70+': 0,
    };

    this.aanmeldingen.forEach((aanmelding) => {
      if (!aanmelding.deelnemer?.geboortedatum) {
        byAge['unknown']++;
        return;
      }
      const age = calculateAge(
        aanmelding.deelnemer.geboortedatum,
        this.project.activiteiten[0]?.van,
      );
      if (age < 20) {
        byAge['<20']++;
      } else if (age < 30) {
        byAge['20-29']++;
      } else if (age < 40) {
        byAge['30-39']++;
      } else if (age < 50) {
        byAge['40-49']++;
      } else if (age < 60) {
        byAge['50-59']++;
      } else if (age < 70) {
        byAge['60-69']++;
      } else {
        byAge['70+']++;
      }
    });

    return html`<h3>Diversiteit</h3>
      <table class="table table-bordered">
        <thead>
          <tr>
            <th></th>
            <th>Vrouw</th>
            <th>Man</th>
            <th>Andere</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Aantal</th>
            <td>${countGeslacht('man')}</td>
            <td>${countGeslacht('vrouw')}</td>
            <td>${countGeslacht('x')}</td>
          </tr>
        </tbody>
      </table>
      <table>
        <thead>
          <tr>
            <th>Leeftijd</th>
            ${byAge.unknown ? html`<th>Onbekend</th>` : nothing}
            ${byAge['<20'] ? html`<th>&lt;20</th>` : nothing}
            ${byAge['20-29'] ? html`<th>20-29</th>` : nothing}
            ${byAge['30-39'] ? html`<th>30-39</th>` : nothing}
            ${byAge['40-49'] ? html`<th>40-49</th>` : nothing}
            ${byAge['50-59'] ? html`<th>50-59</th>` : nothing}
            ${byAge['60-69'] ? html`<th>60-69</th>` : nothing}
            ${byAge['70+'] ? html`<th>70+</th>` : nothing}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Aantal</th>
            ${byAge.unknown ? html`<td>${byAge.unknown}</td>` : nothing}
            ${byAge['<20'] ? html`<td>${byAge['<20']}</td>` : nothing}
            ${byAge['20-29'] ? html`<td>${byAge['20-29']}</td>` : nothing}
            ${byAge['30-39'] ? html`<td>${byAge['30-39']}</td>` : nothing}
            ${byAge['40-49'] ? html`<td>${byAge['40-49']}</td>` : nothing}
            ${byAge['50-59'] ? html`<td>${byAge['50-59']}</td>` : nothing}
            ${byAge['60-69'] ? html`<td>${byAge['60-69']}</td>` : nothing}
            ${byAge['70+'] ? html`<td>${byAge['70+']}</td>` : nothing}
          </tr>
        </tbody>
      </table> `;
  }
}

function renderBegeleider(persoon?: OverigPersoon) {
  if (!persoon) {
    return nothing;
  }
  const { geboortedatum } = persoon;
  return html`${fullName(persoon)}${geboortedatum
    ? html`, ${calculateAge(geboortedatum)} (${showDatum(geboortedatum)})`
    : nothing}`;
}

function renderRangtelwoord(index: number) {
  switch (index) {
    case 0:
      return '1ste';
    default:
      return `${index + 1}e`;
  }
}

function renderWoonsituatie(woonsituatie: Woonsituatie | undefined) {
  return woonsituatie ? woonsituaties[woonsituatie] : unknown;
}

function renderWerksituatie(werksituatie: Werksituatie | undefined) {
  return werksituatie ? werksituaties[werksituatie] : unknown;
}

function renderProvincie(provincie: string | undefined) {
  return provincie ?? unknown;
}
