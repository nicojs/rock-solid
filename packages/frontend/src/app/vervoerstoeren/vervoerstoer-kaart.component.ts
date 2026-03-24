import { Adres, Locatie } from '@rock-solid/shared';
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { httpClient } from '../shared/http-client';
import { ensureGoogleMapsLoaded } from '../shared/google-maps.service';

export interface KaartRoute {
  naam: string;
  startAdres?: Adres;
  tussenstops: Locatie[];
}

export interface RouteSamenvatting {
  durationSeconds: number;
  distanceMeters: number;
}

interface BackendLeg {
  durationSeconds: number;
  distanceMeters: number;
  startLocation?: { lat: number; lng: number };
  endLocation?: { lat: number; lng: number };
}

interface BackendRouteResponse {
  encodedPolyline?: string;
  legs: BackendLeg[];
}

const KLEUREN = [
  '#4285F4',
  '#EA4335',
  '#34A853',
  '#FBBC04',
  '#9C27B0',
  '#FF7043',
];

const FALLBACK_ADRES = 'Ter Rivierenlaan 152, 2100 Deurne, België';

function formatAdres(adres: Adres): string {
  return `${adres.straatnaam} ${adres.huisnummer}, ${adres.plaats.postcode} ${adres.plaats.gemeente}, België`;
}


const EARTH_RADIUS = 6371000;

function bearing(from: google.maps.LatLng, to: google.maps.LatLng): number {
  const lat1 = (from.lat() * Math.PI) / 180;
  const lat2 = (to.lat() * Math.PI) / 180;
  const dLng = ((to.lng() - from.lng()) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return Math.atan2(y, x);
}

function movePoint(
  point: google.maps.LatLng,
  distMeters: number,
  bearingRad: number,
): google.maps.LatLng {
  const d = distMeters / EARTH_RADIUS;
  const lat1 = (point.lat() * Math.PI) / 180;
  const lng1 = (point.lng() * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
      Math.cos(lat1) * Math.sin(d) * Math.cos(bearingRad),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );
  return new google.maps.LatLng((lat2 * 180) / Math.PI, (lng2 * 180) / Math.PI);
}

function offsetPath(
  path: google.maps.LatLng[],
  offsetMeters: number,
): google.maps.LatLng[] {
  return path.map((point, idx) => {
    const prev = path[idx - 1];
    const next = path[idx + 1];
    const ref = next ?? prev;
    if (!ref) return point;
    const b = bearing(point, ref);
    return movePoint(point, offsetMeters, b + Math.PI / 2);
  });
}

function markerContent(kleur: string, label: string): HTMLElement {
  const div = document.createElement('div');
  div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="27" height="43" viewBox="0 0 27 43">
    <path fill="${kleur}" d="M13.5 0C6.04 0 0 6.04 0 13.5c0 9.75 13.5 29.5 13.5 29.5S27 23.25 27 13.5C27 6.04 20.96 0 13.5 0z"/>
    <text x="13.5" y="19" text-anchor="middle" fill="white" font-size="12" font-family="Arial,sans-serif" font-weight="bold">${label}</text>
  </svg>`;
  return div;
}


interface CachedRoute {
  encodedPolyline: string;
  legs: BackendLeg[];
  kleur: string;
}

@customElement('rock-vervoerstoer-kaart')
export class VervoerstoerKaartComponent extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ attribute: false })
  routes: KaartRoute[] = [];

  @property()
  bestemming = '';

  @property({ type: Number, attribute: false })
  focusLegIndex: number | null = null;

  @state()
  private status: 'laden' | 'niet-beschikbaar' | 'gereed' = 'laden';

  private map?: google.maps.Map;
  private polylines: google.maps.Polyline[] = [];
  private markers: google.maps.marker.AdvancedMarkerElement[] = [];
  private cachedResults: CachedRoute[] = [];
  private mapEl?: HTMLElement;
  private tekenGeneratie = 0;
  private tekenTimeout?: ReturnType<typeof setTimeout>;

  override connectedCallback() {
    super.connectedCallback();
    (async () => {
      const loaded = await ensureGoogleMapsLoaded();
      this.status = loaded ? 'gereed' : 'niet-beschikbaar';
    })();
  }

  protected override updated(changed: PropertyValues) {
    if (this.status !== 'gereed') return;

    if (changed.has('status')) {
      this.#initMap();
    }
    if (changed.has('focusLegIndex')) {
      this.#zoomToLeg();
    }
    if (
      changed.has('routes') ||
      changed.has('bestemming') ||
      changed.has('status')
    ) {
      clearTimeout(this.tekenTimeout);
      this.tekenTimeout = setTimeout(() => void this.#tekenRoutes(), 400);
    }
  }

  #zoomToLeg() {
    if (
      !this.map ||
      this.focusLegIndex === null ||
      this.cachedResults.length === 0
    )
      return;
    const { encodedPolyline, legs } = this.cachedResults[0]!;
    const path = google.maps.geometry?.encoding?.decodePath(encodedPolyline);
    if (!path || path.length === 0 || this.focusLegIndex >= legs.length) return;

    const totalDistance = legs.reduce((s, l) => s + l.distanceMeters, 0);
    let startFraction = 0;
    for (let i = 0; i < this.focusLegIndex; i++) {
      startFraction += legs[i]!.distanceMeters / totalDistance;
    }
    const endFraction =
      startFraction + legs[this.focusLegIndex]!.distanceMeters / totalDistance;

    const startIdx = Math.round(startFraction * (path.length - 1));
    const endIdx = Math.round(endFraction * (path.length - 1));

    const bounds = new google.maps.LatLngBounds();
    for (let i = startIdx; i <= endIdx; i++) {
      bounds.extend(path[i]!);
    }
    this.map.fitBounds(bounds, 60);
  }

  #initMap() {
    this.mapEl = this.querySelector('#vervoerstoer-map') as HTMLElement;
    if (!this.mapEl) return;
    this.map = new google.maps.Map(this.mapEl, {
      zoom: 10,
      center: { lat: 51.22, lng: 4.4 },
      mapTypeControl: false,
      mapId: 'vervoerstoer-kaart',
    });
    this.map.addListener('zoom_changed', () => this.#tekenPolylines());
  }

  async #tekenRoutes() {
    if (!this.map || !this.bestemming) return;

    const generatie = ++this.tekenGeneratie;
    const nieuweResultaten: CachedRoute[] = [];

    for (let i = 0; i < this.routes.length; i++) {
      if (generatie !== this.tekenGeneratie) return;

      const route = this.routes[i]!;
      const kleur = KLEUREN[i % KLEUREN.length]!;
      const origin = route.startAdres
        ? formatAdres(route.startAdres)
        : FALLBACK_ADRES;
      const waypoints = route.tussenstops.map((loc) =>
        loc.adres ? formatAdres(loc.adres) : loc.naam,
      );

      try {
        const response = await httpClient.fetch('/api/google-maps/route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin,
            destination: this.bestemming,
            waypoints,
          }),
        });
        const data = (await response.json()) as BackendRouteResponse | null;
        if (generatie !== this.tekenGeneratie) return;
        if (data?.encodedPolyline) {
          nieuweResultaten.push({
            encodedPolyline: data.encodedPolyline,
            legs: data.legs,
            kleur,
          });
        }
      } catch {
        // Route kan niet berekend worden
      }
    }

    if (generatie !== this.tekenGeneratie) return;

    this.cachedResults = nieuweResultaten;

    const oudePolylines = this.polylines;
    const oudeMarkers = this.markers;
    this.polylines = [];
    this.markers = [];

    this.#tekenPolylines();
    this.#tekenMarkers();

    for (const p of oudePolylines) p.setMap(null);
    for (const m of oudeMarkers) m.map = null;

    const samenvattingen: RouteSamenvatting[] = nieuweResultaten.map(
      ({ legs }) => ({
        durationSeconds: legs.reduce((s, l) => s + l.durationSeconds, 0),
        distanceMeters: legs.reduce((s, l) => s + l.distanceMeters, 0),
      }),
    );
    this.dispatchEvent(
      new CustomEvent<RouteSamenvatting[]>('routes-berekend', {
        detail: samenvattingen,
        bubbles: true,
        composed: true,
      }),
    );
  }

  #tekenMarkers() {
    if (!this.map) return;
    const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const { legs, kleur } of this.cachedResults) {
      // Place markers using actual leg start/end locations from the API
      for (let legIdx = 0; legIdx < legs.length; legIdx++) {
        const leg = legs[legIdx]!;
        if (legIdx === 0 && leg.startLocation) {
          this.markers.push(
            new google.maps.marker.AdvancedMarkerElement({
              map: this.map,
              position: leg.startLocation,
              content: markerContent(kleur, labels[0]!),
            }),
          );
        }
        if (leg.endLocation) {
          this.markers.push(
            new google.maps.marker.AdvancedMarkerElement({
              map: this.map,
              position: leg.endLocation,
              content: markerContent(kleur, labels[legIdx + 1] ?? ''),
            }),
          );
        }
      }
    }
  }

  #tekenPolylines() {
    if (!this.map) return;
    const oudePolylines = this.polylines;
    this.polylines = [];

    const n = this.cachedResults.length;
    if (n === 0) return;

    const zoom = this.map.getZoom() ?? 10;
    const metersPerPixel =
      (156543.03 * Math.cos((51.22 * Math.PI) / 180)) / Math.pow(2, zoom);
    const offsetStep = 4 * metersPerPixel;

    for (let i = 0; i < n; i++) {
      const { encodedPolyline, kleur } = this.cachedResults[i]!;
      const rawPath =
        google.maps.geometry?.encoding?.decodePath(encodedPolyline) ?? [];
      const offsetMeters = (i - (n - 1) / 2) * offsetStep;
      const path =
        offsetMeters === 0 ? rawPath : offsetPath(rawPath, offsetMeters);

      const polyline = new google.maps.Polyline({
        map: this.map,
        path,
        strokeColor: kleur,
        strokeWeight: 5,
        strokeOpacity: 0.8,
      });
      this.polylines.push(polyline);
    }
    for (const p of oudePolylines) p.setMap(null);
  }

  override render() {
    if (this.status === 'niet-beschikbaar') {
      return html`<p class="text-muted fst-italic">
        Kaart niet beschikbaar (geen Google Maps API key).
      </p>`;
    }
    if (this.status === 'laden') {
      return html`<rock-loading></rock-loading>`;
    }
    return html`
      <div
        id="vervoerstoer-map"
        style="height:420px;width:100%;border-radius:0.375rem;overflow:hidden"
      ></div>
    `;
  }
}
