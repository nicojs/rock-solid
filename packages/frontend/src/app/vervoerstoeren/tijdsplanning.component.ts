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

@customElement('rock-tijdsplanning')
export class TijdsplanningComponent extends RockElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  vervoerstoer!: Vervoerstoer;

  @property({ attribute: false })
  baseDatum?: Date;

  @state()
  private timings: Map<string, Date> = new Map();

  @state()
  private reistijden: Map<string, ReistijdState> = new Map();

  @state()
  private focusLegIndices: Map<number, number> = new Map();

  protected override updated(changed: PropertyValues) {
    if (changed.has('vervoerstoer') || changed.has('baseDatum')) {
      this.#prefillTimings();
    }
  }

  #prefillTimings() {
    for (const route of this.vervoerstoer.routes) {
      // Prefill bestemming aankomsttijd from activity start date
      if (this.baseDatum) {
        const bestKey = this.timingKey(route.id, 'bestemming');
        if (!this.timings.has(bestKey)) {
          const aankomstTijd = new Date(this.baseDatum);
          this.timings = new Map(this.timings).set(bestKey, aankomstTijd);
          this.#recalculateLeg(route, 'bestemming', aankomstTijd);
        }
      }
      // Prefill vertrekTijd
      if (route.vertrekTijd) {
        const vertrekKey = this.timingKey(route.id, 'vertrek');
        if (!this.timings.has(vertrekKey)) {
          this.timings = new Map(this.timings).set(
            vertrekKey,
            route.vertrekTijd,
          );
        }
      }
      // Prefill opgeslagen stop-tijden
      for (const stop of route.stops) {
        if (stop.geplandeAankomst) {
          const stopKey = this.timingKey(route.id, stop.id);
          if (!this.timings.has(stopKey)) {
            this.timings = new Map(this.timings).set(
              stopKey,
              stop.geplandeAankomst,
            );
          }
        }
      }
    }
  }

  private reistijdKey(routeId: number, fromStopIndex: number): string {
    return `${routeId}-${fromStopIndex}`;
  }

  private timingKey(
    routeId: number,
    stopId: number | 'bestemming' | 'vertrek',
  ): string {
    return `${routeId}-${stopId}`;
  }

  private getTiming(
    routeId: number,
    stopId: number | 'bestemming' | 'vertrek',
  ): Date | undefined {
    return this.timings.get(this.timingKey(routeId, stopId));
  }

  private setTiming(
    routeId: number,
    stopId: number | 'bestemming' | 'vertrek',
    date: Date,
  ) {
    const key = this.timingKey(routeId, stopId);
    this.timings = new Map(this.timings).set(key, date);
  }

  private setTimingAndRecalculate(
    route: VervoerstoerRoute,
    stopId: number | 'bestemming' | 'vertrek',
    date: Date,
  ) {
    this.setTiming(route.id, stopId, date);
    if (stopId === 'vertrek') return;
    this.#recalculateLeg(route, stopId, date);
  }

  #recalculateLeg(
    route: VervoerstoerRoute,
    toStopId: number | 'bestemming',
    aankomstTijd: Date,
  ) {
    const destination = formatBestemming(this.vervoerstoer.bestemming);
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

    this.berekenReistijd(
      route.id,
      fromStopIndex,
      fromAddr,
      toAddr,
      aankomstTijd,
    );
  }

  private async berekenReistijd(
    routeId: number,
    fromStopIndex: number,
    origin: string,
    destination: string,
    aankomstTijd?: Date,
  ) {
    const key = this.reistijdKey(routeId, fromStopIndex);
    this.focusLegIndices = new Map(this.focusLegIndices).set(
      routeId,
      fromStopIndex + 1,
    );
    const usedAankomstTijdMs = aankomstTijd?.getTime() ?? null;
    this.reistijden = new Map(this.reistijden).set(key, {
      loading: true,
      minSeconds: null,
      maxSeconds: null,
      unavailable: false,
      usedAankomstTijdMs,
    });
    try {
      const result = await vervoerstoerService.getReistijd(
        origin,
        destination,
        aankomstTijd,
      );
      this.reistijden = new Map(this.reistijden).set(key, {
        loading: false,
        minSeconds: result.minSeconds,
        maxSeconds: result.maxSeconds,
        unavailable: result.minSeconds === null,
        usedAankomstTijdMs,
      });
    } catch {
      this.reistijden = new Map(this.reistijden).set(key, {
        loading: false,
        minSeconds: null,
        maxSeconds: null,
        unavailable: true,
        usedAankomstTijdMs,
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

  private save() {
    const upsertable: UpsertableVervoerstoer = {
      projectIds: this.vervoerstoer.projectIds,
      routes: this.vervoerstoer.routes.map((route) => ({
        id: route.id,
        chauffeur: route.chauffeur,
        vertrekTijd:
          this.getTiming(route.id, 'vertrek') ?? route.vertrekTijd,
        stops: route.stops.map((stop) => ({
          id: stop.id,
          locatie: stop.locatie,
          volgnummer: stop.volgnummer,
          aanmeldersOpTePikken: stop.aanmeldersOpTePikken,
          geplandeAankomst:
            this.getTiming(route.id, stop.id) ?? stop.geplandeAankomst,
        })),
      })),
    };
    this.dispatchEvent(
      new CustomEvent<UpsertableVervoerstoer>('vervoerstoer-saved', {
        detail: upsertable,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private renderLegRow(
    route: VervoerstoerRoute,
    fromStopIndex: number,
    toStopId: number | 'bestemming',
    fromStopId?: number | 'vertrek',
  ) {
    const key = this.reistijdKey(route.id, fromStopIndex);
    const toTiming = this.getTiming(route.id, toStopId);
    const rawReistijd = this.reistijden.get(key);
    const reistijdVerlopen =
      rawReistijd &&
      !rawReistijd.loading &&
      rawReistijd.usedAankomstTijdMs !== (toTiming?.getTime() ?? null);
    const reistijd = reistijdVerlopen ? undefined : rawReistijd;

    const suggestedTime =
      reistijd && !reistijd.loading && !reistijd.unavailable && toTiming
        ? new Date(toTiming.getTime() - reistijd.maxSeconds! * 1000)
        : null;

    return html`
      <div class="d-flex align-items-center gap-2 my-1 ms-3 text-muted small">
        <span>↑</span>
        ${reistijd
          ? reistijd.loading
            ? html`<span>Berekenen...</span>`
            : reistijd.unavailable
              ? html`<span class="text-warning"
                  >Reistijd niet beschikbaar</span
                >`
              : html`<span
                  >${this.formatDuration(reistijd.minSeconds!)} –
                  ${this.formatDuration(reistijd.maxSeconds!)}</span
                >`
          : nothing}
        ${suggestedTime && fromStopId !== undefined
          ? html`<button
              class="btn btn-sm btn-outline-info ms-2"
              title="Gebruik gesuggereerde aankomsttijd"
              @click=${() =>
                this.setTimingAndRecalculate(route, fromStopId, suggestedTime)}
            >
              ← ${toTimeValue(suggestedTime)}
            </button>`
          : nothing}
      </div>
    `;
  }

  private renderStop(
    route: VervoerstoerRoute,
    stop: VervoerstoerStop,
    stopIndex: number,
  ) {
    const existing = this.getTiming(route.id, stop.id);
    const val = existing ? toTimeValue(existing) : '';
    return html`
      <div class="d-flex align-items-center gap-3 mb-1">
        <span class="fw-bold" style="min-width:120px"
          >Stop ${stopIndex + 1}: ${stop.locatie.naam}</span
        >
        <label class="mb-0">
          Aankomst:
          <input
            type="time"
            class="form-control form-control-sm d-inline-block"
            style="width:auto"
            .value=${val}
            @change=${(e: Event) => {
              const v = (e.target as HTMLInputElement).value;
              if (v && this.baseDatum)
                this.setTimingAndRecalculate(
                  route,
                  stop.id,
                  fromTimeValue(v, this.baseDatum),
                );
            }}
          />
        </label>
      </div>
    `;
  }

  override render() {
    const destination = formatBestemming(this.vervoerstoer.bestemming);
    return html`
      <h3>Tijdsplanning</h3>
      ${this.vervoerstoer.routes.map((route) => {
        const stopsDesc = [...route.stops].reverse();

        const bestemmingTiming = this.getTiming(route.id, 'bestemming');
        const bestemmingVal = bestemmingTiming
          ? toTimeValue(bestemmingTiming)
          : '';

        return html`
          <div class="card mb-4">
            <div class="card-header">
              <strong>Chauffeur: ${fullName(route.chauffeur)}</strong>
              ${!route.chauffeur.verblijfadres
                ? html`<span class="badge text-bg-warning ms-2"
                    >⚠ Geen adres, fallback gebruikt</span
                  >`
                : nothing}
              &nbsp;— Bestemming: ${destination || '(onbekend)'}
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <div class="d-flex align-items-center gap-3 mb-2">
                    <span class="fw-bold" style="min-width:120px"
                      >Bestemming</span
                    >
                    <label class="mb-0">
                      Aankomst:
                      <input
                        type="time"
                        class="form-control form-control-sm d-inline-block"
                        style="width:auto"
                        .value=${bestemmingVal}
                        @change=${(e: Event) => {
                          const v = (e.target as HTMLInputElement).value;
                          if (v && this.baseDatum)
                            this.setTimingAndRecalculate(
                              route,
                              'bestemming',
                              fromTimeValue(v, this.baseDatum),
                            );
                        }}
                      />
                    </label>
                  </div>

                  ${stopsDesc.map((stop, idx) => {
                    const isLastStop = idx === stopsDesc.length - 1;
                    const nextStop = idx === 0 ? null : stopsDesc[idx - 1];
                    const originalIndex = route.stops.length - 1 - idx;

                    return html`
                      ${this.renderLegRow(
                        route,
                        originalIndex,
                        idx === 0
                          ? 'bestemming'
                          : (nextStop?.id ?? 'bestemming'),
                        stop.id,
                      )}
                      ${this.renderStop(route, stop, originalIndex)}
                      ${isLastStop
                        ? this.renderLegRow(
                            route,
                            -1,
                            stop.id,
                            'vertrek',
                          )
                        : nothing}
                      ${isLastStop
                        ? html`
                            <div class="d-flex align-items-center gap-3 mb-1">
                              <span class="fw-bold" style="min-width:120px">
                                Vertrek van
                                ${route.chauffeur.verblijfadres
                                  ? ''
                                  : html`<span class="text-muted"
                                      >(fallback)</span
                                    >`}
                              </span>
                              <label class="mb-0">
                                Vertrek:
                                <input
                                  type="time"
                                  class="form-control form-control-sm d-inline-block"
                                  style="width:auto"
                                  .value=${this.getTiming(route.id, 'vertrek')
                                    ? toTimeValue(
                                        this.getTiming(route.id, 'vertrek')!,
                                      )
                                    : ''}
                                  @change=${(e: Event) => {
                                    const v = (e.target as HTMLInputElement)
                                      .value;
                                    if (v && this.baseDatum)
                                      this.setTiming(
                                        route.id,
                                        'vertrek',
                                        fromTimeValue(v, this.baseDatum),
                                      );
                                  }}
                                />
                              </label>
                            </div>
                          `
                        : nothing}
                    `;
                  })}
                </div>
                <div class="col-md-6">
                  <rock-vervoerstoer-kaart
                    .routes=${[
                      {
                        naam: fullName(route.chauffeur),
                        startAdres: route.chauffeur.verblijfadres,
                        tussenstops: route.stops.map((s) => s.locatie),
                      } satisfies KaartRoute,
                    ]}
                    .bestemming=${destination}
                    .focusLegIndex=${this.focusLegIndices.get(route.id) ?? null}
                  ></rock-vervoerstoer-kaart>
                </div>
              </div>
            </div>
          </div>
        `;
      })}
      <button class="btn btn-primary" @click=${() => this.save()}>
        Tijdsplanning opslaan
      </button>
    `;
  }
}
