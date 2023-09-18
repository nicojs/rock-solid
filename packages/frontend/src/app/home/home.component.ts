import { LitElement, PropertyValueMap, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { bootstrap } from '../../styles';
import { restClient } from '../shared';
import { reportsClient } from '../rapportages/reports-client';
import { Organisatieonderdeel } from '@rock-solid/shared';

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

  private year = new Date().getFullYear();

  public override firstUpdated(): void {
    this.updateDeelnemersuren();
    this.updateBegeleidingsuren();
  }

  public override render() {
    const colClass = 'col-6 col-md-3';
    return html`<div class="container-fluid">
      <div class="row">
        <h2 class="col display-1">
          Rock Solid.
          <span class="text-muted fs-4"
            >Steenvast en solide management systeem voor De Kei en
            Kei-Jong</span
          >
        </h2>
      </div>
      <div class="row">
        <div class="card ${colClass}">
          <div class="card-header">Deelnemersuren Kei-Jong</div>
          <div class="card-body">
            <h5 class="card-title">
              <span class="text-success"
                >${this.deelnemersUrenKeiJongThisYear}</span
              >
              deelnemersuren in ${this.year}
            </h5>
            <p class="card-text">
              Deelnemersuren voor Kei-Jong in ${this.year}
            </p>
            <rock-link href="/cursussen" btn btnPrimary
              >Naar cursussen</rock-link
            >
          </div>
        </div>
        <img class="${colClass}" src="/rock-solid.png" />
        <div class="card ${colClass}">
          <div class="card-header">Begeleidingsuren De Kei</div>
          <div class="card-body">
            <h5 class="card-title">
              <span class="text-success"
                >${this.begeleidingsurenDeKeiThisYear}</span
              >
              begeleidingsuren in ${this.year}
            </h5>
            <p class="card-text">Begeleidingsuren De Kei in ${this.year}</p>
            <rock-link href="/cursussen" btn btnPrimary
              >Naar cursussen</rock-link
            >
          </div>
        </div>
      </div>
    </div>`;
  }

  private updateDeelnemersuren() {
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

  private updateBegeleidingsuren() {
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
}
