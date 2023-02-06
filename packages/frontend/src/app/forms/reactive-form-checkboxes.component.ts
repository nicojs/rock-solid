import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { capitalize } from '../shared';
import { CheckboxesControl, KeysOfType } from './form-control';
import { FormElement } from './form-element';

@customElement('rock-reactive-checkboxes')
export class ReactiveFormTags<
  TEntity,
  TKey extends KeysOfType<TEntity, string[]>,
> extends FormElement<TEntity> {
  @property({ attribute: false })
  public override control!: CheckboxesControl<TEntity, TKey>;

  override render() {
    return html`
      <div class="mb-3 row">
        <div class="col-lg-2 col-md-4">
          <div class="col-form-label">
            ${this.control.label ?? capitalize(this.control.name)}
          </div>
        </div>
        <div class="col">
          ${this.control.grouped
            ? html`<div class="row">
                ${Object.entries(this.control.items).map(
                  ([key, value]) =>
                    html`<div class="mb-3 col-md-6 col-xl-4 col-xxl-3 col-12">
                      <h6>${key}</h6>
                      ${this.renderCheckboxes(value)}
                    </div>`,
                )}
              </div>`
            : this.renderCheckboxes(this.control.items)}
        </div>
      </div>
    `;
  }

  private renderCheckboxes(
    items: Readonly<Record<TEntity[TKey] & string, string>>,
  ) {
    return Object.entries(items).map(([key, value]) => {
      const checkboxRef = createRef<HTMLInputElement>();
      const checkedValues =
        (this.entity[this.control.name] as string[] | undefined) ?? [];
      return html`<div class="form-check">
        <input
          id="${this.name}-${key}"
          ${ref(checkboxRef)}
          name="${this.control.name}"
          type="checkbox"
          class="form-check-input"
          ?checked=${checkedValues.includes(key)}
          @change="${(e: Event) => {
            const inputEl = e.target as HTMLInputElement;
            if (inputEl.checked) {
              (this.entity[this.control.name] as string[]) = [
                ...((this.entity[this.control.name] as string[] | undefined) ??
                  []),
                key,
              ];
            } else {
              (this.entity[this.control.name] as string[]) = (
                this.entity[this.control.name] as string[]
              ).filter((entry) => entry !== key);
            }
            console.log(this.entity[this.control.name]);
          }}"
        />
        <label for="${this.name}-${key}" class="form-check-label"
          >${value}</label
        >
      </div>`;
    });
  }
}
