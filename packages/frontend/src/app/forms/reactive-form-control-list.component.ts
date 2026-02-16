import { customElement, property } from 'lit/decorators.js';
import { FormElement } from './form-element';
import { html } from 'lit';
import { BaseInputControl, FormControl } from './form-control';

@customElement('rock-reactive-form-control-list')
export class ReactiveFormControlList<TEntity> extends FormElement<TEntity> {
  @property({ attribute: false })
  controls!: FormControl<TEntity>[];

  private get formControls() {
    return [...this.querySelectorAll('rock-reactive-form-control')];
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('input-updated', (e: Event) => {
      const event = e as CustomEvent<string>;
      event.stopPropagation();
      const formElementsToUpdate = this.formControls.filter(({ control }) =>
        (control as BaseInputControl<TEntity, unknown>).dependsOn?.includes(
          event.detail as keyof TEntity & string,
        ),
      );
      formElementsToUpdate.forEach((formElement) => {
        formElement.validate();
        formElement.updateShow();
      });
    });
  }

  public override render() {
    return this.controls.map(
      (control) =>
        html`<div class="mb-3">
          <rock-reactive-form-control
            .control=${control}
            .entity=${this.entity}
            .path=${this.path}
          ></rock-reactive-form-control>
        </div>`,
    );
  }
}
