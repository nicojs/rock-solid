import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { reportsClient } from '../rapportages/reports-client';
import {
  Organisatieonderdeel,
  ProjectFilter,
  toQueryString,
} from '@rock-solid/shared';
import pkg from '../../../package.json';
import { showNumber } from '../shared';

const keiJongOrganisatieonderdelen: ReadonlyArray<Organisatieonderdeel> =
  Object.freeze(['keiJongBuSO', 'keiJongNietBuSO']);
const deKeiOrganisatieonderdelen: ReadonlyArray<Organisatieonderdeel> =
  Object.freeze(['deKei']);

@customElement('rock-home')
export class HomeComponent extends LitElement {
  public static override styles = [bootstrap];

  @state()
  private deelnemersUrenKeiJongThisYear: number | undefined;
  @state()
  private begeleidingsurenDeKeiThisYear: number | undefined;
  @state()
  private vormingsurenDeKeiThisYear: number | undefined;

  private year = new Date().getFullYear();

  public override firstUpdated(): void {
    this.updateDeelnemersuren();
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
            <div class="card-header">Deelnemersuren Kei-Jong</div>
            <div class="card-body">
              <h5 class="card-title">
                <span class="text-success"
                  >${showNumber(this.deelnemersUrenKeiJongThisYear)}</span
                >
                deelnemersuren in ${this.year}
              </h5>
              <p class="card-text">
                Deelnemersuren voor Kei-Jong in ${this.year}
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
            <div class="card-header">Begeleidingsuren De Kei</div>
            <div class="card-body">
              <h5 class="card-title">
                <span class="text-success"
                  >${showNumber(this.vormingsurenDeKeiThisYear)}</span
                >
                vormingsuren in ${this.year}
              </h5>
              <p class="card-text">
                En
                <span class="text-success"
                  >${showNumber(this.begeleidingsurenDeKeiThisYear)}</span
                >
                begeleidingsuren voor De Kei in ${this.year}
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

  private updateBegeleidingsuren() {
    reportsClient
      .get(
        'reports/activiteiten/begeleidingsuren',
        'organisatieonderdeel',
        undefined,
        {
          jaar: this.year,
        },
      )
      .then((report) => {
        this.begeleidingsurenDeKeiThisYear = report
          .filter((row) =>
            deKeiOrganisatieonderdelen.includes(
              row.key as Organisatieonderdeel,
            ),
          )
          .reduce((acc, row) => acc + row.total, 0);
      });
  }

  private updateDeelnemersuren() {
    reportsClient
      .get(
        'reports/aanmeldingen/deelnemersuren',
        'organisatieonderdeel',
        undefined,
        {
          jaar: this.year,
        },
      )
      .then((report) => {
        this.deelnemersUrenKeiJongThisYear = report
          .filter((row) =>
            keiJongOrganisatieonderdelen.includes(
              row.key as Organisatieonderdeel,
            ),
          )
          .reduce((acc, row) => acc + row.total, 0);
      });
  }

  private updateVormingsuren() {
    reportsClient
      .get(
        'reports/activiteiten/vormingsuren',
        'organisatieonderdeel',
        undefined,
        {
          jaar: this.year,
        },
      )
      .then((report) => {
        this.vormingsurenDeKeiThisYear = report
          .filter((row) =>
            deKeiOrganisatieonderdelen.includes(
              row.key as Organisatieonderdeel,
            ),
          )
          .reduce((acc, row) => acc + row.total, 0);
      });
  }
}
