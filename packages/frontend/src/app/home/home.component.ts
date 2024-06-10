import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { reportsClient } from '../rapportages/reports-client';
import {
  AanmeldingReportType,
  ActiviteitReportType,
  CursusCategorie,
  ProjectFilter,
  Report,
  toQueryString,
} from '@rock-solid/shared';
import pkg from '../../../package.json';
import { showNumber } from '../shared';

type CategorieReport = Record<CursusCategorie, number>;

@customElement('rock-home')
export class HomeComponent extends LitElement {
  public static override styles = [bootstrap];

  @state()
  private deelnemersurenKeiJongThisYear?: CategorieReport;

  @state()
  private deelnemersurenPrognoseKeiJongThisYear?: CategorieReport;

  @state()
  private activeKeiJongReport: 'current' | 'prognose' = 'current';

  @state()
  private begeleidingsurenDeKeiThisYear?: number;
  @state()
  private vormingsurenDeKeiThisYear?: number;

  private year = new Date().getFullYear();

  public override firstUpdated(): void {
    this.updateDeelnemersuren();
    this.updateDeelnemersurenPrognose();
    this.updateBegeleidingsuren();
    this.updateVormingsuren();
  }

  public override render() {
    const colClass = 'col-6 col-md-3';
    return html`<div class="container-fluid">
      <div class="row">
        <h2 class="col display-1">
          Rock Solid
          <small class="text-muted fs-1"
            >v${pkg.version}
            <a
              href="https://github.com/nicojs/rock-solid/blob/main/CHANGELOG.md"
              target="_blank"
              title="Open de changelog in een nieuw venster"
              class="fs-4 link-underline link-underline-opacity-0 link-underline-opacity-75-hover"
              >changelog <rock-icon icon="boxArrowUpRight"></rock-icon
            ></a>
          </small>
        </h2>
      </div>
      <div class="row mb-4">
        <p class="lead col">
          Steenvast en solide management systeem voor De Kei en Kei-Jong
        </p>
      </div>
      <div class="row">
        <div class="${colClass}">
          <div class="card">
            <div class="card-header">
              <div class="mb-2">Deelnemersuren Kei-Jong ${this.year}</div>
              <ul class="nav nav-tabs card-header-tabs">
                <li class="nav-item">
                  <button
                    @click=${() => (this.activeKeiJongReport = 'current')}
                    class="nav-link ${this.activeKeiJongReport === 'current'
                      ? 'active'
                      : ''}"
                    aria-current="true"
                    href="#"
                  >
                    Huidig
                  </button>
                </li>
                <li class="nav-item">
                  <button
                    @click=${() => (this.activeKeiJongReport = 'prognose')}
                    class="nav-link ${this.activeKeiJongReport === 'prognose'
                      ? 'active'
                      : ''}"
                  >
                    Prognose
                  </button>
                </li>
              </ul>
            </div>
            <div class="card-body">
              ${renderDeelnemersReport(
                this.activeKeiJongReport === 'current'
                  ? this.deelnemersurenKeiJongThisYear
                  : this.deelnemersurenPrognoseKeiJongThisYear,
              )}

              <rock-link
                href="/cursussen/${toQueryString({
                  type: 'cursus',
                  organisatieonderdelen: ['keiJong'],
                } satisfies ProjectFilter)}"
                btn
                btnPrimary
                >Naar Kei-Jong cursussen</rock-link
              >
            </div>
          </div>
        </div>
        <div class="${colClass}">
          <img class="w-100" src="/rock-solid.png" />
        </div>
        <div class="${colClass}">
          <div class="card">
            <div class="card-header">
              Begeleidingsuren De Kei in ${this.year}
            </div>
            <div class="card-body">
              <h5 class="card-title">
                <span class="text-success"
                  >${showNumber(this.vormingsurenDeKeiThisYear)}</span
                >
                vormingsuren
              </h5>
              <p class="card-text">
                En
                <span class="text-success"
                  >${showNumber(this.begeleidingsurenDeKeiThisYear)}</span
                >
                begeleidingsuren
              </p>
              <rock-link
                href="/cursussen/${toQueryString({
                  type: 'cursus',
                  organisatieonderdelen: ['deKei'],
                } satisfies ProjectFilter)}"
                btn
                btnPrimary
                >Naar De Kei cursussen</rock-link
              >
            </div>
          </div>
        </div>
      </div>
      <footer class="py-3 my-4 align-bottom">
        <rock-export-database></rock-export-database>
      </footer>
    </div>`;
  }

  private async updateDeelnemersuren() {
    this.deelnemersurenKeiJongThisYear =
      await this.retrieveReportKeiJongThisYear('deelnemersuren');
  }

  private async updateDeelnemersurenPrognose() {
    this.deelnemersurenPrognoseKeiJongThisYear =
      await this.retrieveReportKeiJongThisYear('deelnemersurenPrognose');
  }

  private async updateVormingsuren() {
    this.vormingsurenDeKeiThisYear =
      await this.retrieveReportDeKeiThisYear('vormingsuren');
  }

  private async updateBegeleidingsuren() {
    this.begeleidingsurenDeKeiThisYear =
      await this.retrieveReportDeKeiThisYear('begeleidingsuren');
  }

  private async retrieveReportDeKeiThisYear(
    reportType: Extract<
      ActiviteitReportType,
      'vormingsuren' | 'begeleidingsuren'
    >,
  ) {
    const results = await reportsClient.get(
      `reports/activiteiten/${reportType}`,
      'jaar',
      undefined,
      {
        jaar: this.year,
        organisatieonderdeel: 'deKei',
      },
    );
    return results.reduce((acc, row) => acc + row.total, 0);
  }

  private async retrieveReportKeiJongThisYear(
    reportType: Extract<
      AanmeldingReportType,
      'deelnemersuren' | 'deelnemersurenPrognose'
    >,
  ) {
    const results = await reportsClient.get(
      `reports/aanmeldingen/${reportType}`,
      'categorie',
      undefined,
      {
        jaar: this.year,
        organisatieonderdeel: 'keiJong',
      },
    );
    return toCategorieReport(results);
  }
}

function renderDeelnemersReport(report: CategorieReport | undefined) {
  return html`<h5 class="card-title">
      <span class="text-success">${showNumber(total(report))}</span>
      Deelnemersuren
    </h5>
    ${renderDeelnemersReportTable(report)}`;
}

function renderDeelnemersReportTable(report: CategorieReport | undefined) {
  return html` <table class="table table-sm">
    <tr>
      <th>Met overnachting</th>
      <td class="text-end">${showNumber(report?.cursusMetOvernachting, 2)}</td>
    </tr>
    <tr>
      <th>Zonder overnachting</th>
      <td class="text-end">
        ${showNumber(report?.cursusZonderOvernachting, 2)}
      </td>
    </tr>
    <tr>
      <th>Inspraakproject</th>
      <td class="text-end">${showNumber(report?.inspraakproject, 2)}</td>
    </tr>
  </table>`;
}

function toCategorieReport(rows: Report): CategorieReport {
  const result: CategorieReport = {
    cursusMetOvernachting: 0,
    cursusZonderOvernachting: 0,
    inspraakproject: 0,
  };
  for (const row of rows) {
    result[row.key as CursusCategorie] = row.total;
  }
  return result;
}

function total(report: CategorieReport | undefined) {
  if (!report) {
    return undefined;
  }
  return (
    report.cursusMetOvernachting +
    report.cursusZonderOvernachting +
    report.inspraakproject
  );
}
