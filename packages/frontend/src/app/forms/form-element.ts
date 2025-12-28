import { property } from 'lit/decorators.js';
import { FormControl } from './form-control';
import { generateInputName } from './common';
import { RockElement } from '../rock-element';

export abstract class FormElement<TEntity> extends RockElement {
  override createRenderRoot() {
    // Use light dom, so input elements participate in form validation 🤷‍♂️
    return this;
  }

  @property({ attribute: false })
  public entity!: TEntity;

  /**
   * The path to the current control inside the form. Used to make id's unique
   */
  @property()
  public path = '';
}

export abstract class FormControlElement<TEntity> extends FormElement<TEntity> {
  public abstract control: FormControl<TEntity>;

  validate() {}

  updateShow() {}

  get name() {
    return generateInputName(this.path, this.control.name);
  }

  protected dispatchValueUpdatedEvent() {
    const updatedEvent = new CustomEvent<string>('input-updated', {
      bubbles: true,
      composed: true,
      detail: this.control.name,
    });
    this.dispatchEvent(updatedEvent);
  }
}
