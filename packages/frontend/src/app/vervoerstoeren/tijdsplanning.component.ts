import {
  Adres,
  Locatie,
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

function formatDatum(date: Date | undefined): string {
  if (!date) return '';
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

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
  usedTimingMs: number | null;
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

  // Bestemming timings are not stored on the vervoerstoer model, so keep them as local state per route
  @state()
  private bestemmingAankomst: Map<number, Date> = new Map();
  @state()
  private bestemmingVertrek: Map<number, Date> = new Map();

  @state()
  private reistijden: Map<string, ReistijdState> = new Map();

  @state()
  private focusLegIndices: Map<number, number> = new Map();

  protected override willUpdate(changed: PropertyValues) {
    if (changed.has('vervoerstoer') || changed.has('baseDatum') || changed.has('baseDatumTerug')) {
      this.#prefillTimings();
    }
  }

  #prefillTimings() {
    for (const route of this.sortedRoutes) {
      // Heen: prefill bestemming aankomsttijd
      if (this.baseDatum && !this.bestemmingAankomst.has(route.id)) {
        const aankomstTijd = new Date(this.baseDatum);
        this.bestemmingAankomst = new Map(this.bestemmingAankomst).set(route.id, aankomstTijd);
        this.#recalculateLeg('heen', route, 'bestemming', aankomstTijd);
      }
      // Terug: prefill bestemming vertrektijd
      const terugDatum = this.baseDatumTerug ?? this.baseDatum;
      if (terugDatum && !this.bestemmingVertrek.has(route.id)) {
        const vertrekTijd = new Date(terugDatum);
        this.bestemmingVertrek = new Map(this.bestemmingVertrek).set(route.id, vertrekTijd);
        this.#recalculateLegTerug(route, 'bestemming', vertrekTijd);
      }
    }
  }

  private getTiming(dir: Direction, route: VervoerstoerRoute, stopId: number | 'bestemming' | 'vertrek'): Date | undefined {
    if (stopId === 'bestemming') {
      return dir === 'heen' ? this.bestemmingAankomst.get(route.id) : this.bestemmingVertrek.get(route.id);
    }
    if (stopId === 'vertrek') {
      return dir === 'heen' ? route.vertrekTijd : route.vertrekTijdTerug;
    }
    const stop = route.stops.find((s) => s.id === stopId);
    return dir === 'heen' ? stop?.geplandeAankomst : stop?.geplandeAankomstTerug;
  }

  private setTiming(dir: Direction, route: VervoerstoerRoute, stopId: number | 'bestemming' | 'vertrek', date: Date) {
    if (stopId === 'bestemming') {
      if (dir === 'heen') {
        this.bestemmingAankomst = new Map(this.bestemmingAankomst).set(route.id, date);
      } else {
        this.bestemmingVertrek = new Map(this.bestemmingVertrek).set(route.id, date);
      }
      return;
    }
    if (stopId === 'vertrek') {
      if (dir === 'heen') { route.vertrekTijd = date; } else { route.vertrekTijdTerug = date; }
      this.requestUpdate();
      return;
    }
    const stop = route.stops.find((s) => s.id === stopId);
    if (!stop) return;
    if (dir === 'heen') { stop.geplandeAankomst = date; } else { stop.geplandeAankomstTerug = date; }
    this.requestUpdate();
  }

  private setTimingAndRecalculate(dir: Direction, route: VervoerstoerRoute, stopId: number | 'bestemming' | 'vertrek', date: Date) {
    this.setTiming(dir, route, stopId, date);
    if (stopId === 'vertrek') return;
    if (dir === 'heen') {
      this.#recalculateLeg('heen', route, stopId, date);
    } else {
      this.#recalculateLegTerug(route, stopId, date);
    }
  }

  private reistijdKey(dir: Direction, routeId: number, fromStopIndex: number): string {
    return `${dir}-${routeId}-${fromStopIndex}`;
  }

  #recalculateLeg(dir: Direction, route: VervoerstoerRoute, toStopId: number | 'bestemming', aankomstTijd: Date) {
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
        fromAddr = chauffeurAdres ? formatAdres(chauffeurAdres) : 'Ter Rivierenlaan 152, 2100 Deurne';
      } else {
        fromStopIndex = stopIndex - 1;
        fromAddr = formatLocatieAdres(route.stops[stopIndex - 1]!.locatie);
      }
    }

    this.berekenReistijd(dir, route.id, fromStopIndex, fromAddr, toAddr, aankomstTijd);
  }

  #recalculateLegTerug(route: VervoerstoerRoute, fromStopId: number | 'bestemming', vertrekTijd: Date) {
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
        toAddr = chauffeurAdres ? formatAdres(chauffeurAdres) : 'Ter Rivierenlaan 152, 2100 Deurne';
      } else {
        fromStopIndex = stopIndex - 1;
        toAddr = formatLocatieAdres(route.stops[stopIndex - 1]!.locatie);
      }
    }

    this.berekenReistijd('terug', route.id, fromStopIndex, fromAddr, toAddr, vertrekTijd);
  }

  private async berekenReistijd(dir: Direction, routeId: number, fromStopIndex: number, origin: string, destination: string, timing?: Date) {
    const key = this.reistijdKey(dir, routeId, fromStopIndex);
    this.focusLegIndices = new Map(this.focusLegIndices).set(routeId, fromStopIndex + 1);
    const usedTimingMs = timing?.getTime() ?? null;
    this.reistijden = new Map(this.reistijden).set(key, {
      loading: true, minSeconds: null, maxSeconds: null, unavailable: false, usedTimingMs,
    });
    try {
      const result = await vervoerstoerService.getReistijd(origin, destination, timing);
      this.reistijden = new Map(this.reistijden).set(key, {
        loading: false, minSeconds: result.minSeconds, maxSeconds: result.maxSeconds,
        unavailable: result.minSeconds === null, usedTimingMs,
      });
    } catch {
      this.reistijden = new Map(this.reistijden).set(key, {
        loading: false, minSeconds: null, maxSeconds: null, unavailable: true, usedTimingMs,
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
      const hasVertrek = Boolean(route.vertrekTijd);
      const hasBestemming = Boolean(this.bestemmingAankomst.get(route.id));
      const hasVertrekTerug = Boolean(this.bestemmingVertrek.get(route.id));
      const hasAankomstTerug = Boolean(route.vertrekTijdTerug);
      const allStopsHeen = route.stops.every((s) => Boolean(s.geplandeAankomst));
      const allStopsTerug = route.stops.every((s) => Boolean(s.geplandeAankomstTerug));
      return hasVertrek && hasBestemming && hasVertrekTerug && hasAankomstTerug && allStopsHeen && allStopsTerug;
    });
  }

  private emitSave(eventName: string) {
    this.dispatchEvent(
      new CustomEvent<Vervoerstoer>(eventName, {
        detail: this.vervoerstoer,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private renderLegRow(
    dir: Direction, route: VervoerstoerRoute, fromStopIndex: number,
    aboveStopId: number | 'bestemming', belowStopId?: number | 'vertrek',
  ) {
    const key = this.reistijdKey(dir, route.id, fromStopIndex);
    const isHeen = dir === 'heen';
    const aboveTiming = this.getTiming(dir, route, aboveStopId);
    const rawReistijd = this.reistijden.get(key);
    const reistijdVerlopen = rawReistijd && !rawReistijd.loading &&
      rawReistijd.usedTimingMs !== (aboveTiming?.getTime() ?? null);
    const reistijd = reistijdVerlopen ? undefined : rawReistijd;

    const suggestedTime = reistijd && !reistijd.loading && !reistijd.unavailable && aboveTiming
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
          ? html`<button class="btn btn-sm btn-outline-info ms-2" title="Gebruik gesuggereerde tijd"
              @click=${() => this.setTimingAndRecalculate(dir, route, belowStopId, suggestedTime)}>
              ${isHeen ? '←' : '→'} ${toTimeValue(suggestedTime)}
            </button>`
          : nothing}
      </div>
    `;
  }

  private renderTimeInput(dir: Direction, route: VervoerstoerRoute, stopId: number | 'bestemming' | 'vertrek', label: string) {
    const baseDatum = dir === 'heen' ? this.baseDatum : (this.baseDatumTerug ?? this.baseDatum);
    const existing = this.getTiming(dir, route, stopId);
    const val = existing ? toTimeValue(existing) : '';
    return html`<label class="mb-0 d-flex align-items-center gap-2 text-nowrap">
      ${label}
      <input type="time" class="form-control form-control-sm" style="width:auto" .value=${val}
        @change=${(e: Event) => {
          const v = (e.target as HTMLInputElement).value;
          if (v && baseDatum) this.setTimingAndRecalculate(dir, route, stopId, fromTimeValue(v, baseDatum));
        }}
      />
    </label>`;
  }

  override render() {
    const destination = formatBestemming(this.bestemmingLocatie);
    return html`
      <details class="alert alert-info">
        <summary>Uitleg</summary>
        <p>Hier kun je de tijdsplanning invullen voor de heen- en terugweg.</p>
        <ol>
          <li>Vul de <strong>aankomsttijd bij de bestemming</strong> in. De reistijd naar de vorige stop wordt automatisch berekend.</li>
          <li>Gebruik de lichtblauwe knoppen om de gesuggereerde tijden over te nemen. Werk zo van boven naar beneden.</li>
          <li>Vul voor de terugweg de <strong>vertrektijd vanaf de bestemming</strong> in. De aankomsttijden bij de stops worden weer automatisch gesuggereerd.</li>
          <li>Klik op 'Opslaan en bekijken' als alle tijden zijn ingevuld om de printweergave te openen.</li>
        </ol>
      </details>
      <h3>Tijdsplanning</h3>
      ${this.sortedRoutes.map((route) => {
        const stopsDesc = [...route.stops].reverse();
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
                    .routes=${[{ naam: fullName(route.chauffeur), startAdres: route.chauffeur.verblijfadres, tussenstops: route.stops.map((s) => s.locatie) } satisfies KaartRoute]}
                    .bestemming=${destination}
                    .focusLegIndex=${this.focusLegIndices.get(route.id) ?? null}
                  ></rock-vervoerstoer-kaart>
                </div>
              </div>
            </div>
          </div>
        `;
      })}
      <div class="d-flex gap-3">
        <button class="btn btn-secondary" @click=${() => this.emitSave('vervoerstoer-save-requested')}>
          <rock-icon icon="floppy"></rock-icon> Opslaan
        </button>
        <button class="btn btn-primary" @click=${() => this.emitSave('vervoerstoer-saved')} ?disabled=${!this.allTimingsComplete}>
          <rock-icon icon="printer"></rock-icon> Opslaan en bekijken
        </button>
      </div>
    `;
  }

  #renderCombinedSchedule(route: VervoerstoerRoute, stopsDesc: VervoerstoerStop[], destination: string) {
    return html`
      <div class="row mb-1">
        <div class="col"><strong>Heenweg ${formatDatum(this.vervoerstoer.datum)}</strong></div>
        <div class="col"></div>
        <div class="col"><strong>Terugweg ${formatDatum(this.vervoerstoer.datumTerug)}</strong></div>
      </div>
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
      ${stopsDesc.map((stop, idx) => {
        const isLastStop = idx === stopsDesc.length - 1;
        const nextStopHeen = idx === 0 ? null : stopsDesc[idx - 1];
        const originalIndex = route.stops.length - 1 - idx;

        return html`
          <div class="row">
            <div class="col text-end">
              ${this.renderLegRow('heen', route, originalIndex,
                idx === 0 ? 'bestemming' : (nextStopHeen?.id ?? 'bestemming'), stop.id)}
            </div>
            <div class="col"></div>
            <div class="col">
              ${this.renderLegRow('terug', route, originalIndex,
                idx === 0 ? 'bestemming' : (stopsDesc[idx - 1]?.id ?? 'bestemming'), stop.id)}
            </div>
          </div>
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
          ${isLastStop ? html`
            <div class="row">
              <div class="col text-end">${this.renderLegRow('heen', route, -1, stop.id, 'vertrek')}</div>
              <div class="col"></div>
              <div class="col">${this.renderLegRow('terug', route, -1, stop.id, 'vertrek')}</div>
            </div>
            <div class="row align-items-center mb-1">
              <div class="col text-end">${this.renderTimeInput('heen', route, 'vertrek', 'Vertrek:')}</div>
              <div class="col text-center">
                <span class="badge me-1 bg-primary">A</span>
                <span class="fw-bold">Thuis</span>
              </div>
              <div class="col">${this.renderTimeInput('terug', route, 'vertrek', 'Aankomst:')}</div>
            </div>
          ` : nothing}
        `;
      })}
    `;
  }
}
