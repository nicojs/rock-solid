import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { FormControl } from './form-control';

export abstract class FormElement<TEntity> extends LitElement {
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

  get name() {
    return [this.path, this.control.name].join('_');
  }
}
