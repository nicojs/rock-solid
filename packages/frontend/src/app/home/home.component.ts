import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { reportsClient } from '../rapportages/reports-client';
import {
  AanmeldingReportType,
  ActiviteitReportType,
  Organisatieonderdeel,
  ProjectFilter,
  toQueryString,
} from '@rock-solid/shared';
import pkg from '../../../package.json';
import { showNumber } from '../shared';

const keiJongOrganisatieonderdelen: ReadonlyArray<Organisatieonderdeel> =
  Object.freeze(['keiJongBuSO', 'keiJongNietBuSO']);

@customElement('rock-home')
export class HomeComponent extends LitElement {
  public static override styles = [bootstrap];

  @state()
  private deelnemersurenKeiJongThisYear: number | undefined;
  @state()
  private deelnemersurenPrognoseKeiJongThisYear: number | undefined;
  @state()
  private begeleidingsurenDeKeiThisYear: number | undefined;
  @state()
  private vormingsurenDeKeiThisYear: number | undefined;

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
            <div class="card-header">Deelnemersuren Kei-Jong ${this.year}</div>
            <div class="card-body">
              <h5 class="card-title">
                <span class="text-success"
                  >${showNumber(this.deelnemersurenKeiJongThisYear)}</span
                >
                deelnemersuren
              </h5>
              <p class="card-text">
                met
                <span class="text-success"
                  >${showNumber(
                    this.deelnemersurenPrognoseKeiJongThisYear,
                  )}</span
                >
                prognose
              </p>
              <rock-link
                href="/cursussen/${toQueryString({
                  type: 'cursus',
                  organisatieonderdelen: ['keiJongBuSO', 'keiJongNietBuSO'],
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
      'organisatieonderdeel',
      undefined,
      {
        jaar: this.year,
      },
    );
    return results
      .filter((row) =>
        keiJongOrganisatieonderdelen.includes(row.key as Organisatieonderdeel),
      )
      .reduce((acc, row) => acc + row.total, 0);
  }
}
