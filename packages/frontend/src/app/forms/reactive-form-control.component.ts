import { ifDefined } from 'lit/directives/if-defined.js';
import { html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {
  DateInputDescription,
  InputType,
  SelectDescription,
} from './input-description';
import {
  CheckboxInputDescription,
  InputDescription,
  StringInputDescription,
} from './input-description';
import { capitalize, toDateString } from '../shared';

@customElement('kei-reactive-form-control')
export class ReactiveFormControl<TEntity> extends LitElement {
  @property({ attribute: false })
  public control!: InputDescription<TEntity>;

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

  private renderInput(control: InputDescription<TEntity>): TemplateResult {
    switch (control.type) {
      case InputType.checkbox:
        return this.renderCheckbox(control);
      case InputType.text:
      case InputType.email:
      case InputType.tel:
      case InputType.date:
        return this.renderStringInput(control);
      case InputType.select:
        return this.renderSelect(control);
    }
  }

  private renderCheckbox(control: CheckboxInputDescription<TEntity>) {
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

  private renderStringInput(
    control: StringInputDescription<TEntity> | DateInputDescription<TEntity>,
  ) {
    return html`<input
      type="${control.type}"
      class="form-control"
      id="${control.name}"
      name="${control.name}"
      value="${control.type === InputType.date
        ? toDateString(this.entity[control.name] as unknown as Date)
        : this.entity[control.name]}"
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
        if (control.type === InputType.date) {
          (this.entity[control.name] as unknown as Date | undefined) =
            inputEl.valueAsDate ?? undefined;
        } else {
          (this.entity[control.name] as unknown as string) = inputEl.value;
        }
      }}"
    /> `;
  }

  private updateValidationMessage(e: Event) {
    const inputEl = e.target as HTMLInputElement;
    this.validationMessage = inputEl.validationMessage;
  }

  private renderSelect(control: SelectDescription<TEntity>) {
    return html`<select
      class="form-select"
      name="${control.name}"
      @change="${(e: Event) => {
        const selectEl = e.target as HTMLSelectElement;
        (this.entity[control.name] as unknown as string) = selectEl.value;
      }}"
    >
      ${control.items.map(
        (item) =>
          html`<option
            value="${item}"
            ?selected="${(item as unknown as TEntity[keyof TEntity]) ===
            this.entity[control.name]}"
            ?required="${control.validators?.required}"
          >
            ${item}
          </option>`,
      )}
    </select>`;
  }
}
