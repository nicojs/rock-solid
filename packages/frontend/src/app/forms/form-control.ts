import { Plaats } from '@kei-crm/shared';

export enum InputType {
  // Native input types:
  text = 'text',
  number = 'number',
  email = 'email',
  tel = 'tel',
  url = 'url',
  checkbox = 'checkbox',
  select = 'select',
  date = 'date',

  // Grouping types:
  array = 'array',
  group = 'group',

  // Custom types:
  plaats = 'plaats',
}

interface Validators {
  required?: boolean;
  minLength?: number;
  min?: Date | number;
  max?: Date | number;
  pattern?: string;
}

export const patterns = Object.freeze({
  email: '.+@.+\\..+',
  tel: '^\\+d+$',
});

export type FormControl<TEntity> =
  | InputControl<TEntity>
  | FormArray<TEntity, any, any>
  | FormGroup<TEntity, any>
  | PlaatsControl<TEntity>;

export function formGroup<TEntity, TKey extends keyof TEntity & string>(
  name: TKey,
  controls: readonly FormControl<NonNullable<TEntity[TKey]>>[],
  options?: { required: boolean; requiredLabel?: string },
): FormGroup<TEntity, TKey> {
  return {
    name,
    type: InputType.group,
    controls,
    required: options?.required ?? false,
    requiredLabel: options?.requiredLabel,
  };
}

export function formArray<
  TEntity,
  TItem,
  TKey extends KeysOfType<TEntity, Array<TItem>>,
>(name: TKey, controls: FormControl<TItem>[]): FormArray<TEntity, TItem, TKey> {
  return {
    name,
    type: InputType.array,
    controls,
  };
}

export interface FormArray<
  TEntity,
  TItem,
  TKey extends KeysOfType<TEntity, TItem[]>,
> {
  type: InputType.array;
  name: TKey;
  controls: readonly FormControl<TItem>[];
}

export interface FormGroup<TEntity, TKey extends keyof TEntity> {
  type: InputType.group;
  name: TKey;
  controls: readonly FormControl<NonNullable<TEntity[TKey]>>[];
  required: boolean;
  requiredLabel?: string;
}

export interface PlaatsControl<TEntity> extends BaseInputControl {
  name: KeysOfType<TEntity, Plaats>;
  type: InputType.plaats;
}

export type InputControl<TEntity> =
  | TextInputControl<TEntity>
  | EmailInputControl<TEntity>
  | TelInputControl<TEntity>
  | UrlInputControl<TEntity>
  | NumberInputControl<TEntity>
  | CheckboxInputControl<TEntity>
  | SelectControl<TEntity>
  | DateControl<TEntity>;

export interface BaseInputControl {
  label?: string;
  validators?: Validators;
  placeholder?: string;
}

export type KeysOfType<TEntity, TValue> = keyof {
  [K in keyof TEntity & string as NonNullable<TEntity[K]> extends TValue
    ? K
    : never]: TEntity[K];
} &
  string;

type KeysOfEnums<TEntity> = {
  [K in keyof Required<TEntity> & string]: Required<TEntity>[K] extends
    | string
    | string[]
    ? K
    : never;
}[keyof TEntity & string];

export interface StringInputControl<TEntity> extends BaseInputControl {
  name: KeysOfType<TEntity, string>;
  type: InputType.text | InputType.email | InputType.tel | InputType.url;
}

export interface TextInputControl<TEntity> extends StringInputControl<TEntity> {
  type: InputType.text;
}
export interface EmailInputControl<TEntity>
  extends StringInputControl<TEntity> {
  type: InputType.email;
}
export interface TelInputControl<TEntity> extends StringInputControl<TEntity> {
  type: InputType.tel;
}
export interface UrlInputControl<TEntity> extends StringInputControl<TEntity> {
  type: InputType.url;
}

export interface NumberInputControl<TEntity> extends BaseInputControl {
  name: KeysOfType<TEntity, number>;
  type: InputType.number;
  step?: number;
}

export interface DateControl<TEntity> extends BaseInputControl {
  name: KeysOfType<TEntity, Date>;
  type: InputType.date;
}

export interface CheckboxInputControl<TEntity> extends BaseInputControl {
  name: KeysOfType<TEntity, boolean>;
  type: InputType.checkbox;
}

export interface SelectControl<TEntity> extends BaseInputControl {
  type: InputType.select;
  name: KeysOfEnums<TEntity>;
  multiple?: true;
  items: {
    readonly [K in TEntity[KeysOfEnums<TEntity>] & string]: string;
  };
  size?: number;
}
