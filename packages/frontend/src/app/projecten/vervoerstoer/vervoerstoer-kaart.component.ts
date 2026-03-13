import { Adres, Locatie } from '@rock-solid/shared';
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export interface KaartRoute {
  naam: string;
  startAdres?: Adres;
  tussenstops: Locatie[];
}

export interface RouteSamenvatting {
  durationSeconds: number;
  distanceMeters: number;
}

const KLEUREN = [
  '#4285F4', // blauw
  '#EA4335', // rood
  '#34A853', // groen
  '#FBBC04', // geel
  '#9C27B0', // paars
  '#FF7043', // oranje
];

const FALLBACK_ADRES = 'Ter Rivierenlaan 152, 2100 Deurne, België';

function formatAdres(adres: Adres): string {
  return `${adres.straatnaam} ${adres.huisnummer}, ${adres.plaats.postcode} ${adres.plaats.gemeente}, België`;
}

let mapsApiPromise: Promise<void> | null = null;

const EARTH_RADIUS = 6371000; // meters

function bearing(from: google.maps.LatLng, to: google.maps.LatLng): number {
  const lat1 = (from.lat() * Math.PI) / 180;
  const lat2 = (to.lat() * Math.PI) / 180;
  const dLng = ((to.lng() - from.lng()) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return Math.atan2(y, x);
}

function movePoint(point: google.maps.LatLng, distMeters: number, bearingRad: number): google.maps.LatLng {
  const d = distMeters / EARTH_RADIUS;
  const lat1 = (point.lat() * Math.PI) / 180;
  const lng1 = (point.lng() * Math.PI) / 180;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearingRad));
  const lng2 = lng1 + Math.atan2(Math.sin(bearingRad) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
  return new google.maps.LatLng((lat2 * 180) / Math.PI, (lng2 * 180) / Math.PI);
}

function offsetPath(path: google.maps.LatLng[], offsetMeters: number): google.maps.LatLng[] {
  return path.map((point, idx) => {
    const prev = path[idx - 1];
    const next = path[idx + 1];
    const ref = next ?? prev;
    if (!ref) return point;
    const b = bearing(point, ref);
    return movePoint(point, offsetMeters, b + Math.PI / 2);
  });
}

function markerIcon(kleur: string, label: string): google.maps.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="27" height="43" viewBox="0 0 27 43">
    <path fill="${kleur}" d="M13.5 0C6.04 0 0 6.04 0 13.5c0 9.75 13.5 29.5 13.5 29.5S27 23.25 27 13.5C27 6.04 20.96 0 13.5 0z"/>
    <text x="13.5" y="19" text-anchor="middle" fill="white" font-size="12" font-family="Arial,sans-serif" font-weight="bold">${label}</text>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(27, 43),
    anchor: new google.maps.Point(13.5, 43),
  };
}

function loadGoogleMapsApi(apiKey: string): Promise<void> {
  if (mapsApiPromise) return mapsApiPromise;
  mapsApiPromise = new Promise<void>((resolve, reject) => {
    const callbackName = '__googleMapsReady';
    (window as unknown as Record<string, unknown>)[callbackName] = resolve;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&loading=async`;
    script.async = true;
    script.onerror = () => {
      mapsApiPromise = null;
      reject(new Error('Google Maps script kon niet geladen worden'));
    };
    document.head.appendChild(script);
  });
  return mapsApiPromise;
}

@customElement('rock-vervoerstoer-kaart')
export class VervoerstoerKaartComponent extends LitElement {
  // Light DOM zodat Google Maps stijlen correct werken
  override createRenderRoot() {
    return this;
  }

  @property({ attribute: false })
  routes: KaartRoute[] = [];

  @property()
  bestemming = '';

  @state()
  private status: 'laden' | 'niet-beschikbaar' | 'gereed' = 'laden';

  private map?: google.maps.Map;
  private polylines: google.maps.Polyline[] = [];
  private markers: google.maps.Marker[] = [];
  private cachedResults: { result: google.maps.DirectionsResult; kleur: string }[] = [];
  private mapEl?: HTMLElement;
  private tekenGeneratie = 0;
  private tekenTimeout?: ReturnType<typeof setTimeout>;

  override async connectedCallback() {
    super.connectedCallback();
    try {
      const res = await fetch('/api/config');
      const config = (await res.json()) as { googleMapsApiKey: string | null };
      if (!config.googleMapsApiKey) {
        this.status = 'niet-beschikbaar';
        return;
      }
      await loadGoogleMapsApi(config.googleMapsApiKey);
      this.status = 'gereed';
    } catch {
      this.status = 'niet-beschikbaar';
    }
  }

  protected override updated(changed: PropertyValues) {
    if (this.status !== 'gereed') return;

    if (changed.has('status')) {
      this.#initMap();
    }
    if (changed.has('routes') || changed.has('bestemming') || changed.has('status')) {
      clearTimeout(this.tekenTimeout);
      this.tekenTimeout = setTimeout(() => void this.#tekenRoutes(), 400);
    }
  }

  #initMap() {
    this.mapEl = this.querySelector('#vervoerstoer-map') as HTMLElement;
    if (!this.mapEl) return;
    this.map = new google.maps.Map(this.mapEl, {
      zoom: 10,
      center: { lat: 51.22, lng: 4.4 }, // Antwerpen regio
      mapTypeControl: false,
    });
    this.map.addListener('zoom_changed', () => this.#tekenPolylines());
  }

  async #tekenRoutes() {
    if (!this.map || !this.bestemming) return;

    const generatie = ++this.tekenGeneratie;
    const service = new google.maps.DirectionsService();
    const nieuweResultaten: { result: google.maps.DirectionsResult; kleur: string }[] = [];

    for (let i = 0; i < this.routes.length; i++) {
      if (generatie !== this.tekenGeneratie) return;

      const route = this.routes[i]!;
      const kleur = KLEUREN[i % KLEUREN.length]!;
      const origin = route.startAdres ? formatAdres(route.startAdres) : FALLBACK_ADRES;
      const waypoints = route.tussenstops.map((loc) => ({
        location: loc.adres ? formatAdres(loc.adres) : loc.naam,
        stopover: true,
      }));

      try {
        const result = await service.route({
          origin,
          destination: this.bestemming,
          waypoints,
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false,
        });
        if (generatie !== this.tekenGeneratie) return;
        nieuweResultaten.push({ result, kleur });
      } catch {
        // Route kan niet berekend worden — sla over
      }
    }

    if (generatie !== this.tekenGeneratie) return;

    this.cachedResults = nieuweResultaten;

    // Teken nieuw eerst, verwijder oud daarna — voorkomt flikkering
    const oudePolylines = this.polylines;
    const oudeMarkers = this.markers;
    this.polylines = [];
    this.markers = [];

    this.#tekenPolylines();
    this.#tekenMarkers();

    for (const p of oudePolylines) p.setMap(null);
    for (const m of oudeMarkers) m.setMap(null);

    const samenvattingen: RouteSamenvatting[] = nieuweResultaten.map(({ result }) => {
      const legs = result.routes[0]!.legs;
      return {
        durationSeconds: legs.reduce((s, l) => s + l.duration!.value, 0),
        distanceMeters: legs.reduce((s, l) => s + l.distance!.value, 0),
      };
    });
    this.dispatchEvent(new CustomEvent<RouteSamenvatting[]>('routes-berekend', {
      detail: samenvattingen,
      bubbles: true,
      composed: true,
    }));
  }

  #tekenMarkers() {
    if (!this.map) return;
    const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const { result, kleur } of this.cachedResults) {
      const legs = result.routes[0]!.legs;
      legs.forEach((leg, legIdx) => {
        if (legIdx === 0) {
          this.markers.push(new google.maps.Marker({
            map: this.map,
            position: leg.start_location,
            icon: markerIcon(kleur, labels[0]!),
          }));
        }
        this.markers.push(new google.maps.Marker({
          map: this.map,
          position: leg.end_location,
          icon: markerIcon(kleur, labels[legIdx + 1] ?? ''),
        }));
      });
    }
  }

  #tekenPolylines() {
    if (!this.map) return;
    const oudePolylines = this.polylines;
    this.polylines = [];

    const n = this.cachedResults.length;
    if (n === 0) return;

    // Bereken offset in meters op basis van huidige zoom (4 pixels per route)
    const zoom = this.map.getZoom() ?? 10;
    const metersPerPixel = (156543.03 * Math.cos((51.22 * Math.PI) / 180)) / Math.pow(2, zoom);
    const offsetStep = 4 * metersPerPixel;

    for (let i = 0; i < n; i++) {
      const { result, kleur } = this.cachedResults[i]!;
      const offsetMeters = (i - (n - 1) / 2) * offsetStep;
      const rawPath = result.routes[0]!.overview_path;
      const path = offsetMeters === 0 ? rawPath : offsetPath(rawPath, offsetMeters);

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
      return html`<p class="text-muted fst-italic">Kaart niet beschikbaar (geen Google Maps API key).</p>`;
    }
    if (this.status === 'laden') {
      return html`<rock-loading></rock-loading>`;
    }
    return html`
      <div id="vervoerstoer-map" style="height:420px;width:100%;border-radius:0.375rem;overflow:hidden"></div>
    `;
  }
}
