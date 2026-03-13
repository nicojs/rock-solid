import {
  Aanmelding,
  Adres,
  Locatie,
  OverigPersoon,
  Project,
  Vervoerstoer,
} from '@rock-solid/shared';
import { css, html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { tagsControl } from '../../forms';
import { formStyles } from '../../forms/reactive-form.component';
import { showLocatie } from '../../locaties/locatie.pipe';
import { persoonService } from '../../personen/persoon.service';
import { fullName } from '../../personen/persoon.pipe';
import { RockElement } from '../../rock-element';
import { bootstrap } from '../../../styles';
import './vervoerstoer-kaart.component';
import type {
  KaartRoute,
  RouteSamenvatting,
} from './vervoerstoer-kaart.component';
import { entities, pluralize } from '../../shared';

type LocalStop = { locatie: Locatie; aanmeldingen: Aanmelding[] };
type LocalRoute = { chauffeur: OverigPersoon; stops: LocalStop[] };

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
  return `${adres.straatnaam} ${adres.huisnummer}, ${adres.plaats.postcode} ${adres.plaats.gemeente}, België`;
}

function deriveDestination(projecten: Project[]): string {
  const vakantie = projecten.find((p) => p.type === 'vakantie');
  if (vakantie && vakantie.type === 'vakantie') {
    return `${vakantie.bestemming}, ${vakantie.land}`;
  }
  const cursus = projecten.find((p) => p.type === 'cursus');
  if (cursus && cursus.type === 'cursus') {
    const locatie = cursus.activiteiten[0]?.locatie;
    if (locatie?.adres) return formatAdres(locatie.adres);
    if (locatie) return locatie.naam;
  }
  return '';
}

@customElement('rock-routes-selecteren')
export class RoutesSelecterenComponent extends RockElement {
  static override styles = [
    bootstrap,
    formStyles,
    css`
      .deelnemer-row .remove-deelnemer {
        visibility: hidden;
      }
      .deelnemer-row:hover .remove-deelnemer {
        visibility: visible;
      }
    `,
  ];

  @property({ attribute: false })
  opstapplaatsen: Locatie[] = [];

  @property({ attribute: false })
  aanmeldingen: Aanmelding[] = [];

  @property({ attribute: false })
  projecten: Project[] = [];

  @property({ attribute: false })
  vervoerstoer?: Vervoerstoer;

  @state()
  private routes: LocalRoute[] = [];

  @state()
  private kaartRoutes: KaartRoute[] = [];

  @state()
  chauffeurs: OverigPersoon[] = [];

  @state()
  private routeSamenvattingen: RouteSamenvatting[] = [];

  // What is being dragged
  private dragSource:
    | { kind: 'unallocated'; locatie: Locatie }
    | { kind: 'stop'; stop: LocalStop; fromRoute: LocalRoute }
    | null = null;

  // Where it will be dropped: chauffeurId + insert position (null = append at end)
  @state()
  private dragOverTarget: {
    chauffeurId: number;
    beforeStopIndex: number | null;
  } | null = null;

  protected override update(
    changedProperties: PropertyValues<RoutesSelecterenComponent>,
  ): void {
    if (changedProperties.has('vervoerstoer') && this.vervoerstoer) {
      this.routes = this.vervoerstoer.routes.map((route) => ({
        chauffeur: route.chauffeur,
        stops: route.stops.map((stop) => ({
          locatie: stop.locatie,
          aanmeldingen: stop.aanmeldersOpTePikken,
        })),
      }));
      this.updateKaartRoutes();
      this.chauffeurs = this.vervoerstoer.routes.map((r) => r.chauffeur);
    } else if (changedProperties.has('projecten') && !this.vervoerstoer) {
      this.chauffeurs = this.projecten
        .flatMap((p) => p.begeleiders)
        .filter((v, i, self) => self.findIndex((b) => b.id === v.id) === i);
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
    return this.aanmeldingen.filter(
      (a) => a.opstapplaats?.id === locatie.id && !allocated.has(a.id),
    );
  }

  private get unallocatedOpstapplaatsen(): Locatie[] {
    return this.opstapplaatsen.filter((p) => this.unallocatedAt(p).length > 0);
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

  private onDragOverZone(e: DragEvent, route: LocalRoute) {
    if (!this.dragSource) return;
    e.preventDefault();
    e.stopPropagation();
    this.dragOverTarget = {
      chauffeurId: route.chauffeur.id,
      beforeStopIndex: null,
    };
  }

  private onDragOverStop(e: DragEvent, route: LocalRoute, stopIndex: number) {
    if (!this.dragSource) return;
    e.preventDefault();
    e.stopPropagation();
    this.dragOverTarget = {
      chauffeurId: route.chauffeur.id,
      beforeStopIndex: stopIndex,
    };
  }

  private onDrop(
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
      // Moving an existing stop — remove it from the source route first
      const isSameRoute = source.fromRoute === route;
      const sourceIndex = source.fromRoute.stops.indexOf(source.stop);
      source.fromRoute.stops = source.fromRoute.stops.filter(
        (s) => s !== source.stop,
      );
      newStop = source.stop;

      // Adjust beforeStopIndex after removal from same route
      if (
        isSameRoute &&
        beforeStopIndex !== null &&
        sourceIndex < beforeStopIndex
      ) {
        beforeStopIndex--;
      }
    }

    // Samenvoegen als de route al een stop heeft op dezelfde locatie
    const bestaandeStop = route.stops.find(
      (s) => s.locatie.id === newStop.locatie.id,
    );
    if (bestaandeStop) {
      bestaandeStop.aanmeldingen = [...bestaandeStop.aanmeldingen, ...newStop.aanmeldingen];
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

  private removeAanmelding(
    route: LocalRoute,
    stop: LocalStop,
    aanmelding: Aanmelding,
  ) {
    stop.aanmeldingen = stop.aanmeldingen.filter((a) => a !== aanmelding);
    if (stop.aanmeldingen.length === 0) {
      route.stops = route.stops.filter((s) => s !== stop);
    }
    this.routes = [...this.routes];
    this.updateKaartRoutes();
  }

  private removeStop(route: LocalRoute, stop: LocalStop) {
    route.stops = route.stops.filter((s) => s !== stop);
    this.routes = [...this.routes];
    this.updateKaartRoutes();
  }

  private googleMapsUrl(route: LocalRoute): string {
    const origin = route.chauffeur.verblijfadres
      ? formatAdres(route.chauffeur.verblijfadres)
      : FALLBACK_ADRES;
    const destination = deriveDestination(this.projecten);
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
          : stop.locatie.naam,
      )
      .join('|');
    if (waypoints) {
      params.set('waypoints', waypoints);
    }
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  private reset() {
    const begeleiders = this.projecten
      .flatMap((p) => p.begeleiders)
      .filter((v, i, self) => self.findIndex((b) => b.id === v.id) === i);
    this.routes = begeleiders.map((c) => ({ chauffeur: c, stops: [] }));
    this.updateKaartRoutes();
    this.chauffeurs = begeleiders;
  }

  private updateKaartRoutes() {
    this.kaartRoutes = this.routes.map((route) => ({
      naam: fullName(route.chauffeur),
      startAdres: route.chauffeur.verblijfadres,
      tussenstops: route.stops.map((s) => s.locatie),
    }));
  }

  private save() {
    this.dispatchEvent(
      new CustomEvent<LocalRoute[]>('routes-saved', {
        detail: this.routes,
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
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
          <ul class="list-group">
            ${this.unallocatedOpstapplaatsen.map((locatie) => {
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
                <span class="badge text-bg-secondary">${entities(aantalPassagiers, 'passagier')}</span>
                ${this.routeSamenvattingen[routeIdx]
                  ? html`
                    <span class="badge text-bg-secondary">± ${formatDuur(this.routeSamenvattingen[routeIdx].durationSeconds)}</span>
                    <span class="badge text-bg-secondary">${formatAfstand(this.routeSamenvattingen[routeIdx].distanceMeters)}</span>
                  `
                  : ''}
              </div>
              <div
                class="drop-zone border rounded p-2 mb-2 ${this.dragOverTarget
                  ?.chauffeurId === route.chauffeur.id &&
                this.dragOverTarget?.beforeStopIndex === null
                  ? 'border-primary bg-light'
                  : ''}"
                style="min-height: 60px"
                @dragover=${(e: DragEvent) => this.onDragOverZone(e, route)}
                @dragleave=${(e: DragEvent) => {
                  // Only clear if leaving the zone entirely (not entering a child)
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
                @drop=${(e: DragEvent) => this.onDrop(e, route, null)}
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
                            this.onDragOverStop(e, route, stopIndex)}
                          @drop=${(e: DragEvent) =>
                            this.onDrop(e, route, stopIndex)}
                        ></div>
                        <div
                          class="d-flex justify-content-between align-items-start mb-1 pb-1 border-bottom"
                          draggable="true"
                          @dragstart=${(e: DragEvent) =>
                            this.onDragStartStop(e, stop, route)}
                          @dragend=${() => this.onDragEnd()}
                          @dragover=${(e: DragEvent) =>
                            this.onDragOverStop(e, route, stopIndex)}
                          @drop=${(e: DragEvent) =>
                            this.onDrop(e, route, stopIndex)}
                        >
                          <div class="d-flex align-items-start gap-1">
                            <rock-icon
                              icon="gripHorizontal"
                              style="cursor:grab; margin-top:2px"
                            ></rock-icon>
                            <div>
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
                                    html` <li
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
                                        @click=${() =>
                                          this.removeAanmelding(route, stop, a)}
                                      >
                                        ×
                                      </button>
                                    </li>`,
                                )}
                              </ul>
                            </div>
                          </div>
                          <button
                            class="btn btn-sm btn-outline-danger"
                            @click=${() => this.removeStop(route, stop)}
                          >
                            ×
                          </button>
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
        .bestemming=${deriveDestination(this.projecten)}
        @routes-berekend=${(e: CustomEvent<RouteSamenvatting[]>) => {
          this.routeSamenvattingen = e.detail;
        }}
      ></rock-vervoerstoer-kaart>
      <div class="mt-3 d-flex gap-2">
        <button
          class="btn btn-primary"
          @click=${() => this.save()}
          ?disabled=${this.routes.length === 0}
        >
          Opslaan en verder
        </button>
        <button class="btn btn-outline-secondary" @click=${() => this.reset()}>
          Reset
        </button>
      </div>
    `;
  }
}
