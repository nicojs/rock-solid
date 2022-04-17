import { Plaats } from '@rock-solid/shared';
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { createRef, ref } from 'lit/directives/ref.js';
import {
  AutocompleteComponent,
  capitalize,
  FocusState,
  showPlaats,
  plaatsService,
  TypeAheadHint,
} from '../shared';
import { PlaatsControl } from './form-control';

@customElement('rock-reactive-form-plaats')
export class ReactiveFormPlaats<TEntity> extends LitElement {
  @property({ attribute: false })
  public control!: PlaatsControl<TEntity>;

  @property({ attribute: false })
  public entity!: TEntity;

  @property({ attribute: false })
  private validationMessage = '';

  private inputRef = createRef<HTMLInputElement>();
  private get input() {
    return this.inputRef.value!;
  }

  @state()
  public get plaatsValue() {
    return this.entity[this.control.name] as unknown as Plaats | undefined;
  }
  public set plaatsValue(val: Plaats | undefined) {
    const oldValue = this.plaatsValue;
    (this.entity[this.control.name] as unknown as Plaats | undefined) = val;
    this.updateValidity();
    this.requestUpdate('plaatsValue', oldValue);
  }

  private updateValidity() {
    if (this.plaatsValue || !this.control.validators?.required) {
      this.input.setCustomValidity(''); // valid
    } else {
      this.input.setCustomValidity('Selecteer een plaats');
    }
  }

  protected override update(
    changedProperties: PropertyValues<ReactiveFormPlaats<TEntity>>,
  ): void {
    super.update(changedProperties);
    if (changedProperties.has('entity')) {
      this.updateValidity();
    }
  }

  protected override updated(
    changedProperties: PropertyValues<ReactiveFormPlaats<TEntity>>,
  ) {
    if (changedProperties.has('plaatsValue')) {
      // Manual change to value, make sure the change is reflected inside the autocomplete box
      this.input.dispatchEvent(new InputEvent('input'));
    }
  }

  override createRenderRoot() {
    // Use light dom, so input elements participate in form validation 🤷‍♂️
    return this;
  }

  private updateValidationMessage(e: Event) {
    const inputEl = e.target as HTMLInputElement;
    this.validationMessage = inputEl.validationMessage;
  }

  public override render() {
    return html`<div class="mb-3 row">
      <div class="col-lg-2 col-md-4">
        <label for="${this.control.name}" class="col-form-label"
          >${this.control.label ?? capitalize(this.control.name)}</label
        >
      </div>
      <div class="col-lg-10 col-md-8">
        <input
          ${ref(this.inputRef)}
          type="text"
          class="form-control"
          autocomplete="off"
          id="${this.control.name}"
          name="${this.control.name}"
          .value="${showPlaats(this.plaatsValue)}"
          ?required=${this.control.validators?.required}
          placeholder=${ifDefined(this.control.placeholder)}
          @invalid="${this.updateValidationMessage}"
        />
        <div class="invalid-feedback">${this.validationMessage}</div>
        <rock-autocomplete
          class="col-lg-10 col-md-8"
          placeholder="Woonplaats"
          .searchAction="${(val: string): Promise<TypeAheadHint<Plaats>[]> =>
            plaatsService.getAll({ search: val }).then((plaatsen) =>
              plaatsen.map((plaats) => ({
                text: showPlaats(plaats),
                value: plaats,
              })),
            )}"
          @selected="${(ev: CustomEvent<TypeAheadHint<Plaats>>) => {
            console.log('selected', ev.detail.text);
            this.plaatsValue = ev.detail.value;
            this.input.blur();
            (ev.target as AutocompleteComponent).focusState = FocusState.None;
          }}"
        ></rock-autocomplete>
      </div>
    </div>`;
  }
}
