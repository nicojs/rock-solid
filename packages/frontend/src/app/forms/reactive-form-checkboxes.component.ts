import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref } from 'lit/directives/ref.js';
import { capitalize } from '../shared';
import { CheckboxesControl, CheckboxesKind, KeysOfType } from './form-control';
import { FormControlElement } from './form-element';

@customElement('rock-reactive-checkboxes')
export class ReactiveFormTags<
  TEntity,
  TKey extends KeysOfType<TEntity, string[]>,
> extends FormControlElement<TEntity> {
  @property({ attribute: false })
  public control!: CheckboxesControl<TEntity>;

  @property()
  public labelClasses = 'col-lg-2 col-md-4';

  get value(): any {
    return (this.entity as any)[this.control.name];
  }

  set value(value: string[] | Record<string, boolean>) {
    (this.entity as any)[this.control.name] = value;
  }

  override render() {
    return html`
      <div class="mb-3 row">
        <div class="${this.labelClasses}">
          <div class="col-form-label">
            ${this.control.label ?? capitalize(this.control.name)}
          </div>
        </div>
        <div class="col">${this.renderCheckboxesKind()}</div>
      </div>
    `;
  }

  private renderCheckboxesKind() {
    switch (this.control.kind) {
      case CheckboxesKind.groupedItems:
        return html`<div class="row">
          ${Object.entries(this.control.items).map(
            ([key, value]) =>
              html`<div class="mb-3 col-md-6 col-xl-4 col-xxl-3 col-12">
                <h6>${key}</h6>
                ${this.renderItemsCheckboxes(
                  value as Readonly<Record<TEntity[TKey] & string, string>>,
                  (this.value ??= []),
                )}
              </div>`,
          )}
        </div>`;
      case CheckboxesKind.items:
        return this.renderItemsCheckboxes(
          this.control.items,
          (this.value ??= []),
        );
      case CheckboxesKind.props:
        const currentSelected = Object.entries(
          ((this.value as Record<string, boolean>) ??= {}),
        )
          .filter(([, flag]) => flag)
          .map(([prop]) => prop);
        return this.renderItemsCheckboxes(
          this.control.items,
          currentSelected,
          (item) => (this.value[item] = true),
          (item) => (this.value[item] = false),
        );
    }
  }

  private renderItemsCheckboxes(
    items: Readonly<Record<TEntity[TKey] & string, string>>,
    initialValues: string[],
    checkAction: (option: string) => void = (item) =>
      (this.value = [...this.value, item]),
    uncheckAction: (option: string) => void = (item) =>
      (this.value = this.value.filter((val: string) => val !== item)),
  ) {
    return Object.entries(items).map(([key, value]) => {
      const checkboxRef = createRef<HTMLInputElement>();
      return html`<div class="form-check form-check-inline">
        <input
          id="${this.name}-${key}"
          ${ref(checkboxRef)}
          name="${this.control.name}"
          type="checkbox"
          class="form-check-input"
          ?checked=${initialValues.includes(key)}
          @change="${(e: Event) => {
            const inputEl = e.target as HTMLInputElement;
            if (inputEl.checked) {
              checkAction(key);
            } else {
              uncheckAction(key);
            }
            this.dispatchValueUpdatedEvent();
          }}"
        />
        <label for="${this.name}-${key}" class="form-check-label"
          >${value}</label
        >
      </div>`;
    });
  }
}
