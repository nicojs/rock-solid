import { html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { createRef, ref } from 'lit/directives/ref.js';
import {
  AutocompleteComponent,
  capitalize,
  FocusState,
  TypeAheadHint,
} from '../shared';
import { AutocompleteControl } from './form-control';
import { FormControlElement } from './form-element';

@customElement('rock-reactive-form-autocomplete')
export class ReactiveFormAutocomplete<
  TEntity,
  TValue,
> extends FormControlElement<TEntity> {
  @property({ attribute: false })
  public control!: AutocompleteControl<TEntity, TValue>;

  @property({ attribute: false })
  private validationMessage = '';

  private inputRef = createRef<HTMLInputElement>();
  private get input() {
    return this.inputRef.value!;
  }

  @state()
  public get value() {
    return this.entity[this.control.name] as unknown as TValue | undefined;
  }
  public set value(val: TValue | undefined) {
    const oldValue = this.value;
    (this.entity[this.control.name] as unknown as TValue | undefined) = val;
    this.updateValidity();
    this.requestUpdate('value', oldValue);
  }

  private updateValidity() {
    if (this.value || !this.control.validators?.required) {
      this.input.setCustomValidity(''); // valid
    } else {
      this.input.setCustomValidity('Selecteer een plaats');
    }
  }

  protected override update(
    changedProperties: PropertyValues<
      ReactiveFormAutocomplete<TEntity, TValue>
    >,
  ): void {
    super.update(changedProperties);
    if (changedProperties.has('entity')) {
      this.updateValidity();
    }
  }

  protected override updated(
    changedProperties: PropertyValues<
      ReactiveFormAutocomplete<TEntity, TValue>
    >,
  ) {
    if (changedProperties.has('value')) {
      // Manual change to value, make sure the change is reflected inside the autocomplete box
      this.input.dispatchEvent(new InputEvent('input'));
    }
  }

  private updateValidationMessage(e: Event) {
    const inputEl = e.target as HTMLInputElement;
    this.validationMessage = inputEl.validationMessage;
  }

  public override render() {
    return html`<div class="mb-3 row">
      <div class="col-lg-2 col-md-4">
        <label for="${this.name}" class="col-form-label"
          >${this.control.label ?? capitalize(this.control.name)}</label
        >
      </div>
      <div class="col-lg-10 col-md-8">
        <input
          ${ref(this.inputRef)}
          type="text"
          class="form-control"
          autocomplete="off"
          id="${this.name}"
          name="${this.control.name}"
          .value="${this.control.labelFor(this.value)}"
          @change=${() => {
            if (this.inputRef.value!.value === '') {
              this.value = undefined;
            }
          }}
          ?required=${this.control.validators?.required}
          placeholder=${ifDefined(this.control.placeholder)}
          @invalid="${this.updateValidationMessage}"
        />
        <div class="invalid-feedback">${this.validationMessage}</div>
        <rock-autocomplete
          class="col-lg-10 col-md-8"
          placeholder="Woonplaats"
          .searchAction="${(search: string): Promise<TypeAheadHint<TValue>[]> =>
            this.control.searchAction(search).then((values) =>
              values.map((value) => ({
                text: this.control.labelFor(value),
                value,
              })),
            )}"
          @selected="${(ev: CustomEvent<TypeAheadHint<TValue>>) => {
            this.value = ev.detail.value;
            this.input.blur();
            (ev.target as AutocompleteComponent).focusState = FocusState.None;
          }}"
        ></rock-autocomplete>
      </div>
    </div>`;
  }
}
