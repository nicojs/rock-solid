import {
  Adres,
  Locatie,
  Project,
  Vervoerstoer,
  VervoerstoerRoute,
  VervoerstoerStop,
} from '@rock-solid/shared';
import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { fullName } from '../../personen/persoon.pipe';
import { RockElement } from '../../rock-element';
import { bootstrap } from '../../../styles';
import { vervoerstoerService } from './vervoerstoer.service';

function formatAdres(adres: Adres): string {
  return `${adres.straatnaam} ${adres.huisnummer}, ${adres.plaats.postcode} ${adres.plaats.gemeente}, België`;
}

function formatLocatieAdres(locatie: Locatie): string {
  return locatie.adres ? formatAdres(locatie.adres) : locatie.naam;
}

function deriveDestination(projecten: Project[]): string {
  const vakantie = projecten.find((p) => p.type === 'vakantie');
  if (vakantie && vakantie.type === 'vakantie') {
    return `${vakantie.bestemming}, ${vakantie.land}`;
  }
  const cursus = projecten.find((p) => p.type === 'cursus');
  if (cursus && cursus.type === 'cursus') {
    const locatie = cursus.activiteiten[0]?.locatie;
    if (locatie) return formatLocatieAdres(locatie);
  }
  return '';
}

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(val: string): Date {
  return new Date(val);
}

interface ReistijdState {
  loading: boolean;
  durationSeconds: number | null;
  unavailable: boolean;
}

export interface TijdsplanningEntry {
  stopId: number;
  geplandeAankomst: Date;
}

@customElement('rock-tijdsplanning')
export class TijdsplanningComponent extends RockElement {
  static override styles = [bootstrap];

  @property({ attribute: false })
  vervoerstoer!: Vervoerstoer;

  @property({ attribute: false })
  projecten: Project[] = [];

  @state()
  private timings: Map<string, Date> = new Map();

  @state()
  private reistijden: Map<string, ReistijdState> = new Map();

  private reistijdKey(routeId: number, fromStopIndex: number): string {
    return `${routeId}-${fromStopIndex}`;
  }

  private timingKey(routeId: number, stopId: number | 'bestemming'): string {
    return `${routeId}-${stopId}`;
  }

  private getTiming(routeId: number, stopId: number | 'bestemming'): Date | undefined {
    return this.timings.get(this.timingKey(routeId, stopId));
  }

  private setTiming(routeId: number, stopId: number | 'bestemming', date: Date) {
    const key = this.timingKey(routeId, stopId);
    this.timings = new Map(this.timings).set(key, date);
  }

  private async berekenReistijd(
    routeId: number,
    fromStopIndex: number,
    origin: string,
    destination: string,
  ) {
    const key = this.reistijdKey(routeId, fromStopIndex);
    this.reistijden = new Map(this.reistijden).set(key, {
      loading: true,
      durationSeconds: null,
      unavailable: false,
    });
    try {
      const result = await vervoerstoerService.getReistijd(origin, destination);
      this.reistijden = new Map(this.reistijden).set(key, {
        loading: false,
        durationSeconds: result.durationSeconds,
        unavailable: result.durationSeconds === null,
      });
    } catch {
      this.reistijden = new Map(this.reistijden).set(key, {
        loading: false,
        durationSeconds: null,
        unavailable: true,
      });
    }
  }

  private formatDuration(seconds: number): string {
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `± ${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `± ${h}u${m}min` : `± ${h}u`;
  }

  private save() {
    const entries: TijdsplanningEntry[] = [];
    for (const route of this.vervoerstoer.routes) {
      for (const stop of route.stops) {
        const timing = this.getTiming(route.id, stop.id);
        if (timing) {
          entries.push({ stopId: stop.id, geplandeAankomst: timing });
        }
      }
    }
    this.dispatchEvent(
      new CustomEvent<TijdsplanningEntry[]>('tijdsplanning-saved', {
        detail: entries,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private renderLegRow(
    route: VervoerstoerRoute,
    fromAddr: string,
    toAddr: string,
    fromStopIndex: number,
    toStopId: number | 'bestemming',
  ) {
    const key = this.reistijdKey(route.id, fromStopIndex);
    const reistijd = this.reistijden.get(key);
    const toTiming = this.getTiming(route.id, toStopId);

    return html`
      <div class="d-flex align-items-center gap-2 my-1 ms-3 text-muted small">
        <span>↑</span>
        ${reistijd
          ? reistijd.loading
            ? html`<span>Berekenen...</span>`
            : reistijd.unavailable
              ? html`<span class="text-warning">Reistijd niet beschikbaar</span>`
              : html`<span>${this.formatDuration(reistijd.durationSeconds!)}</span>`
          : html`
              <button
                class="btn btn-sm btn-outline-secondary"
                @click=${() =>
                  this.berekenReistijd(route.id, fromStopIndex, fromAddr, toAddr)}
              >
                Bereken reistijd
              </button>
            `}
        ${reistijd && !reistijd.loading && !reistijd.unavailable && toTiming
          ? html`<span class="ms-2 text-info">
              Gesuggereerde vertrek:
              ${toDatetimeLocalValue(
                new Date(
                  toTiming.getTime() - reistijd.durationSeconds! * 1000,
                ),
              )}
            </span>`
          : nothing}
      </div>
    `;
  }

  private renderStop(
    route: VervoerstoerRoute,
    stop: VervoerstoerStop,
    stopIndex: number,
  ) {
    const existing = stop.geplandeAankomst ?? this.getTiming(route.id, stop.id);
    const val = existing ? toDatetimeLocalValue(existing) : '';
    return html`
      <div class="d-flex align-items-center gap-3 mb-1">
        <span class="fw-bold" style="min-width:120px">Stop ${stopIndex + 1}: ${stop.locatie.naam}</span>
        <label class="mb-0">
          Aankomst:
          <input
            type="datetime-local"
            class="form-control form-control-sm d-inline-block"
            style="width:auto"
            .value=${val}
            @change=${(e: Event) => {
              const v = (e.target as HTMLInputElement).value;
              if (v) this.setTiming(route.id, stop.id, fromDatetimeLocalValue(v));
            }}
          />
        </label>
      </div>
    `;
  }

  override render() {
    const destination = deriveDestination(this.projecten);
    return html`
      <h3>Tijdsplanning</h3>
      ${this.vervoerstoer.routes.map((route) => {
        const stopsDesc = [...route.stops].reverse();
        const chauffeurAdres = route.chauffeur.verblijfadres
          ? formatAdres(route.chauffeur.verblijfadres)
          : 'Ter Rivierenlaan 152, 2100 Deurne';

        const bestemmingTiming = this.getTiming(route.id, 'bestemming');
        const bestemmingVal = bestemmingTiming
          ? toDatetimeLocalValue(bestemmingTiming)
          : '';

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
              <div class="d-flex align-items-center gap-3 mb-2">
                <span class="fw-bold" style="min-width:120px">Bestemming</span>
                <label class="mb-0">
                  Aankomst:
                  <input
                    type="datetime-local"
                    class="form-control form-control-sm d-inline-block"
                    style="width:auto"
                    .value=${bestemmingVal}
                    @change=${(e: Event) => {
                      const v = (e.target as HTMLInputElement).value;
                      if (v) this.setTiming(route.id, 'bestemming', fromDatetimeLocalValue(v));
                    }}
                  />
                </label>
              </div>

              ${stopsDesc.map((stop, idx) => {
                const isLastStop = idx === stopsDesc.length - 1;
                const nextStop = idx === 0 ? null : stopsDesc[idx - 1];
                const thisAddr = formatLocatieAdres(stop.locatie);
                const nextAddr =
                  idx === 0
                    ? destination
                    : nextStop
                      ? formatLocatieAdres(nextStop.locatie)
                      : '';
                const originalIndex = route.stops.length - 1 - idx;

                return html`
                  ${this.renderLegRow(
                    route,
                    thisAddr,
                    nextAddr || destination,
                    originalIndex,
                    idx === 0 ? 'bestemming' : (nextStop?.id ?? 'bestemming'),
                  )}
                  ${this.renderStop(route, stop, originalIndex)}
                  ${isLastStop
                    ? this.renderLegRow(
                        route,
                        chauffeurAdres,
                        thisAddr,
                        -1,
                        stop.id,
                      )
                    : nothing}
                  ${isLastStop
                    ? html`
                        <div class="text-muted small ms-3">
                          Vertrek van ${route.chauffeur.verblijfadres ? chauffeurAdres : 'De Kei (fallback)'}
                        </div>
                      `
                    : nothing}
                `;
              })}
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
