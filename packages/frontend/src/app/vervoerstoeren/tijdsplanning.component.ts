import {
  Adres,
  Locatie,
  UpsertableVervoerstoer,
  Vervoerstoer,
  VervoerstoerRoute,
  VervoerstoerStop,
} from '@rock-solid/shared';
import { html, nothing, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { fullName } from '../personen/persoon.pipe';
import { RockElement } from '../rock-element';
import { bootstrap } from '../../styles';
import { vervoerstoerService } from './vervoerstoer.service';
import type { KaartRoute } from './vervoerstoer-kaart.component';

function formatAdres(adres: Adres): string {
  return `${adres.straatnaam} ${adres.huisnummer}, ${adres.plaats.postcode} ${adres.plaats.gemeente}, België`;
}

function formatLocatieAdres(locatie: Locatie): string {
  return locatie.adres ? formatAdres(locatie.adres) : locatie.naam;
}

function formatBestemming(bestemming?: Locatie): string {
  if (!bestemming) return '';
  return formatLocatieAdres(bestemming);
}

const pad = (n: number) => String(n).padStart(2, '0');

function toTimeValue(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromTimeValue(timeStr: string, baseDatum: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(baseDatum);
  d.setHours(hours!, minutes, 0, 0);
  return d;
}

interface ReistijdState {
  loading: boolean;
  minSeconds: number | null;
  maxSeconds: number | null;
  unavailable: boolean;
  usedAankomstTijdMs: number | null;
}

type Direction = 'heen' | 'terug';

@customElement('rock-tijdsplanning')
export class TijdsplanningComponent extends RockElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  vervoerstoer!: Vervoerstoer;

  @property({ attribute: false })
  baseDatum?: Date;

  @property({ attribute: false })
  baseDatumTerug?: Date;

  private get bestemmingLocatie(): Locatie | undefined {
    return this.vervoerstoer.bestemmingStop?.locatie;
  }

  private get sortedRoutes() {
    return [...this.vervoerstoer.routes].sort((a, b) =>
      fullName(a.chauffeur).localeCompare(fullName(b.chauffeur)),
    );
  }

  @state()
  private timings: Map<string, Date> = new Map();

  @state()
  private reistijden: Map<string, ReistijdState> = new Map();

  @state()
  private focusLegIndices: Map<string, number> = new Map();

  protected override willUpdate(changed: PropertyValues) {
    if (changed.has('vervoerstoer') || changed.has('baseDatum') || changed.has('baseDatumTerug')) {
      this.#prefillTimings();
    }
  }

  #prefillTimings() {
    for (const route of this.sortedRoutes) {
      // Heen: prefill bestemming aankomsttijd
      if (this.baseDatum) {
        const bestKey = this.timingKey('heen', route.id, 'bestemming');
        if (!this.timings.has(bestKey)) {
          const aankomstTijd = new Date(this.baseDatum);
          this.timings = new Map(this.timings).set(bestKey, aankomstTijd);
          this.#recalculateLeg('heen', route, 'bestemming', aankomstTijd);
        }
      }
      // Heen: prefill vertrekTijd
      if (route.vertrekTijd) {
        const vertrekKey = this.timingKey('heen', route.id, 'vertrek');
        if (!this.timings.has(vertrekKey)) {
          this.timings = new Map(this.timings).set(vertrekKey, route.vertrekTijd);
        }
      }
      // Terug: prefill bestemming vertrektijd
      const terugDatum = this.baseDatumTerug ?? this.baseDatum;
      if (terugDatum) {
        const bestKey = this.timingKey('terug', route.id, 'bestemming');
        if (!this.timings.has(bestKey)) {
          const vertrekTijd = new Date(terugDatum);
          this.timings = new Map(this.timings).set(bestKey, vertrekTijd);
          this.#recalculateLegTerug(route, 'bestemming', vertrekTijd);
        }
      }
      // Terug: prefill vertrekTijdTerug (aankomst thuis)
      if (route.vertrekTijdTerug) {
        const key = this.timingKey('terug', route.id, 'vertrek');
        if (!this.timings.has(key)) {
          this.timings = new Map(this.timings).set(key, route.vertrekTijdTerug);
        }
      }
      // Prefill opgeslagen stop-tijden (heen + terug)
      for (const stop of route.stops) {
        if (stop.geplandeAankomst) {
          const key = this.timingKey('heen', route.id, stop.id);
          if (!this.timings.has(key)) {
            this.timings = new Map(this.timings).set(key, stop.geplandeAankomst);
          }
        }
        if (stop.geplandeAankomstTerug) {
          const key = this.timingKey('terug', route.id, stop.id);
          if (!this.timings.has(key)) {
            this.timings = new Map(this.timings).set(key, stop.geplandeAankomstTerug);
          }
        }
      }
    }
  }

  private reistijdKey(dir: Direction, routeId: number, fromStopIndex: number): string {
    return `${dir}-${routeId}-${fromStopIndex}`;
  }

  private timingKey(
    dir: Direction,
    routeId: number,
    stopId: number | 'bestemming' | 'vertrek',
  ): string {
    return `${dir}-${routeId}-${stopId}`;
  }

  private getTiming(
    dir: Direction,
    routeId: number,
    stopId: number | 'bestemming' | 'vertrek',
  ): Date | undefined {
    return this.timings.get(this.timingKey(dir, routeId, stopId));
  }

  private setTiming(
    dir: Direction,
    routeId: number,
    stopId: number | 'bestemming' | 'vertrek',
    date: Date,
  ) {
    this.timings = new Map(this.timings).set(this.timingKey(dir, routeId, stopId), date);
  }

  private setTimingAndRecalculate(
    dir: Direction,
    route: VervoerstoerRoute,
    stopId: number | 'bestemming' | 'vertrek',
    date: Date,
  ) {
    this.setTiming(dir, route.id, stopId, date);
    if (stopId === 'vertrek') return;
    if (dir === 'heen') {
      this.#recalculateLeg('heen', route, stopId, date);
    } else {
      this.#recalculateLegTerug(route, stopId, date);
    }
  }

  // Heenweg: work backwards from bestemming
  #recalculateLeg(
    dir: Direction,
    route: VervoerstoerRoute,
    toStopId: number | 'bestemming',
    aankomstTijd: Date,
  ) {
    const destination = formatBestemming(this.bestemmingLocatie);
    if (!destination) return;
    let fromStopIndex: number;
    let fromAddr: string;
    let toAddr: string;

    if (toStopId === 'bestemming') {
      const lastStop = route.stops[route.stops.length - 1];
      if (!lastStop) return;
      fromStopIndex = route.stops.length - 1;
      fromAddr = formatLocatieAdres(lastStop.locatie);
      toAddr = destination;
    } else {
      const stopIndex = route.stops.findIndex((s) => s.id === toStopId);
      if (stopIndex === -1) return;
      toAddr = formatLocatieAdres(route.stops[stopIndex]!.locatie);
      if (stopIndex === 0) {
        fromStopIndex = -1;
        const chauffeurAdres = route.chauffeur.verblijfadres;
        fromAddr = chauffeurAdres
          ? formatAdres(chauffeurAdres)
          : 'Ter Rivierenlaan 152, 2100 Deurne';
      } else {
        fromStopIndex = stopIndex - 1;
        fromAddr = formatLocatieAdres(route.stops[stopIndex - 1]!.locatie);
      }
    }

    this.berekenReistijd(dir, route.id, fromStopIndex, fromAddr, toAddr, aankomstTijd);
  }

  // Terugweg: work forwards from bestemming
  #recalculateLegTerug(
    route: VervoerstoerRoute,
    fromStopId: number | 'bestemming',
    vertrekTijd: Date,
  ) {
    const destination = formatBestemming(this.bestemmingLocatie);
    if (!destination) return;
    let fromStopIndex: number;
    let fromAddr: string;
    let toAddr: string;

    if (fromStopId === 'bestemming') {
      const lastStop = route.stops[route.stops.length - 1];
      if (!lastStop) return;
      fromStopIndex = route.stops.length - 1;
      fromAddr = destination;
      toAddr = formatLocatieAdres(lastStop.locatie);
    } else {
      const stopIndex = route.stops.findIndex((s) => s.id === fromStopId);
      if (stopIndex === -1) return;
      fromAddr = formatLocatieAdres(route.stops[stopIndex]!.locatie);
      if (stopIndex === 0) {
        fromStopIndex = -1;
        const chauffeurAdres = route.chauffeur.verblijfadres;
        toAddr = chauffeurAdres
          ? formatAdres(chauffeurAdres)
          : 'Ter Rivierenlaan 152, 2100 Deurne';
      } else {
        fromStopIndex = stopIndex - 1;
        toAddr = formatLocatieAdres(route.stops[stopIndex - 1]!.locatie);
      }
    }

    this.berekenReistijd('terug', route.id, fromStopIndex, fromAddr, toAddr, vertrekTijd);
  }

  private async berekenReistijd(
    dir: Direction,
    routeId: number,
    fromStopIndex: number,
    origin: string,
    destination: string,
    aankomstTijd?: Date,
  ) {
    const key = this.reistijdKey(dir, routeId, fromStopIndex);
    this.focusLegIndices = new Map(this.focusLegIndices).set(
      `${dir}-${routeId}`,
      fromStopIndex + 1,
    );
    const usedAankomstTijdMs = aankomstTijd?.getTime() ?? null;
    this.reistijden = new Map(this.reistijden).set(key, {
      loading: true, minSeconds: null, maxSeconds: null,
      unavailable: false, usedAankomstTijdMs,
    });
    try {
      const result = await vervoerstoerService.getReistijd(origin, destination, aankomstTijd);
      this.reistijden = new Map(this.reistijden).set(key, {
        loading: false,
        minSeconds: result.minSeconds,
        maxSeconds: result.maxSeconds,
        unavailable: result.minSeconds === null,
        usedAankomstTijdMs,
      });
    } catch {
      this.reistijden = new Map(this.reistijden).set(key, {
        loading: false, minSeconds: null, maxSeconds: null,
        unavailable: true, usedAankomstTijdMs,
      });
    }
  }

  private formatDuration(seconds: number): string {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}u${m}min` : `${h}u`;
  }

  private get allTimingsComplete(): boolean {
    return this.sortedRoutes.every((route) => {
      const hasVertrek = Boolean(this.getTiming('heen', route.id, 'vertrek'));
      const hasBestemming = Boolean(this.getTiming('heen', route.id, 'bestemming'));
      const hasVertrekTerug = Boolean(this.getTiming('terug', route.id, 'bestemming'));
      const hasAankomstTerug = Boolean(this.getTiming('terug', route.id, 'vertrek'));
      const allStopsHeen = route.stops.every((s) => Boolean(this.getTiming('heen', route.id, s.id)));
      const allStopsTerug = route.stops.every((s) => Boolean(this.getTiming('terug', route.id, s.id)));
      return hasVertrek && hasBestemming && hasVertrekTerug && hasAankomstTerug && allStopsHeen && allStopsTerug;
    });
  }

  private buildUpsertable(): UpsertableVervoerstoer {
    return {
      projectIds: this.vervoerstoer.projectIds,
      datum: this.vervoerstoer.datum,
      datumTerug: this.vervoerstoer.datumTerug,
      toeTeKennenStops: this.vervoerstoer.toeTeKennenStops,
      bestemmingStop: this.vervoerstoer.bestemmingStop,
      routes: this.vervoerstoer.routes.map((route) => ({
        id: route.id,
        chauffeur: route.chauffeur,
        vertrekTijd:
          this.getTiming('heen', route.id, 'vertrek') ?? route.vertrekTijd,
        vertrekTijdTerug:
          this.getTiming('terug', route.id, 'vertrek') ?? route.vertrekTijdTerug,
        stops: route.stops.map((stop) => ({
          id: stop.id,
          locatie: stop.locatie,
          volgnummer: stop.volgnummer,
          aanmeldersOpTePikken: stop.aanmeldersOpTePikken,
          geplandeAankomst:
            this.getTiming('heen', route.id, stop.id) ?? stop.geplandeAankomst,
          geplandeAankomstTerug:
            this.getTiming('terug', route.id, stop.id) ?? stop.geplandeAankomstTerug,
        })),
      })),
    };
  }

  private save() {
    this.dispatchEvent(
      new CustomEvent<UpsertableVervoerstoer>('vervoerstoer-save-requested', {
        detail: this.buildUpsertable(),
        bubbles: true,
        composed: true,
      }),
    );
  }

  private saveAndView() {
    this.dispatchEvent(
      new CustomEvent<UpsertableVervoerstoer>('vervoerstoer-saved', {
        detail: this.buildUpsertable(),
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Render a leg row between two stops.
   * @param aboveStopId - the stop above this leg (closer to bestemming)
   * @param belowStopId - the stop below this leg (closer to home)
   * For heenweg: above = destination end, below = origin end (suggest time for below based on above - reistijd)
   * For terugweg: above = origin end, below = destination end (suggest time for below based on above + reistijd)
   */
  private renderLegRow(
    dir: Direction,
    route: VervoerstoerRoute,
    fromStopIndex: number,
    aboveStopId: number | 'bestemming',
    belowStopId?: number | 'vertrek',
  ) {
    const key = this.reistijdKey(dir, route.id, fromStopIndex);
    const isHeen = dir === 'heen';
    // For heen: the "known" time is above (arrival at destination side), suggest below
    // For terug: the "known" time is above (departure from destination side), suggest below
    const aboveTiming = this.getTiming(dir, route.id, aboveStopId);
    const rawReistijd = this.reistijden.get(key);
    const reistijdVerlopen =
      rawReistijd &&
      !rawReistijd.loading &&
      rawReistijd.usedAankomstTijdMs !== (aboveTiming?.getTime() ?? null);
    const reistijd = reistijdVerlopen ? undefined : rawReistijd;

    const suggestedTime =
      reistijd && !reistijd.loading && !reistijd.unavailable && aboveTiming
        ? isHeen
          ? new Date(aboveTiming.getTime() - reistijd.maxSeconds! * 1000)
          : new Date(aboveTiming.getTime() + reistijd.maxSeconds! * 1000)
        : null;

    return html`
      <div class="d-flex align-items-center gap-2 my-1 text-muted small">
        <span>${isHeen ? '↑' : '↓'}</span>
        ${reistijd
          ? reistijd.loading
            ? html`<span>Berekenen...</span>`
            : reistijd.unavailable
              ? html`<span class="text-warning">Reistijd niet beschikbaar</span>`
              : html`<span>${this.formatDuration(reistijd.minSeconds!)} – ${this.formatDuration(reistijd.maxSeconds!)}</span>`
          : nothing}
        ${suggestedTime && belowStopId !== undefined
          ? html`<button
              class="btn btn-sm btn-outline-info ms-2"
              title="Gebruik gesuggereerde tijd"
              @click=${() =>
                this.setTimingAndRecalculate(dir, route, belowStopId, suggestedTime)}
            >
              ${isHeen ? '←' : '→'} ${toTimeValue(suggestedTime)}
            </button>`
          : nothing}
      </div>
    `;
  }

  private renderTimeInput(
    dir: Direction,
    route: VervoerstoerRoute,
    stopId: number | 'bestemming' | 'vertrek',
    label: string,
  ) {
    const baseDatum = dir === 'heen' ? this.baseDatum : (this.baseDatumTerug ?? this.baseDatum);
    const existing = this.getTiming(dir, route.id, stopId);
    const val = existing ? toTimeValue(existing) : '';
    return html`<label class="mb-0 d-flex align-items-center gap-2 text-nowrap">
      ${label}
      <input
        type="time"
        class="form-control form-control-sm"
        style="width:auto"
        .value=${val}
        @change=${(e: Event) => {
          const v = (e.target as HTMLInputElement).value;
          if (v && baseDatum)
            this.setTimingAndRecalculate(dir, route, stopId, fromTimeValue(v, baseDatum));
        }}
      />
    </label>`;
  }

  override render() {
    const destination = formatBestemming(this.bestemmingLocatie);
    return html`
      <h3>Tijdsplanning</h3>
      ${this.sortedRoutes.map((route) => {
        const stopsDesc = [...route.stops].reverse();
        const stopsAsc = route.stops;

        return html`
          <div class="card mb-4">
            <div class="card-header">
              <strong>Chauffeur: ${fullName(route.chauffeur)}</strong>
              ${!route.chauffeur.verblijfadres
                ? html`<span class="badge text-bg-warning ms-2">⚠ Geen adres, fallback gebruikt</span>`
                : nothing}
              &nbsp;— Bestemming: ${destination || '(onbekend)'}
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-7">
                  ${this.#renderCombinedSchedule(route, stopsDesc, destination)}
                </div>
                <div class="col-md-5">
                  <rock-vervoerstoer-kaart
                    .routes=${[
                      {
                        naam: fullName(route.chauffeur),
                        startAdres: route.chauffeur.verblijfadres,
                        tussenstops: route.stops.map((s) => s.locatie),
                      } satisfies KaartRoute,
                    ]}
                    .bestemming=${destination}
                    .focusLegIndex=${this.focusLegIndices.get(`heen-${route.id}`) ?? null}
                  ></rock-vervoerstoer-kaart>
                </div>
              </div>
            </div>
          </div>
        `;
      })}
      <div class="d-flex gap-3">
        <button class="btn btn-secondary" @click=${() => this.save()}>
          <rock-icon icon="floppy"></rock-icon> Opslaan
        </button>
        <button
          class="btn btn-primary"
          @click=${() => this.saveAndView()}
          ?disabled=${!this.allTimingsComplete}
        >
          <rock-icon icon="printer"></rock-icon> Opslaan en bekijken
        </button>
      </div>
    `;
  }

  #renderCombinedSchedule(route: VervoerstoerRoute, stopsDesc: VervoerstoerStop[], destination: string) {
    // stopsDesc: from bestemming → home (reversed order)
    // Terugweg uses same visual order: bestemming top, home bottom
    // But terugweg stops are in ascending order (0, 1, 2...) which maps to stopsDesc reversed
    return html`
      <div class="row mb-1">
        <div class="col"><strong>Heenweg</strong></div>
        <div class="col"></div>
        <div class="col"><strong>Terugweg</strong></div>
      </div>
      <!-- Bestemming -->
      <div class="row align-items-center mb-2">
        <div class="col text-end">
          ${this.renderTimeInput('heen', route, 'bestemming', 'Aankomst:')}
        </div>
        <div class="col text-center">
          <span class="badge me-1 bg-primary">${String.fromCharCode(66 + route.stops.length)}</span>
          <span class="fw-bold">Bestemming: ${destination || '(onbekend)'}</span>
        </div>
        <div class="col">
          ${this.renderTimeInput('terug', route, 'bestemming', 'Vertrek:')}
        </div>
      </div>
      <!-- Stops (van bestemming naar huis) -->
      ${stopsDesc.map((stop, idx) => {
        const isLastStop = idx === stopsDesc.length - 1;
        const nextStopHeen = idx === 0 ? null : stopsDesc[idx - 1];
        const originalIndex = route.stops.length - 1 - idx;
        // Terugweg: same stop but in reverse direction
        const terugIdx = route.stops.length - 1 - idx;
        const prevStopTerug = terugIdx === 0 ? null : route.stops[terugIdx - 1];

        return html`
          <!-- Leg rows -->
          <div class="row">
            <div class="col text-end">
              ${this.renderLegRow('heen', route, originalIndex,
                idx === 0 ? 'bestemming' : (nextStopHeen?.id ?? 'bestemming'), stop.id)}
            </div>
            <div class="col"></div>
            <div class="col">
              ${this.renderLegRow('terug', route,
                originalIndex,
                idx === 0 ? 'bestemming' : (stopsDesc[idx - 1]?.id ?? 'bestemming'),
                stop.id)}
            </div>
          </div>
          <!-- Stop row -->
          <div class="row align-items-center mb-1">
            <div class="col text-end">
              ${this.renderTimeInput('heen', route, stop.id, 'Aankomst:')}
            </div>
            <div class="col text-center">
              <span class="badge me-1 bg-primary">${String.fromCharCode(66 + originalIndex)}</span>
              <span class="fw-bold">${stop.locatie.naam}</span>
            </div>
            <div class="col">
              ${this.renderTimeInput('terug', route, stop.id, 'Aankomst:')}
            </div>
          </div>
          ${isLastStop
            ? html`
                <!-- Last leg to vertrek/home -->
                <div class="row">
                  <div class="col text-end">
                    ${this.renderLegRow('heen', route, -1, stop.id, 'vertrek')}
                  </div>
                  <div class="col"></div>
                  <div class="col">
                    ${this.renderLegRow('terug', route, -1, stop.id, 'vertrek')}
                  </div>
                </div>
                <div class="row align-items-center mb-1">
                  <div class="col text-end">
                    ${this.renderTimeInput('heen', route, 'vertrek', 'Vertrek:')}
                  </div>
                  <div class="col text-center">
                    <span class="badge me-1 bg-primary">A</span>
                    <span class="fw-bold">Thuis</span>
                  </div>
                  <div class="col">
                    ${this.renderTimeInput('terug', route, 'vertrek', 'Aankomst:')}
                  </div>
                </div>
              `
            : nothing}
        `;
      })}
    `;
  }
}
