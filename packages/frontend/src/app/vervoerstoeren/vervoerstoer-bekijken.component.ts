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

@customElement('rock-vervoerstoer-bekijken')
export class VervoerstoerPrintenComponent extends RockElement {
  static override styles = [
    bootstrap,
    css`
      @media print {
        :host {
          font-size: 10pt;
          color: rgb(33, 37, 41);
        }
        .table td,
        .table th {
          color: rgb(33, 37, 41) !important;
        }
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

    return html`<div>
      <button
        class="btn btn-primary mb-3 d-print-none"
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
      <table class="table">
        <thead>
          <tr>
            <th class="border border-2 px-1 py-2 align-top">
              HEEN<br />${datumHeen}
            </th>
            <th class="border border-2 px-1 py-2 align-top">
              ${fullName(route.chauffeur)}
              (${route.stops.reduce(
                (sum, s) => sum + s.aanmeldersOpTePikken.length,
                0,
              )})
            </th>
            <th class="border border-2 px-1 py-2 align-top">
              TERUG<br />${datumTerug}
            </th>
          </tr>
        </thead>
        <tbody>
          ${stopsAsc.map(
            (stop, idx) => html`
              <tr>
                <td class="border border-2 px-1 py-2 align-top">
                  ${formatTijd(stop.geplandeAankomst)}
                </td>
                <td class="border border-2 px-1 py-2 align-top">
                  ${this.#renderStopContent(stop)}
                </td>
                <td class="border border-2 px-1 py-2 align-top">
                  ${formatTijd(stopsDesc[idx]?.geplandeAankomstTerug)}
                </td>
              </tr>
            `,
          )}
          ${bestemming
            ? html`<tr>
                <td class="border border-2 px-1 py-2 align-top">
                  ${formatTijd(route.vertrekTijd)}
                </td>
                <td class="border border-2 px-1 py-2 align-top">
                  <strong>${bestemming.locatie.naam}</strong>
                  ${bestemming.locatie.adres
                    ? html`<br />Adres: ${showAdres(bestemming.locatie.adres)}`
                    : nothing}
                </td>
                <td class="border border-2 px-1 py-2 align-top">
                  ${formatTijd(route.vertrekTijdTerug)}
                </td>
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
