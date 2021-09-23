export enum InputType {
  text = 'text',
  email = 'email',
  checkbox = 'checkbox',
}

interface Validators {
  required?: boolean;
  minLength?: number;
}

export type InputDescription<TEntity> =
  | StringInputDescription<TEntity>
  | CheckboxInputDescription<TEntity>;

export interface BaseInputDescription {
  label?: string;
  validators?: Validators;
}

type KeysOfType<TEntity, TValue> = {
  [K in keyof TEntity & string]-?: TValue extends TEntity[K] ? K : never;
}[keyof TEntity & string];

export interface StringInputDescription<TEntity> extends BaseInputDescription {
  name: KeysOfType<TEntity, string>;
  type: InputType.text | InputType.email;
}

export interface CheckboxInputDescription<TEntity>
  extends BaseInputDescription {
  name: KeysOfType<TEntity, boolean>;
  type: InputType.checkbox;
}

// export interface SelectDescription<T> extends BaseInputDescription {
//   type: typeof Enum;
//   items: [];
// }
