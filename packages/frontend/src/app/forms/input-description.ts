export enum InputType {
  text = 'text',
  email = 'email',
  tel = 'tel',
  checkbox = 'checkbox',
  select = 'select',
  date = 'date',
}

interface Validators {
  required?: boolean;
  minLength?: number;
  min?: Date;
  max?: Date;
  pattern?: string;
}

export type InputDescription<TEntity> =
  | StringInputDescription<TEntity>
  | CheckboxInputDescription<TEntity>
  | SelectDescription<TEntity>
  | DateInputDescription<TEntity>;

export interface BaseInputDescription {
  label?: string;
  validators?: Validators;
  placeholder?: string;
}

type KeysOfType<TEntity, TValue> = {
  [K in keyof TEntity & string]-?: TValue extends TEntity[K] ? K : never;
}[keyof TEntity & string];

type KeysOfEnums<TEntity> = {
  [K in keyof TEntity & string]: TEntity[K] extends string ? K : never;
}[keyof TEntity & string];

export interface StringInputDescription<TEntity> extends BaseInputDescription {
  name: KeysOfType<TEntity, string>;
  type: InputType.text | InputType.email | InputType.tel;
}

export interface DateInputDescription<TEntity> extends BaseInputDescription {
  name: KeysOfType<TEntity, Date>;
  type: InputType.date;
}

export interface CheckboxInputDescription<TEntity>
  extends BaseInputDescription {
  name: KeysOfType<TEntity, boolean>;
  type: InputType.checkbox;
}

export interface SelectDescription<TEntity> extends BaseInputDescription {
  type: InputType.select;
  name: KeysOfEnums<TEntity>;
  items: {
    readonly [K in TEntity[KeysOfEnums<TEntity>] & string]: string;
  };
}
