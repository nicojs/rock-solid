import { html, nothing, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { UpsertablePlaats, plaatsToString } from '@rock-solid/shared';
import { capitalize, ensureGoogleMapsLoaded } from '../shared';
import { PlaatsControl } from './form-control';
import { FormControlElement } from './form-element';
import {
  parseAddressComponents,
  toUpsertablePlaats,
} from './google-places-utils';

async function reverseGeocodePostcode(
  location: google.maps.LatLng | google.maps.LatLngLiteral,
): Promise<string> {
  const geocoder = new google.maps.Geocoder();
  try {
    const response = await geocoder.geocode({ location });
    for (const result of response.results) {
      for (const comp of result.address_components) {
        if (comp.types.includes('postal_code')) {
          return comp.long_name;
        }
      }
    }
  } catch {
    // Geocoding failed, postal code stays empty
  }
  return '';
}

@customElement('rock-reactive-plaats')
export class ReactivePlaatsComponent<
  TEntity,
> extends FormControlElement<TEntity> {
  @property({ attribute: false })
  public control!: PlaatsControl<TEntity>;

  @state()
  private mapsLoaded = false;

  private containerRef = createRef<HTMLDivElement>();
  private autocompleteInitialized = false;

  private get plaats(): UpsertablePlaats | undefined {
    return this.entity[this.control.name] as unknown as
      | UpsertablePlaats
      | undefined;
  }

  private set plaats(val: UpsertablePlaats | undefined) {
    const old = this.plaats;
    (this.entity[this.control.name] as unknown as
      | UpsertablePlaats
      | undefined) = val;
    this.requestUpdate('plaats', old);
  }

  override connectedCallback() {
    super.connectedCallback();
    ensureGoogleMapsLoaded().then((loaded) => {
      this.mapsLoaded = loaded;
    });
  }

  protected override updated(changed: PropertyValues) {
    if (changed.has('mapsLoaded') && this.mapsLoaded) {
      this.#initAutocomplete();
    }
  }

  #initAutocomplete() {
    const container = this.containerRef.value;
    if (!container || this.autocompleteInitialized) return;
    this.autocompleteInitialized = true;

    const el = new google.maps.places.PlaceAutocompleteElement({
      types: ['(regions)'],
      requestedLanguage: 'nl',
    });
    el.style.width = '100%';
    container.appendChild(el);

    el.addEventListener('gmp-select', ((event: Event) => {
      const selectEvent = event as unknown as {
        placePrediction?: { toPlace(): google.maps.places.Place };
        place?: google.maps.places.Place;
      };
      const place =
        selectEvent.placePrediction?.toPlace() ?? selectEvent.place;
      if (!place) return;
      void place
        .fetchFields({ fields: ['addressComponents', 'location'] })
        .then(async () => {
          if (!place.addressComponents) return;
          const parsed = parseAddressComponents(place.addressComponents);

          if (!parsed.postcode && place.location) {
            parsed.postcode = await reverseGeocodePostcode(place.location);
          }

          this.plaats = toUpsertablePlaats(parsed);
        });
    }) as EventListener);

    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    });
  }

  override render() {
    const label = this.control.label ?? capitalize(this.control.name);

    return html`<div class="mb-3 row">
      <div class="col-lg-2 col-md-4">
        <label class="col-form-label">${label}</label>
      </div>
      <div class="col-lg-10 col-md-8">
        ${this.mapsLoaded
          ? html`<div ${ref(this.containerRef)}></div>`
          : html`<input
              type="text"
              class="form-control"
              placeholder="Laden..."
              disabled
            />`}
        ${this.plaats
          ? html`<small class="form-text text-muted"
              >${plaatsToString(this.plaats)}</small
            >`
          : nothing}
      </div>
    </div>`;
  }
}
