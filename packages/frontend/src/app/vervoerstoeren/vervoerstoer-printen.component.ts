import {
  Vervoerstoer,
  VervoerstoerRoute,
  VervoerstoerStop,
} from '@rock-solid/shared';
import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { RockElement } from '../rock-element';
import { fullName } from '../personen/persoon.pipe';
import { bootstrap } from '../../styles';
import { showAdres } from '../shared';

const pad = (n: number) => String(n).padStart(2, '0');

function formatTijd(date: Date | undefined): string {
  if (!date) return '';
  return `${pad(date.getHours())}u${pad(date.getMinutes())}`;
}

function formatDatum(date: Date | undefined): string {
  if (!date) return '';
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

@customElement('rock-vervoerstoer-printen')
export class VervoerstoerPrintenComponent extends RockElement {
  static override styles = [
    bootstrap,
    css`
      @media print {
        :host {
          font-size: 10pt;
        }
        .no-print {
          display: none !important;
        }
      }
      table {
        border-collapse: collapse;
      }
      td,
      th {
        border: 2px solid black;
        padding: 4px 8px;
        vertical-align: top;
      }
      .route-table {
        display: inline-table;
        vertical-align: top;
      }
    `,
  ];

  @property({ attribute: false })
  vervoerstoer!: Vervoerstoer;

  private get sortedRoutes() {
    return [...this.vervoerstoer.routes].sort((a, b) =>
      fullName(a.chauffeur).localeCompare(fullName(b.chauffeur)),
    );
  }

  override render() {
    const datumHeen = formatDatum(this.vervoerstoer.datum);
    const datumTerug = formatDatum(this.vervoerstoer.datumTerug);
    const bestemming = this.vervoerstoer.bestemmingStop;

    return html`<div data-bs-theme="light">
      <button
        class="btn btn-primary mb-3 no-print"
        @click=${() => window.print()}
      >
        <rock-icon icon="printer"></rock-icon> Printen
      </button>
      <div class="d-flex flex-wrap gap-4">
        ${this.sortedRoutes.map((route) =>
          this.#renderRoute(route, datumHeen, datumTerug, bestemming),
        )}
      </div>
    </div>`;
  }

  #renderRoute(
    route: VervoerstoerRoute,
    datumHeen: string,
    datumTerug: string,
    bestemming?: VervoerstoerStop,
  ) {
    // Stops in de volgorde van heen (van huis naar bestemming)
    const stopsAsc = [...route.stops].sort(
      (a, b) => a.volgnummer - b.volgnummer,
    );
    // Stops voor terugweg: van bestemming naar huis (omgekeerde volgorde)
    const stopsDesc = [...stopsAsc].reverse();

    return html`
      <table class="route-table">
        <thead>
          <tr>
            <th>HEEN<br />${datumHeen}</th>
            <th>
              ${fullName(route.chauffeur)}
              (${route.stops.reduce(
                (sum, s) => sum + s.aanmeldersOpTePikken.length,
                0,
              )})
            </th>
            <th>TERUG<br />${datumTerug}</th>
          </tr>
        </thead>
        <tbody>
          ${stopsAsc.map(
            (stop, idx) => html`
              <tr>
                <td>${formatTijd(stop.geplandeAankomst)}</td>
                <td>${this.#renderStopContent(stop)}</td>
                <td>${formatTijd(stopsDesc[idx]?.geplandeAankomstTerug)}</td>
              </tr>
            `,
          )}
          ${bestemming
            ? html`<tr>
                <td>${formatTijd(route.vertrekTijd)}</td>
                <td>
                  <strong>${bestemming.locatie.naam}</strong>
                  ${bestemming.locatie.adres
                    ? html`<br />Adres: ${showAdres(bestemming.locatie.adres)}`
                    : nothing}
                </td>
                <td>${formatTijd(route.vertrekTijdTerug)}</td>
              </tr>`
            : nothing}
        </tbody>
      </table>
    `;
  }

  #renderStopContent(stop: VervoerstoerStop) {
    return html`
      <strong>${stop.locatie.naam}</strong>
      ${stop.locatie.adres
        ? html`<br />Adres: ${showAdres(stop.locatie.adres)}`
        : stop.locatie.gpsBeschrijving
          ? html`<br />GPS: ${stop.locatie.gpsBeschrijving}`
          : nothing}
      ${stop.aanmeldersOpTePikken.length > 0
        ? html`<ul class="mb-0 mt-1">
            ${stop.aanmeldersOpTePikken.map(
              (a) =>
                html`<li>
                  ${a.deelnemer ? fullName(a.deelnemer) : `Aanmelding ${a.id}`}
                </li>`,
            )}
          </ul>`
        : nothing}
    `;
  }
}
