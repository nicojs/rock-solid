import {
  Aanmelding,
  Adres,
  Locatie,
  OverigPersoon,
  UpsertableVervoerstoer,
  Vervoerstoer,
} from '@rock-solid/shared';
import { css, html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tagsControl } from '../forms';
import { formStyles } from '../forms/reactive-form.component';
import { showLocatie } from '../locaties/locatie.pipe';
import { persoonService } from '../personen/persoon.service';
import { fullName } from '../personen/persoon.pipe';
import { RockElement } from '../rock-element';
import { bootstrap } from '../../styles';
import type {
  KaartRoute,
  RouteSamenvatting,
} from './vervoerstoer-kaart.component';
import { entities } from '../shared';

type LocalStop = { locatie: Locatie; aanmeldingen: Aanmelding[] };
type LocalRoute = { chauffeur: OverigPersoon; stops: LocalStop[] };
export type OpstapplaatsInfo = { locatie: Locatie; aanmeldingen: Aanmelding[] };

const KLEUREN = [
  '#4285F4',
  '#EA4335',
  '#34A853',
  '#FBBC04',
  '#9C27B0',
  '#FF7043',
];

const FALLBACK_ADRES = 'Ter Rivierenlaan 152, 2100 Deurne';

function formatDuur(seconds: number): string {
  const uren = Math.floor(seconds / 3600);
  const min = Math.round((seconds % 3600) / 60);
  return uren > 0 ? `${uren} u ${min} min` : `${min} min`;
}

function formatAfstand(meters: number): string {
  return `${Math.round(meters / 1000)} km`;
}

function formatAdres(adres: Adres): string {
  return `${adres.straatnaam} ${adres.huisnummer}, ${adres.plaats.postcode} ${adres.plaats.deelgemeente}, België`;
}

function formatBestemming(bestemming?: Locatie): string {
  if (!bestemming) return '';
  return bestemming.adres ? formatAdres(bestemming.adres) : bestemming.naam;
}

@customElement('rock-routes-selecteren')
export class RoutesSelecterenComponent extends RockElement {
  static override styles = [
    bootstrap,
    formStyles,
    css`
      [draggable='true'] {
        cursor: grab;
      }
      [draggable='true']:active {
        cursor: grabbing;
      }
      .drop-zone {
        cursor: default;
      }
      .drop-zone.drag-active {
        cursor: not-allowed;
      }
    `,
  ];

  @property({ attribute: false })
  opstapplaatsen: OpstapplaatsInfo[] = [];

  @property({ attribute: false })
  vervoerstoer!: Vervoerstoer;

  @state()
  private routes: LocalRoute[] = [];

  @state()
  private kaartRoutes: KaartRoute[] = [];

  @state()
  chauffeurs: OverigPersoon[] = [];

  @state()
  private routeSamenvattingen: RouteSamenvatting[] = [];

  private dragSource:
    | { kind: 'unallocated'; locatie: Locatie }
    | { kind: 'stop'; stop: LocalStop; fromRoute: LocalRoute }
    | null = null;

  @state()
  private dragOverTarget: {
    chauffeurId: number | 'unallocated';
    beforeStopIndex: number | null;
  } | null = null;

  protected override update(
    changedProperties: PropertyValues<RoutesSelecterenComponent>,
  ): void {
    if (changedProperties.has('vervoerstoer')) {
      this.routes = this.vervoerstoer.routes
        .map((route) => ({
          chauffeur: route.chauffeur,
          stops: route.stops.map((stop) => ({
            locatie: stop.locatie,
            aanmeldingen: stop.aanmeldersOpTePikken,
          })),
        }))
        .sort((a, b) =>
          fullName(a.chauffeur).localeCompare(fullName(b.chauffeur)),
        );
      this.chauffeurs = this.routes.map((r) => r.chauffeur);
      this.updateKaartRoutes();
    }
    if (changedProperties.has('chauffeurs')) {
      const oldChauffeurs = changedProperties.get('chauffeurs') ?? [];
      const added = this.chauffeurs.filter(
        (c) => !oldChauffeurs.some((oc) => oc.id === c.id),
      );
      const removed = oldChauffeurs.filter(
        (oc) => !this.chauffeurs.some((c) => c.id === oc.id),
      );
      for (const chauffeur of removed) {
        this.routes = this.routes.filter(
          (r) => r.chauffeur.id !== chauffeur.id,
        );
      }
      for (const chauffeur of added) {
        if (!this.routes.some((r) => r.chauffeur.id === chauffeur.id)) {
          this.routes = [...this.routes, { chauffeur, stops: [] }];
        }
      }
      this.updateKaartRoutes();
    }
    super.update(changedProperties);
  }

  private get allocatedAanmeldingIds(): Set<number> {
    const ids = new Set<number>();
    for (const route of this.routes) {
      for (const stop of route.stops) {
        for (const aanmelding of stop.aanmeldingen) {
          ids.add(aanmelding.id);
        }
      }
    }
    return ids;
  }

  private unallocatedAt(locatie: Locatie): Aanmelding[] {
    const allocated = this.allocatedAanmeldingIds;
    const info = this.opstapplaatsen.find((o) => o.locatie.id === locatie.id);
    return info?.aanmeldingen.filter((a) => !allocated.has(a.id)) ?? [];
  }

  private get bestemmingStop() {
    return this.vervoerstoer.bestemmingStop;
  }

  private get unallocatedOpstapplaatsen(): OpstapplaatsInfo[] {
    return this.opstapplaatsen.filter(
      (o) => this.unallocatedAt(o.locatie).length > 0,
    );
  }

  private onDragStartUnallocated(e: DragEvent, locatie: Locatie) {
    this.dragSource = { kind: 'unallocated', locatie };
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  }

  private onDragStartStop(
    e: DragEvent,
    stop: LocalStop,
    fromRoute: LocalRoute,
  ) {
    e.stopPropagation();
    this.dragSource = { kind: 'stop', stop, fromRoute };
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  }

  private onDragEnd() {
    this.dragSource = null;
    this.dragOverTarget = null;
  }

  private onDragOverZone(e: DragEvent, chauffeurId: number | 'unallocated') {
    if (!this.dragSource) return;
    e.preventDefault();
    e.stopPropagation();
    this.dragOverTarget = { chauffeurId, beforeStopIndex: null };
  }

  private onDragOverStop(
    e: DragEvent,
    chauffeurId: number | 'unallocated',
    stopIndex: number,
  ) {
    if (!this.dragSource) return;
    e.preventDefault();
    e.stopPropagation();
    this.dragOverTarget = { chauffeurId, beforeStopIndex: stopIndex };
  }

  private onDropOnRoute(
    e: DragEvent,
    route: LocalRoute,
    beforeStopIndex: number | null,
  ) {
    e.preventDefault();
    e.stopPropagation();
    if (!this.dragSource) return;

    const source = this.dragSource;
    this.dragSource = null;
    this.dragOverTarget = null;

    let newStop: LocalStop;
    if (source.kind === 'unallocated') {
      newStop = {
        locatie: source.locatie,
        aanmeldingen: this.unallocatedAt(source.locatie),
      };
    } else {
      const isSameRoute = source.fromRoute === route;
      const sourceIndex = source.fromRoute.stops.indexOf(source.stop);
      source.fromRoute.stops = source.fromRoute.stops.filter(
        (s) => s !== source.stop,
      );
      newStop = source.stop;

      if (
        isSameRoute &&
        beforeStopIndex !== null &&
        sourceIndex < beforeStopIndex
      ) {
        beforeStopIndex--;
      }
    }

    const bestaandeStop = route.stops.find(
      (s) => s.locatie.id === newStop.locatie.id,
    );
    if (bestaandeStop) {
      bestaandeStop.aanmeldingen = [
        ...bestaandeStop.aanmeldingen,
        ...newStop.aanmeldingen,
      ];
    } else {
      const stops = [...route.stops];
      if (beforeStopIndex === null) {
        stops.push(newStop);
      } else {
        stops.splice(beforeStopIndex, 0, newStop);
      }
      route.stops = stops;
    }
    this.routes = [...this.routes];
    this.updateKaartRoutes();
  }

  private onDropOnUnallocated(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!this.dragSource || this.dragSource.kind !== 'stop') return;

    const source = this.dragSource;
    this.dragSource = null;
    this.dragOverTarget = null;

    // Remove stop from route (it goes back to unallocated)
    source.fromRoute.stops = source.fromRoute.stops.filter(
      (s) => s !== source.stop,
    );
    this.routes = [...this.routes];
    this.updateKaartRoutes();
  }

  private googleMapsUrl(route: LocalRoute): string {
    const origin = route.chauffeur.verblijfadres
      ? formatAdres(route.chauffeur.verblijfadres)
      : FALLBACK_ADRES;
    const destination = formatBestemming(this.bestemmingStop?.locatie);
    if (!destination) return '#';

    const params = new URLSearchParams({
      api: '1',
      origin: origin,
      destination: destination,
    });
    const waypoints = route.stops
      .map((stop) =>
        stop.locatie.adres
          ? formatAdres(stop.locatie.adres)
          : (stop.locatie.gpsBeschrijving ?? stop.locatie.naam),
      )
      .join('|');
    if (waypoints) {
      params.set('waypoints', waypoints);
    }
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  private reset() {
    this.routes = this.routes.map((r) => ({ ...r, stops: [] }));
    this.updateKaartRoutes();
  }

  private updateKaartRoutes() {
    this.kaartRoutes = this.routes.map((route) => ({
      naam: fullName(route.chauffeur),
      startAdres: route.chauffeur.verblijfadres,
      tussenstops: route.stops.map((s) => s.locatie),
    }));
  }

  private buildUpsertable(): UpsertableVervoerstoer {
    return {
      projectIds: this.vervoerstoer.projectIds,
      datum: this.vervoerstoer.datum,
      datumTerug: this.vervoerstoer.datumTerug,
      toeTeKennenStops: this.vervoerstoer.toeTeKennenStops.map((stop) => ({
        ...stop,
        aanmeldersOpTePikken: this.unallocatedAt(stop.locatie),
      })),
      bestemmingStop: this.vervoerstoer.bestemmingStop,
      routes: this.routes.map((route, routeIdx) => ({
        id: this.vervoerstoer.routes[routeIdx]?.id,
        chauffeur: route.chauffeur,
        stops: route.stops.map((stop, stopIdx) => ({
          locatie: stop.locatie,
          volgnummer: stopIdx + 1,
          aanmeldersOpTePikken: stop.aanmeldingen,
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

  private saveAndNext() {
    this.dispatchEvent(
      new CustomEvent<UpsertableVervoerstoer>('vervoerstoer-saved', {
        detail: this.buildUpsertable(),
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    const isDragging = Boolean(this.dragSource);
    const canDropOnUnallocated = isDragging && this.dragSource?.kind === 'stop';
    return html`
      <div class="row mb-3">
        <div class="col mb-3">
          <rock-reactive-form-tags
            .entity=${this}
            .control=${tagsControl<RoutesSelecterenComponent, 'chauffeurs'>(
              'chauffeurs',
              (chauffeur) => fullName(chauffeur),
              async (text) => {
                const results = (await persoonService.getAll({
                  type: 'overigPersoon',
                  volledigeNaamLike: text,
                })) as OverigPersoon[];
                return results.map((c) => ({
                  text: fullName(c),
                  value: c,
                }));
              },
              { label: 'Chauffeurs', minCharacters: 0 },
            )}
          >
          </rock-reactive-form-tags>
        </div>
      </div>
      <div class="row">
        <div class="col-sm-3">
          <h4>Toe te kennen</h4>
          <div
            class="drop-zone ${canDropOnUnallocated ? 'drag-active' : ''} ${this
              .dragOverTarget?.chauffeurId === 'unallocated'
              ? 'border border-primary bg-light rounded p-2'
              : ''}"
            style="min-height: 40px"
            @dragover=${(e: DragEvent) => {
              if (this.dragSource?.kind === 'stop') {
                this.onDragOverZone(e, 'unallocated');
              }
            }}
            @dragleave=${() => {
              if (this.dragOverTarget?.chauffeurId === 'unallocated') {
                this.dragOverTarget = null;
              }
            }}
            @drop=${(e: DragEvent) => this.onDropOnUnallocated(e)}
          >
            <ul class="list-group">
              ${this.unallocatedOpstapplaatsen.map(({ locatie }) => {
                const count = this.unallocatedAt(locatie).length;
                return html`<li
                  class="list-group-item d-flex align-items-center gap-2"
                  draggable="true"
                  @dragstart=${(e: DragEvent) =>
                    this.onDragStartUnallocated(e, locatie)}
                  @dragend=${() => this.onDragEnd()}
                >
                  <rock-icon icon="gripHorizontal"></rock-icon>
                  ${showLocatie(locatie)}
                  <span class="badge text-bg-secondary ms-auto">${count}</span>
                </li>`;
              })}
            </ul>
          </div>
          ${this.bestemmingStop
            ? html`
                <h5 class="mt-3">
                  Rechtstreeks naar ${this.bestemmingStop.locatie.naam}
                </h5>
                <div class="border rounded p-2">
                  <span class="badge text-bg-secondary mb-1"
                    >${entities(
                      this.bestemmingStop.aanmeldersOpTePikken.length,
                      'deelnemer',
                    )}</span
                  >
                  <ul class="mb-0 small list-unstyled">
                    ${this.bestemmingStop.aanmeldersOpTePikken.map(
                      (a) =>
                        html`<li>
                          ${a.deelnemer
                            ? fullName(a.deelnemer)
                            : `Aanmelding ${a.id}`}
                        </li>`,
                    )}
                  </ul>
                </div>
              `
            : ''}
        </div>
        ${this.routes.map((route, routeIdx) => {
          const aantalPassagiers = route.stops.reduce(
            (sum, s) => sum + s.aanmeldingen.length,
            0,
          );
          return html`
            <div class="col">
              <h5>
                <span
                  style="display:inline-block;width:12px;height:12px;border-radius:50%;background-color:${KLEUREN[
                    routeIdx % KLEUREN.length
                  ]};vertical-align:middle;margin-right:4px"
                ></span>
                ${fullName(route.chauffeur)}
                ${!route.chauffeur.verblijfadres
                  ? html`<span
                      class="badge text-bg-warning ms-1"
                      title="Geen adres bekend, fallback adres wordt gebruikt"
                      >⚠</span
                    >`
                  : ''}
              </h5>
              <div class="d-flex flex-wrap gap-1 mb-2">
                <span class="badge text-bg-secondary"
                  >${entities(aantalPassagiers, 'passagier')}</span
                >
                ${this.routeSamenvattingen[routeIdx]
                  ? html`
                      <span class="badge text-bg-secondary"
                        >±
                        ${formatDuur(
                          this.routeSamenvattingen[routeIdx].durationSeconds,
                        )}</span
                      >
                      <span class="badge text-bg-secondary"
                        >${formatAfstand(
                          this.routeSamenvattingen[routeIdx].distanceMeters,
                        )}</span
                      >
                    `
                  : ''}
              </div>
              <div
                class="drop-zone border rounded p-2 mb-2 ${isDragging
                  ? 'drag-active'
                  : ''} ${this.dragOverTarget?.chauffeurId ===
                  route.chauffeur.id &&
                this.dragOverTarget?.beforeStopIndex === null
                  ? 'border-primary bg-light'
                  : ''}"
                style="min-height: 60px"
                @dragover=${(e: DragEvent) =>
                  this.onDragOverZone(e, route.chauffeur.id)}
                @dragleave=${(e: DragEvent) => {
                  if (
                    !e.currentTarget ||
                    !(e.currentTarget as Element).contains(
                      e.relatedTarget as Node,
                    )
                  ) {
                    if (
                      this.dragOverTarget?.chauffeurId === route.chauffeur.id
                    ) {
                      this.dragOverTarget = null;
                    }
                  }
                }}
                @drop=${(e: DragEvent) => this.onDropOnRoute(e, route, null)}
              >
                ${route.stops.length === 0
                  ? html`<p class="text-muted small mb-0">
                      Sleep een opstapplaats hierheen
                    </p>`
                  : route.stops.map(
                      (stop, stopIndex) => html`
                        <div
                          class="border-top border-2 ${this.dragOverTarget
                            ?.chauffeurId === route.chauffeur.id &&
                          this.dragOverTarget?.beforeStopIndex === stopIndex
                            ? 'border-primary'
                            : 'border-transparent'}"
                          style="margin-top: -1px"
                          @dragover=${(e: DragEvent) =>
                            this.onDragOverStop(
                              e,
                              route.chauffeur.id,
                              stopIndex,
                            )}
                          @drop=${(e: DragEvent) =>
                            this.onDropOnRoute(e, route, stopIndex)}
                        ></div>
                        <div
                          class="d-flex align-items-start mb-1 pb-1 border-bottom"
                          draggable="true"
                          @dragstart=${(e: DragEvent) =>
                            this.onDragStartStop(e, stop, route)}
                          @dragend=${() => this.onDragEnd()}
                          @dragover=${(e: DragEvent) =>
                            this.onDragOverStop(
                              e,
                              route.chauffeur.id,
                              stopIndex,
                            )}
                          @drop=${(e: DragEvent) =>
                            this.onDropOnRoute(e, route, stopIndex)}
                        >
                          <rock-icon
                            icon="gripHorizontal"
                            style="margin-top:2px"
                          ></rock-icon>
                          <div class="ms-1">
                            <span
                              class="badge me-1"
                              style="background-color:${KLEUREN[
                                routeIdx % KLEUREN.length
                              ]}"
                              >${String.fromCharCode(66 + stopIndex)}</span
                            ><strong>${showLocatie(stop.locatie)}</strong>
                            <ul class="mb-0 small list-unstyled ms-1">
                              ${stop.aanmeldingen.map(
                                (a) =>
                                  html`<li>
                                    ${a.deelnemer
                                      ? fullName(a.deelnemer)
                                      : `Aanmelding ${a.id}`}
                                  </li>`,
                              )}
                            </ul>
                          </div>
                        </div>
                      `,
                    )}
              </div>
            </div>
          `;
        })}
      </div>

      <rock-vervoerstoer-kaart
        class="d-block mb-4"
        .routes=${this.kaartRoutes}
        .bestemming=${formatBestemming(this.bestemmingStop?.locatie)}
        @routes-berekend=${(e: CustomEvent<RouteSamenvatting[]>) => {
          this.routeSamenvattingen = e.detail;
        }}
      ></rock-vervoerstoer-kaart>
      <div class="mt-3 d-flex gap-2">
        <button class="btn btn-secondary" @click=${() => this.save()}>
          <rock-icon icon="floppy"></rock-icon> Opslaan
        </button>
        <button
          class="btn btn-primary ms-3"
          @click=${() => this.saveAndNext()}
          ?disabled=${this.routes.length === 0 ||
          this.unallocatedOpstapplaatsen.length > 0}
        >
          <rock-icon icon="arrowRightCircle"></rock-icon> Opslaan en verder
        </button>
        <button
          class="btn btn-outline-secondary ms-3"
          @click=${() => this.reset()}
        >
          Reset stops
        </button>
      </div>
    `;
  }
}
