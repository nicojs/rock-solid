import { html, nothing, PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { FormGroup } from './form-control';
import { capitalize } from '../shared';
import { FormElement } from './form-element';

@customElement('rock-reactive-form-group')
export class ReactiveFormGroupComponent<
  TEntity,
  TKey extends keyof TEntity & string,
> extends FormElement<TEntity> {
  public override control!: FormGroup<TEntity, TKey>;

  @state()
  private showControls = false;

  public get value(): TEntity[TKey] {
    return this.entity[this.control.name];
  }

  @state()
  public set value(val: TEntity[TKey]) {
    this.entity[this.control.name] = val;
  }

  public override update(
    changedProperties: PropertyValues<
      ReactiveFormGroupComponent<TEntity, TKey>
    >,
  ): void {
    if (changedProperties.has('entity')) {
      this.showControls = this.value !== undefined;
    }
    super.update(changedProperties);
  }

  public override render() {
    return html` <fieldset class="row mb-3 border">
      <legend class="form-text">${capitalize(this.control.name)}</legend>
      ${this.control.required ? nothing : this.renderCheckbox()}
      ${this.showControls ? this.renderControls() : nothing}
    </fieldset>`;
  }

  private renderControls() {
    return this.control.controls.map(
      (control) =>
        html`<rock-reactive-form-control
          .control="${control}"
          .entity="${this.value}"
          .path="${this.name}"
        ></rock-reactive-form-control>`,
    );
  }

  private renderCheckbox() {
    return html`<div class="mb-3 row">
      <div class="col-lg-2 col-md-4"></div>
      <div class="col-lg-10 col-md-8">
        <div class="form-check">
          <input
            id="required_${this.name}"
            name="${this.control.name}"
            type="checkbox"
            class="form-check-input"
            ?checked="${this.value}"
            @change="${(e: Event) => {
              const inputEl = e.target as HTMLInputElement;
              if (inputEl.checked) {
                this.value = {} as TEntity[TKey];
                this.showControls = true;
              } else {
                this.showControls = false;
                this.value = undefined as unknown as TEntity[TKey];
              }
            }}"
          />
          <label for="required_${this.name}" class="form-check-label"
            >${this.control.requiredLabel}</label
          >
        </div>
      </div>
    </div>`;
  }
}
