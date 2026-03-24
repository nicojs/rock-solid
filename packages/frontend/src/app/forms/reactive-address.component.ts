import { html, nothing, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { UpsertableAdres, plaatsToString } from '@rock-solid/shared';
import { capitalize, ensureGoogleMapsLoaded } from '../shared';
import { AdresControl } from './form-control';
import { FormControlElement } from './form-element';
import { adresFieldControls } from './common';
import {
  parseAddressComponents,
  toUpsertablePlaats,
} from './google-places-utils';

@customElement('rock-reactive-address')
export class ReactiveAddressComponent<
  TEntity,
> extends FormControlElement<TEntity> {
  @property({ attribute: false })
  public control!: AdresControl<TEntity>;

  @state()
  private mapsLoaded = false;

  @state()
  private enabled: boolean | undefined;

  private containerRef = createRef<HTMLDivElement>();
  private plaatsValidatieRef = createRef<HTMLInputElement>();

  get #googlePlacesInputElementId() {
    return `${this.path}_${this.control.name}_autocomplete`;
  }

  get #googlePlacesElement() {
    return this.containerRef.value?.querySelector('gmp-place-autocomplete') as
      | google.maps.places.PlaceAutocompleteElement
      | undefined;
  }

  private get adres(): UpsertableAdres | undefined {
    return this.entity[this.control.name] as unknown as
      | UpsertableAdres
      | undefined;
  }

  private set adres(val: UpsertableAdres | undefined) {
    (this.entity[this.control.name] as unknown as UpsertableAdres | undefined) =
      val;
    this.requestUpdate();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.enabled =
      this.control.required !== false ? true : this.adres !== undefined;
    ensureGoogleMapsLoaded().then((loaded) => {
      this.mapsLoaded = loaded;
    });
  }

  protected override updated(changed: PropertyValues) {
    if (
      this.mapsLoaded &&
      this.enabled &&
      (changed.has('mapsLoaded') || changed.has('enabled'))
    ) {
      this.#initAutocomplete();
    }
    this.#updatePlaatsValidity();
  }

  #updatePlaatsValidity() {
    const input = this.plaatsValidatieRef.value;
    if (!input) return;
    const hasPlaats = Boolean(this.adres?.plaats?.deelgemeente);
    input.setCustomValidity(hasPlaats ? '' : 'required');
    if (hasPlaats) {
      this.#googlePlacesElement?.classList.remove('is-invalid');
    } else {
      this.#googlePlacesElement?.classList.add('is-invalid');
    }
  }

  #initAutocomplete() {
    const container = this.containerRef.value;
    if (!container) return;

    // Clear previous element if any
    this.#googlePlacesElement?.remove();

    const el = new google.maps.places.PlaceAutocompleteElement({
      types: ['address'],
      requestedLanguage: 'nl',
    });
    el.id = this.#googlePlacesInputElementId;
    el.style.width = '100%';
    container.appendChild(el);

    el.addEventListener('gmp-select', ((event: Event) => {
      const selectEvent = event as unknown as {
        placePrediction?: { toPlace(): google.maps.places.Place };
        place?: google.maps.places.Place;
      };
      const place = selectEvent.placePrediction?.toPlace() ?? selectEvent.place;
      if (!place) return;
      void place.fetchFields({ fields: ['addressComponents'] }).then(() => {
        if (!place.addressComponents) return;
        const parsed = parseAddressComponents(place.addressComponents);
        this.adres = {
          ...this.adres,
          straatnaam: parsed.straatnaam,
          huisnummer: parsed.huisnummer,
          plaats: toUpsertablePlaats(parsed),
        };
      });
    }) as EventListener);

    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    });
  }

  private toggleEnabled(checked: boolean) {
    this.enabled = checked;
    if (!checked) {
      this.adres = undefined;
    } else if (!this.adres) {
      this.adres = {} as UpsertableAdres;
    }
  }

  override render() {
    const label = this.control.requiredLabel ?? capitalize(this.control.name);
    const adresPath = `${this.path}_${this.control.name}`;

    return html`
      ${this.control.required === false
        ? html`<div class="mb-3 row">
            <div class="col-lg-2 col-md-4"></div>
            <div class="col-lg-10 col-md-8">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="${this.path}_${this.control.name}_toggle"
                  .checked=${this.enabled ?? false}
                  @change=${(e: Event) =>
                    this.toggleEnabled(
                      (e.target as HTMLInputElement).checked,
                    )}
                />
                <label
                  class="form-check-label"
                  for="${this.path}_${this.control.name}_toggle"
                  >${label}</label
                >
              </div>
            </div>
          </div>`
        : nothing}
      ${this.enabled
        ? html`
            ${this.mapsLoaded
              ? html`<div class="mb-3 row">
                  <div class="col-lg-2 col-md-4">
                    <label
                      for="${this.#googlePlacesInputElementId}"
                      class="col-form-label"
                      >Zoek adres</label
                    >
                  </div>
                  <div class="col-lg-10 col-md-8" ${ref(this.containerRef)}>
                    <input
                      ${ref(this.plaatsValidatieRef)}
                      name="plaats-validatie"
                      tabindex="-1"
                      style="opacity:0;height:0;position:absolute;pointer-events:none"
                    />
                    <div class="invalid-feedback">
                      Selecteer een plaats via "Zoek adres"
                    </div>
                  </div>
                </div>`
              : nothing}
            <rock-reactive-form-control-list
              .controls=${adresFieldControls}
              .entity=${this.adres ?? {}}
              .path=${adresPath}
            ></rock-reactive-form-control-list>
            <div class="mb-3 row">
              <div class="col-lg-2 col-md-4">
                <label class="col-form-label">Plaats</label>
              </div>
              <div class="col-lg-10 col-md-8">
                <input
                  type="text"
                  class="form-control-plaintext"
                  readonly
                  .value=${plaatsToString(this.adres?.plaats)}
                />
              </div>
            </div>
          `
        : nothing}
    `;
  }
}
