import {
  Aanmelding,
  Cursus,
  OverigPersoon,
  Woonsituatie,
  calculateAge,
  notEmpty,
  showDatum,
  showTijd,
  split,
  werksituaties,
  woonsituaties,
} from '@rock-solid/shared';
import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { fullName } from '../personen/persoon.pipe';
import { pluralize } from '../shared';
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
    const blob = new Blob([this.rapportContent.outerHTML], { type });
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
        ${this.renderBegeleiding()} ${this.renderActiviteitLocaties()}
        ${this.renderVormingsuren()} ${this.renderProvincies()}
        ${this.renderWoonsituaties()} ${this.renderWerksituaties()}
        ${this.renderRekrutering()}
      </div>`;
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
                <td>${showDatum(activiteit.van)}</td>
                <td>${activiteit.locatie?.naam}</td>
              </tr>`,
          )}
        </tbody>
      </table>`;
  }

  private renderVormingsuren() {
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
        this.aanmeldingen
          .map((aanmelding) => aanmelding.plaats?.provincie)
          .filter(notEmpty),
      ),
    ].sort();

    return html`<h3>Provincies</h3>
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Activiteit</th>
            ${provincies.map((provincie) => html`<th>${provincie}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${this.project.activiteiten.map(
            (_, i) =>
              html`<tr>
                <th>${renderRangtelwoord(i)}</th>
                ${provincies.map(
                  (provincie) =>
                    html`<td>
                      ${this.aanmeldingen.filter(
                        (aanmelding) =>
                          aanmelding.plaats?.provincie === provincie,
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
        this.aanmeldingen
          .map((aanmelding) => aanmelding.woonsituatie)
          .filter(notEmpty),
      ),
    ].sort();
    return html`<h2>Woonsituatie</h2>
      <table class="table table-bordered">
        <thead>
          <tr>
            ${situaties.map(
              (woonsituatie) => html`<th>${woonsituaties[woonsituatie]}</th>`,
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
        this.aanmeldingen
          .map((aanmelding) => aanmelding.werksituatie)
          .filter(notEmpty),
      ),
    ].sort();
    return html`<h2>Werksituatie</h2>
      <table class="table table-bordered">
        <thead>
          <tr>
            ${situaties.map(
              (werksituatie) => html`<th>${werksituaties[werksituatie]}</th>`,
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
    const situaties = [
      ...new Set(
        this.aanmeldingen
          .map((aanmelding) => aanmelding.woonsituatie)
          .filter(notEmpty),
      ),
    ].sort();

    const recruteringPerSituatie = Object.fromEntries(
      situaties.map((sit) => {
        const aanmeldingen = this.aanmeldingen.filter(
          (aanmelding) => aanmelding.woonsituatie === sit,
        );
        const [nieuw, gekend] = split(
          aanmeldingen,
          (aan) => aan.deelnemer?.eersteCursus === this.project.projectnummer,
        );
        return [sit, { nieuw: nieuw.length, gekend: gekend.length }];
      }),
    ) as Record<Woonsituatie, RekruteringAantallen>;

    return html`<h2>Rekrutering</h2>
      <table class="table table-bordered">
        <thead>
          <tr>
            <th></th>
            ${situaties.map(
              (woonsituatie) => html`<th>${woonsituaties[woonsituatie]}</th>`,
            )}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Nieuw</th>
            ${situaties.map(
              (woonsituatie) =>
                html`<td>${recruteringPerSituatie[woonsituatie].nieuw}</td>`,
            )}
          </tr>
          <tr>
            <th>Gekend</th>
            ${situaties.map(
              (woonsituatie) =>
                html`<td>${recruteringPerSituatie[woonsituatie].gekend}</td>`,
            )}
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

interface RekruteringAantallen {
  nieuw: number;
  gekend: number;
}
