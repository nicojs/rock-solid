import { ifDefined } from 'lit/directives/if-defined.js';
import { html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
  DateControl,
  InputType,
  NumberInputControl,
  SelectControl,
} from './form-control';
import {
  CheckboxInputControl,
  InputControl,
  StringInputControl,
} from './form-control';
import { capitalize, toDateString } from '../shared';
import { empty } from '@kei-crm/shared';

@customElement('kei-reactive-form-control')
export class ReactiveFormControl<TEntity> extends LitElement {
  @property({ attribute: false })
  public control!: InputControl<TEntity>;

  @property({ attribute: false })
  public entity!: TEntity;

  @property({ attribute: false })
  private validationMessage = '';

  override createRenderRoot() {
    // Use light dom, so input elements participate in form validation 🤷‍♂️
    return this;
  }

  override render() {
    return html`<div class="mb-3 row">
      <div class="col-lg-2 col-md-4">
        ${this.control.type !== InputType.checkbox
          ? html`<label for="${this.control.name}" class="col-form-label"
              >${this.control.label ?? capitalize(this.control.name)}</label
            >`
          : ''}
      </div>
      <div class="col-lg-10 col-md-8">
        ${this.renderInput(this.control)}
        <div class="invalid-feedback">${this.validationMessage}</div>
      </div>
    </div>`;
  }

  private renderInput(control: InputControl<TEntity>): TemplateResult {
    switch (control.type) {
      case InputType.checkbox:
        return this.renderCheckbox(control);
      case InputType.text:
      case InputType.email:
      case InputType.tel:
        return this.renderStringInput(control);
      case InputType.number:
        return this.renderNumberInput(control);
      case InputType.date:
        return this.renderDateInput(control);
      case InputType.select:
        return this.renderSelect(control);
    }
  }

  private renderCheckbox(control: CheckboxInputControl<TEntity>) {
    return html`<div class="form-check">
      <input
        id="${control.name}"
        name="${control.name}"
        type="checkbox"
        class="form-check-input"
        ?required="${control.validators?.required}"
        ?checked="${this.entity[control.name]}"
        @change="${(e: Event) => {
          const inputEl = e.target as HTMLInputElement;
          (this.entity[control.name] as unknown as boolean) = inputEl.checked;
        }}"
      />
      <label for="${this.control.name}" class="form-check-label"
        >${this.control.label ?? capitalize(this.control.name)}</label
      >
    </div> `;
  }

  private renderStringInput(control: StringInputControl<TEntity>) {
    return html`<input
      type="${control.type}"
      class="form-control"
      id="${control.name}"
      name="${control.name}"
      value="${this.entity[control.name]}"
      ?required=${control.validators?.required}
      placeholder=${ifDefined(control.placeholder)}
      min="${ifDefined(toDateString(control.validators?.min))}"
      max="${ifDefined(toDateString(control.validators?.max))}"
      pattern="${ifDefined(control.validators?.pattern)}"
      minlength="${ifDefined(control.validators?.minLength)}"
      @invalid="${this.updateValidationMessage}"
      @change="${(e: Event) => {
        this.updateValidationMessage(e);
        const inputEl = e.target as HTMLInputElement;
        (this.entity[control.name] as unknown as string) = inputEl.value;
      }}"
    /> `;
  }

  private renderNumberInput(control: NumberInputControl<TEntity>) {
    return html`<input
      type="${control.type}"
      class="form-control"
      id="${control.name}"
      name="${control.name}"
      value="${this.entity[control.name]}"
      ?required=${control.validators?.required}
      step="${ifDefined(control.step)}"
      placeholder=${ifDefined(control.placeholder)}
      min="${ifDefined(control.validators?.min)}"
      max="${ifDefined(control.validators?.max)}"
      @invalid="${this.updateValidationMessage}"
      @change="${(e: Event) => {
        this.updateValidationMessage(e);
        const inputEl = e.target as HTMLInputElement;
        (this.entity[control.name] as unknown as number) =
          inputEl.valueAsNumber;
      }}"
    /> `;
  }

  private renderDateInput(control: DateControl<TEntity>) {
    return html`<input
      type="${control.type}"
      class="form-control"
      id="${control.name}"
      name="${control.name}"
      value="${toDateString(this.entity[control.name] as unknown as Date)}"
      ?required=${control.validators?.required}
      min="${ifDefined(toDateString(control.validators?.min))}"
      max="${ifDefined(toDateString(control.validators?.max))}"
      @invalid="${this.updateValidationMessage}"
      @change="${(e: Event) => {
        this.updateValidationMessage(e);
        const inputEl = e.target as HTMLInputElement;
        (this.entity[control.name] as unknown as Date | undefined) =
          inputEl.valueAsDate ?? undefined;
      }}"
    /> `;
  }

  private updateValidationMessage(e: Event) {
    const inputEl = e.target as HTMLInputElement;
    this.validationMessage = inputEl.validationMessage;
  }

  private renderSelect(control: SelectControl<TEntity>) {
    const isSelected = (value: string) => {
      if (control.multiple) {
        return (
          this.entity[control.name] as unknown as string[] | undefined
        )?.includes(value);
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
      @change="${(e: Event) => {
        const selectEl = e.target as HTMLSelectElement;
        if (control.multiple) {
          (this.entity[control.name] as unknown as string[]) = [
            ...selectEl.selectedOptions,
          ].map((option) => option.value);
        } else {
          (this.entity[control.name] as unknown as string) = selectEl.value;
        }
      }}"
    >
      ${empty(this.entity[control.name])
        ? html`<option value="">
            Selecteer een ${control.label ?? control.name}
          </option>`
        : ''}
      ${Object.entries(control.items).map(
        ([value, title]) =>
          html`<option value="${value}" ?selected=${isSelected(value)}>
            ${title}
          </option>`,
      )}
    </select>`;
  }
}
