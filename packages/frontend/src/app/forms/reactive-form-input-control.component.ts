import { ifDefined } from 'lit/directives/if-defined.js';
import { html, nothing, TemplateResult } from 'lit';
import { customElement, property, queryAll } from 'lit/decorators.js';
import {
  InputType,
  KeysOfType,
  NumberInputControl,
  RadioInputControl,
  SelectControl,
  TemporalInput,
} from './form-control';
import {
  CheckboxInputControl,
  InputControl,
  StringInputControl,
} from './form-control';
import { capitalize, toDateString, toDateTimeString } from '../shared';
import { Decimal } from '@rock-solid/shared';
import { FormControlElement } from './form-element';
import { ref, createRef } from 'lit/directives/ref.js';
import { generateInputId } from './common';

@customElement('rock-reactive-form-input-control')
export class ReactiveFormInputControl<
  TEntity,
> extends FormControlElement<TEntity> {
  @property({ attribute: false })
  public control!: InputControl<TEntity>;

  @property({ attribute: false })
  private validationMessage = '';

  private get inputId() {
    return generateInputId(this.control, this.path);
  }

  override render() {
    return html`
      <div class="input-group has-validation">
        ${this.renderInput(this.control)}${this.control.postfix
          ? html`<span class="input-group-text">${this.control.postfix}</span>`
          : ''}
        <div class="invalid-feedback">${this.validationMessage}</div>
      </div>
    `;
  }

  /**
   * All inputs in this form control.
   * Note: there can be more inputs when the control is a radio or select.
   */
  @queryAll(':is(input, select, textarea)')
  private inputs!: NodeListOf<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >;

  override updated() {
    this.validate();
  }

  override validate() {
    const errorMessage = this.control.validators?.custom?.(
      (this.entity as any)[this.control.name] as unknown as never,
      this.entity,
    );
    for (const input of this.inputs) {
      input.setCustomValidity(errorMessage ?? '');
    }
    this.updateValidationMessage();
  }

  private updateValidationMessage() {
    this.validationMessage = this.inputs.item(0).validationMessage;
  }

  private renderInput(control: InputControl<TEntity>): TemplateResult {
    switch (control.type) {
      case InputType.checkbox:
        return this.renderCheckbox(control);
      case InputType.text:
      case InputType.email:
      case InputType.tel:
      case InputType.url:
        return this.renderStringInput(control);
      case InputType.number:
      case InputType.currency:
        return this.renderNumberInput(control);
      case InputType.date:
      case InputType.dateTimeLocal:
        return this.renderTemporalInput(control);
      case InputType.select:
        return this.renderSelect(control);
      case InputType.radio:
        return this.renderRadio(control);
    }
  }

  private renderCheckbox(control: CheckboxInputControl<TEntity>) {
    return html`<div class="form-check">
      <input
        id=${this.inputId}
        name="${control.name}"
        type="checkbox"
        class="form-check-input"
        ?required="${control.validators?.required}"
        ?checked="${this.entity[control.name]}"
        @change="${(e: Event) => {
          const inputEl = e.target as HTMLInputElement;
          this.updateValue(inputEl.checked);
        }}"
      />
      <label for=${this.inputId} class="form-check-label"
        >${this.control.label ?? capitalize(this.control.name)}</label
      >
    </div> `;
  }

  private renderStringInput(control: StringInputControl<TEntity>) {
    return html`<input
      type="${control.type}"
      class="form-control"
      id=${this.inputId}
      name="${control.name}"
      value="${ifDefined(this.entity[control.name])}"
      ?required=${control.validators?.required}
      placeholder=${ifDefined(control.placeholder)}
      min="${ifDefined(toDateString(control.validators?.min))}"
      max="${ifDefined(toDateString(control.validators?.max))}"
      pattern="${ifDefined(control.validators?.pattern)}"
      minlength="${ifDefined(control.validators?.minLength)}"
      @invalid=${() => this.updateValidationMessage()}
      @change="${(e: Event) => {
        const inputEl = e.target as HTMLInputElement;
        this.updateValue(inputEl.value || undefined);
      }}"
    /> `;
  }

  private renderNumberInput(control: NumberInputControl<TEntity>) {
    return html` ${control.type === InputType.currency
        ? html`<span class="input-group-text">€</span>`
        : nothing}
      <input
        type="number"
        class="form-control"
        id=${this.inputId}
        name="${control.name}"
        value="${this.entity[control.name]}"
        ?required=${control.validators?.required}
        step="${ifDefined(control.step)}"
        placeholder=${ifDefined(control.placeholder)}
        min="${ifDefined(control.validators?.min)}"
        max="${ifDefined(control.validators?.max)}"
        @invalid="${() => this.updateValidationMessage()}"
        @change="${(e: Event) => {
          const inputEl = e.target as HTMLInputElement;
          if (control.type === InputType.currency) {
            if (inputEl.value) {
              this.updateValue(new Decimal(inputEl.value));
            } else {
              this.updateValue(undefined);
            }
          } else {
            let val: number | undefined = inputEl.valueAsNumber;
            if (isNaN(val)) {
              val = undefined;
            }
            this.updateValue(val);
          }
        }}"
      />`;
  }

  private renderTemporalInput(control: TemporalInput<TEntity>) {
    const dateToString =
      control.type === InputType.dateTimeLocal
        ? toDateTimeString
        : toDateString;

    return html`<input
      type="${control.type}"
      class="form-control"
      id=${this.inputId}
      name="${control.name}"
      value="${dateToString(this.entity[control.name] as unknown as Date)}"
      ?required=${control.validators?.required}
      min="${ifDefined(dateToString(control.validators?.min))}"
      max="${ifDefined(dateToString(control.validators?.max))}"
      step="${ifDefined(
        control.type === InputType.dateTimeLocal && control.step,
      )}"
      @focus="${(e: Event) => {
        const inputEl = e.target as HTMLInputElement;
        inputEl.showPicker();
      }}"
      @invalid=${() => this.updateValidationMessage()}
      @change="${(e: Event) => {
        const inputEl = e.target as HTMLInputElement;
        this.updateValue(
          // eslint-disable-next-line no-constant-binary-expression
          inputEl.valueAsDate ?? new Date(inputEl.value) ?? undefined,
        );
      }}"
    /> `;
  }

  private renderSelect<TKey extends KeysOfType<TEntity, string | string[]>>(
    control: SelectControl<TEntity, TKey>,
  ) {
    const isSelected = (value: string | undefined) => {
      if (control.multiple) {
        const selectedValues = this.entity[control.name] as unknown as
          | string[]
          | undefined;
        return value === undefined
          ? (selectedValues?.length ?? 0) === 0
          : selectedValues?.includes(value);
      } else {
        return (
          (this.entity[control.name] as unknown as string | undefined) === value
        );
      }
    };
    return html`<select
      class="form-select"
      name="${control.name}"
      ?multiple=${control.multiple}
      ?required=${control.validators?.required}
      size=${ifDefined(control.size)}
      @change="${(e: Event) => {
        const selectEl = e.target as HTMLSelectElement;
        if (control.multiple) {
          this.updateValue(
            [...selectEl.selectedOptions].map((option) => option.value),
          );
        } else {
          this.updateValue(selectEl.value);
        }
      }}"
    >
      ${control.placeholder !== undefined
        ? html`<option ?selected=${isSelected(undefined)} value="">
            ${control.placeholder}
          </option>`
        : nothing}
      ${control.grouped
        ? Object.entries(control.items).flatMap(
            ([groupName, items]) =>
              html`<optgroup label="${groupName}">
                ${Object.entries(items).map(
                  ([value, title]) =>
                    html`<option
                      value="${value}"
                      ?selected=${isSelected(value)}
                    >
                      ${title}
                    </option>`,
                )}
              </optgroup>`,
          )
        : Object.entries(control.items).map(
            ([value, title]) =>
              html`<option value="${value}" ?selected=${isSelected(value)}>
                ${title}
              </option>`,
          )}
    </select>`;
  }

  private renderRadio<TKey extends KeysOfType<TEntity, string | string[]>>(
    control: RadioInputControl<TEntity, TKey>,
  ) {
    const isChecked = (value: string) => {
      const checked =
        (this.entity[control.name] as unknown as string | undefined) === value;
      return checked;
    };

    return html` ${Object.entries(control.items).map(([key, value]) => {
      const id = `${this.inputId}-${key}`;
      const currentRadioRef = createRef<HTMLInputElement>();
      return html`<div
        class="form-check me-2 ${this.validationMessage
          ? 'radio-input-invalid'
          : ''}"
      >
        <input
          class="form-check-input"
          type="radio"
          name=${this.name}
          ${ref(currentRadioRef)}
          id=${id}
          ?required=${control.validators?.required}
          .checked=${isChecked(key)}
          @click=${() => {
            if (control.allowDeselect) {
              if (isChecked(key)) {
                currentRadioRef.value!.checked = false;
                this.updateValue(undefined);
              }
            }
          }}
          @change="${() => {
            this.updateValue(key);
          }}"
        />
        <label class="form-check-label" for=${id}> ${value} </label>
      </div>`;
    })}`;
  }

  private updateValue(value: unknown) {
    if (value === undefined && this.control.nullable) {
      value = null;
    }
    (this.entity as any)[this.control.name] = value;
    this.validate();
    this.dispatchValueUpdatedEvent();
  }
}
