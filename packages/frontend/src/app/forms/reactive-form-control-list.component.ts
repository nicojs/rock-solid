import { customElement, property } from 'lit/decorators.js';
import { FormElement } from './form-element';
import { html, TemplateResult } from 'lit';
import { BaseInputControl, FormControl } from './form-control';

function getCols<T>(control: FormControl<T>): number | undefined {
  return (control as BaseInputControl<T, unknown>).cols;
}

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
    const result: TemplateResult[] = [];
    let i = 0;
    while (i < this.controls.length) {
      const control = this.controls[i]!;
      const cols = getCols(control);
      if (cols) {
        // Group consecutive controls with cols into a shared row
        const group: FormControl<TEntity>[] = [];
        while (i < this.controls.length && getCols(this.controls[i]!)) {
          group.push(this.controls[i]!);
          i++;
        }
      result.push(html`<div class="mb-3 row">
          ${group.map(
            (c) =>
              html`<div class="col-lg-${getCols(c)}">
                <rock-reactive-form-control
                  .control=${c}
                  .entity=${this.entity}
                  .path=${this.path}
                ></rock-reactive-form-control>
              </div>`,
          )}
        </div>`);
      } else {
        result.push(
          html`<div class="mb-3">
            <rock-reactive-form-control
              .control=${control}
              .entity=${this.entity}
              .path=${this.path}
            ></rock-reactive-form-control>
          </div>`,
        );
        i++;
      }
    }
    return result;
  }
}
