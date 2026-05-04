import {
  Aanmelding,
  Locatie,
  OverigPersoon,
  Vervoerstoer,
  VervoerstoerRoute,
  VervoerstoerStop,
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
import { entities, showAdres } from '../shared';

const KLEUREN = [
  '#4285F4',
  '#EA4335',
  '#34A853',
  '#FBBC04',
  '#9C27B0',
  '#FF7043',
];

function formatDuur(seconds: number): string {
  const uren = Math.floor(seconds / 3600);
  const min = Math.round((seconds % 3600) / 60);
  return uren > 0 ? `${uren} u ${min} min` : `${min} min`;
}

function formatAfstand(meters: number): string {
  return `${Math.round(meters / 1000)} km`;
}

function formatBestemming(bestemming?: Locatie): string {
  if (!bestemming) return '';
  return bestemming.adres ? showAdres(bestemming.adres) : bestemming.naam;
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
      .deelnemer-row .remove-deelnemer {
        visibility: hidden;
      }
      .deelnemer-row:hover .remove-deelnemer {
        visibility: visible;
      }
    `,
  ];

  @property({ attribute: false })
  vervoerstoer!: Vervoerstoer;

  @state()
  chauffeurs: OverigPersoon[] = [];

  @state()
  private kaartRoutes: KaartRoute[] = [];

  @state()
  private routeSamenvattingen: RouteSamenvatting[] = [];

  private dragSource:
    | { kind: 'unallocated'; stop: VervoerstoerStop }
    | { kind: 'stop'; stop: VervoerstoerStop; fromRoute: VervoerstoerRoute }
    | null = null;

  @state()
  private dragOverTarget: {
    chauffeurId: number | 'unallocated';
    beforeStopIndex: number | null;
  } | null = null;

  private get sortedRoutes(): VervoerstoerRoute[] {
    return [...this.vervoerstoer.routes].sort((a, b) =>
      fullName(a.chauffeur).localeCompare(fullName(b.chauffeur)),
    );
  }

  private get bestemmingStop() {
    return this.vervoerstoer.bestemmingStop;
  }

  private get unallocatedOpstapplaatsen(): VervoerstoerStop[] {
    return this.vervoerstoer.toeTeKennenStops.filter(
      (s) => s.aanmeldersOpTePikken.length > 0,
    );
  }

  protected override update(
    changedProperties: PropertyValues<RoutesSelecterenComponent>,
  ): void {
    if (changedProperties.has('vervoerstoer')) {
      this.chauffeurs = this.sortedRoutes.map((r) => r.chauffeur);
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
        this.vervoerstoer.routes = this.vervoerstoer.routes.filter(
          (r) => r.chauffeur.id !== chauffeur.id,
        );
      }
      for (const chauffeur of added) {
        if (
          !this.vervoerstoer.routes.some((r) => r.chauffeur.id === chauffeur.id)
        ) {
          this.vervoerstoer.routes.push({ id: 0, chauffeur, stops: [] });
        }
      }
      this.updateKaartRoutes();
    }
    super.update(changedProperties);
  }

  /**
   * Clear timings for a stop and all subsequent stops in the route.
   */
  private removeAanmelding(
    route: VervoerstoerRoute,
    stop: VervoerstoerStop,
    aanmelding: Aanmelding,
  ) {
    // Remove aanmelding from the route stop
    stop.aanmeldersOpTePikken = stop.aanmeldersOpTePikken.filter(
      (a) => a.id !== aanmelding.id,
    );
    if (stop.aanmeldersOpTePikken.length === 0) {
      route.stops = route.stops.filter((s) => s !== stop);
      this.clearTimings(route);
    }
    // Add aanmelding to a toeTeKennenStop for the same locatie
    const bestaand = this.vervoerstoer.toeTeKennenStops.find(
      (s) => s.locatie.id === stop.locatie.id,
    );
    if (bestaand) {
      bestaand.aanmeldersOpTePikken.push(aanmelding);
    } else {
      this.vervoerstoer.toeTeKennenStops.push({
        id: 0,
        locatie: stop.locatie,
        aanmeldersOpTePikken: [aanmelding],
      });
    }
    this.requestUpdate();
  }

  private clearTimings(route: VervoerstoerRoute) {
    for (const stop of route.stops) {
      stop.geplandeAankomst = undefined;
      stop.geplandeAankomstTerug = undefined;
    }
    route.vertrekTijd = undefined;
    route.vertrekTijdTerug = undefined;
  }

  private onDragStartUnallocated(e: DragEvent, stop: VervoerstoerStop) {
    this.dragSource = { kind: 'unallocated', stop };
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  }

  private onDragStartStop(
    e: DragEvent,
    stop: VervoerstoerStop,
    fromRoute: VervoerstoerRoute,
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
    route: VervoerstoerRoute,
    beforeStopIndex: number | null,
  ) {
    e.preventDefault();
    e.stopPropagation();
    if (!this.dragSource) return;

    const source = this.dragSource;
    this.dragSource = null;
    this.dragOverTarget = null;

    let newStop: VervoerstoerStop;
    if (source.kind === 'unallocated') {
      newStop = source.stop;
      // Remove from toeTeKennenStops
      this.vervoerstoer.toeTeKennenStops =
        this.vervoerstoer.toeTeKennenStops.filter((s) => s !== source.stop);
    } else {
      const isSameRoute = source.fromRoute === route;
      const sourceIndex = source.fromRoute.stops.indexOf(source.stop);
      source.fromRoute.stops = source.fromRoute.stops.filter(
        (s) => s !== source.stop,
      );
      this.clearTimings(source.fromRoute);
      newStop = source.stop;
      newStop.geplandeAankomst = undefined;
      newStop.geplandeAankomstTerug = undefined;

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
      bestaandeStop.aanmeldersOpTePikken = [
        ...bestaandeStop.aanmeldersOpTePikken,
        ...newStop.aanmeldersOpTePikken,
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
    this.clearTimings(route);
    this.requestUpdate();
    this.updateKaartRoutes();
  }

  private onDropOnUnallocated(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!this.dragSource || this.dragSource.kind !== 'stop') return;

    const source = this.dragSource;
    this.dragSource = null;
    this.dragOverTarget = null;

    // Remove stop from route and add back to toeTeKennenStops
    source.fromRoute.stops = source.fromRoute.stops.filter(
      (s) => s !== source.stop,
    );
    source.stop.geplandeAankomst = undefined;
    source.stop.geplandeAankomstTerug = undefined;
    this.clearTimings(source.fromRoute);
    this.vervoerstoer.toeTeKennenStops.push(source.stop);
    this.requestUpdate();
    this.updateKaartRoutes();
  }

  private reset() {
    // Move all stops back to toeTeKennenStops
    for (const route of this.vervoerstoer.routes) {
      this.vervoerstoer.toeTeKennenStops.push(...route.stops);
      route.stops = [];
    }
    this.requestUpdate();
    this.updateKaartRoutes();
  }

  private updateKaartRoutes() {
    this.kaartRoutes = this.sortedRoutes.map((route) => ({
      naam: fullName(route.chauffeur),
      startAdres: route.chauffeur.verblijfadres,
      tussenstops: route.stops.map((s) => s.locatie),
    }));
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

  override render() {
    const isDragging = Boolean(this.dragSource);
    const canDropOnUnallocated = isDragging && this.dragSource?.kind === 'stop';
    return html`
      <details class="alert alert-info">
        <summary>Uitleg</summary>
        <p>
          Hier kun je opstapplaatsen toekennen aan chauffeurs door ze te
          verslepen.
        </p>
        <ol>
          <li>
            Voeg chauffeurs toe via het veld 'Chauffeurs'. De begeleiders van de
            geselecteerde projecten zijn standaard toegevoegd. Je kunt personeel
            en vakantievrijwilligers toevoegen.
          </li>
          <li>
            Sleep opstapplaatsen vanuit 'Toe te kennen' naar de kolom van een
            chauffeur om ze toe te wijzen.
          </li>
          <li>
            Versleep stops tussen chauffeurs om de verdeling aan te passen, of
            sleep ze terug naar 'Toe te kennen'.
          </li>
          <li>
            Deelnemers die rechtstreeks naar de bestemming gaan worden apart
            getoond en hoeven niet toegekend te worden.
          </li>
          <li>Klik op 'Opslaan en verder' als alle stops zijn toegekend.</li>
        </ol>
      </details>
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
                  selectie: ['personeel', 'vakantieVrijwilliger'],
                  volledigeNaamLike: text,
                })) as OverigPersoon[];
                return results.map((c) => ({
                  text: fullName(c),
                  value: c,
                }));
              },
              { label: 'Chauffeurs', minCharacters: 2 },
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
              ${this.unallocatedOpstapplaatsen.map((stop) => {
                return html`<li
                  class="list-group-item d-flex align-items-center gap-2"
                  draggable="true"
                  @dragstart=${(e: DragEvent) =>
                    this.onDragStartUnallocated(e, stop)}
                  @dragend=${() => this.onDragEnd()}
                >
                  <rock-icon icon="gripHorizontal"></rock-icon>
                  ${showLocatie(stop.locatie)}
                  <span class="badge text-bg-secondary ms-auto"
                    >${stop.aanmeldersOpTePikken.length}</span
                  >
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
        ${this.sortedRoutes.map((route, routeIdx) => {
          const aantalPassagiers = route.stops.reduce(
            (sum, s) => sum + s.aanmeldersOpTePikken.length,
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
                              ${stop.aanmeldersOpTePikken.map(
                                (a) =>
                                  html`<li
                                    class="deelnemer-row d-flex align-items-center gap-1"
                                  >
                                    <span
                                      >${a.deelnemer
                                        ? fullName(a.deelnemer)
                                        : `Aanmelding ${a.id}`}</span
                                    >
                                    <button
                                      class="remove-deelnemer btn btn-sm p-0 lh-1 text-danger"
                                      title="Verwijder uit stop"
                                      @click=${(ev: Event) => {
                                        ev.stopPropagation();
                                        this.removeAanmelding(route, stop, a);
                                      }}
                                    >
                                      ×
                                    </button>
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
        <button
          class="btn btn-secondary"
          @click=${() => this.emitSave('vervoerstoer-save-requested')}
        >
          <rock-icon icon="floppy"></rock-icon> Opslaan
        </button>
        <button
          class="btn btn-primary ms-3"
          @click=${() => this.emitSave('vervoerstoer-saved')}
          ?disabled=${this.vervoerstoer.routes.length === 0 ||
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
