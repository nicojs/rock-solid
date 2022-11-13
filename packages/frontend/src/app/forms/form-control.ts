import {
  Decimal,
  DeepPartial,
  GroupedOptions,
  Options,
  Plaats,
} from '@rock-solid/shared';

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
  dateTimeLocal = 'datetime-local',

  // Grouping types:
  array = 'array',
  group = 'group',

  // Custom types:
  plaats = 'plaats',
  currency = 'currency',
}

interface Validators<TEntity, TValue> {
  required?: boolean;
  minLength?: number;
  min?: Date | number;
  max?: Date | number;
  pattern?: string;
  custom?: (value: TValue, entity: TEntity) => string;
}

export const patterns = Object.freeze({
  email: '.+@.+\\..+',
  tel: '^(\\d|\\s|\\.|\\(|\\)|/)+$',
});

export type FormControl<TEntity> =
  | InputControl<TEntity>
  | FormArray<TEntity, any>
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

export type ArrayItem<T> = T extends (infer TItem)[] ? TItem : never;

export function formArray<TEntity, TKey extends KeysOfType<TEntity, any[]>>(
  name: TKey,
  controls: readonly FormControl<ArrayItem<TEntity[TKey]>>[],
  factory: () => DeepPartial<ArrayItem<TEntity[TKey]>> = () => ({}),
): FormArray<TEntity, TKey> {
  return {
    name,
    type: InputType.array,
    factory,
    controls,
  };
}

export interface FormArray<TEntity, TKey extends KeysOfType<TEntity, any[]>> {
  type: InputType.array;
  name: TKey;
  factory: () => DeepPartial<ArrayItem<TEntity[TKey]>>;
  controls: readonly FormControl<ArrayItem<TEntity[TKey]>>[];
}

export interface FormGroup<TEntity, TKey extends keyof TEntity> {
  type: InputType.group;
  name: TKey;
  controls: readonly FormControl<NonNullable<TEntity[TKey]>>[];
  required: boolean;
  requiredLabel?: string;
}

export interface PlaatsControl<TEntity>
  extends BaseInputControl<TEntity, Plaats> {
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
  | SelectControl<TEntity, any>
  | TemporalInput<TEntity>;

export interface BaseInputControl<TEntity, TValue> {
  label?: string | false;
  validators?: Validators<TEntity, TValue>;
  placeholder?: string;
  postfix?: string;
}

export type KeysOfType<TEntity, TValue> = keyof {
  [K in keyof TEntity & string as NonNullable<TEntity[K]> extends TValue
    ? K
    : never]: TEntity[K];
} &
  string;

export interface StringInputControl<TEntity>
  extends BaseInputControl<TEntity, string> {
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

export interface NumberInputControl<TEntity>
  extends BaseInputControl<TEntity, number | Decimal> {
  name: KeysOfType<TEntity, number | Decimal>;
  type: InputType.number | InputType.currency;
  step?: number;
}

export type TemporalInput<TEntity> =
  | DateControl<TEntity>
  | DateTimeLocalControl<TEntity>;

export interface DateControl<TEntity> extends BaseInputControl<TEntity, Date> {
  name: KeysOfType<TEntity, Date>;
  type: InputType.date;
}
export interface DateTimeLocalControl<TEntity>
  extends BaseInputControl<TEntity, Date> {
  name: KeysOfType<TEntity, Date>;
  /**
   * Value in seconds, with a scaling factor of 1000 (since the underlying numeric value is in milliseconds). The default value of step is 60, indicating 60 seconds (or 1 minute, or 60,000 milliseconds).
   */
  step?: number;
  type: InputType.dateTimeLocal;
}

export interface CheckboxInputControl<TEntity>
  extends BaseInputControl<TEntity, boolean> {
  name: KeysOfType<TEntity, boolean>;
  type: InputType.checkbox;
}

interface BaseSelectControl<
  TEntity,
  TKey extends KeysOfType<TEntity, string | string[]>,
> extends BaseInputControl<TEntity, TEntity[TKey]> {
  type: InputType.select;
  name: TKey;
  multiple?: true;
  size?: number;
}

export interface GroupedSelectControl<
  TEntity,
  TKey extends KeysOfType<TEntity, string | string[]>,
> extends BaseSelectControl<TEntity, TKey> {
  grouped: true;
  items: Record<
    string,
    {
      readonly [K in TEntity[TKey] & string]: string;
    }
  >;
}

export interface IndividualSelectControl<
  TEntity,
  TKey extends KeysOfType<TEntity, string | string[]>,
> extends BaseSelectControl<TEntity, TKey> {
  grouped: false;
  items: Options<TEntity[TKey] & string>;
}

interface SelectOptions<TEntity, TValue> {
  multiple?: true;
  size?: number;
  validators?: Validators<TEntity, TValue>;
  label?: string;
  placeholder?: string;
}

export function selectControl<
  TEntity,
  TKey extends KeysOfType<TEntity, string | string[]>,
>(
  name: TKey,
  items: Options<TEntity[TKey] & string>,
  options: SelectOptions<TEntity, TEntity[TKey]> = {},
): IndividualSelectControl<TEntity, TKey> {
  return {
    type: InputType.select,
    name,
    items,
    grouped: false,
    ...options,
    size:
      options.size ?? options.multiple ? Object.keys(items).length : undefined,
  };
}

export function groupedSelectControl<
  TEntity,
  TKey extends KeysOfType<TEntity, string | string[]>,
>(
  name: TKey,
  groupedItems: GroupedOptions<TEntity[TKey] & string>,
  options: SelectOptions<TEntity, TEntity[TKey]> = {},
): GroupedSelectControl<TEntity, TKey> {
  return {
    type: InputType.select,
    name,
    items: groupedItems,
    grouped: true,
    ...options,
    size:
      options.size ?? options.multiple
        ? Object.entries(groupedItems).reduce(
            (acc, [, items]) => Object.entries(items).length + 1 + acc,
            0,
          )
        : undefined,
  };
}

export type SelectControl<
  TEntity,
  TKey extends KeysOfType<TEntity, string | string[]>,
> =
  | IndividualSelectControl<TEntity, TKey>
  | GroupedSelectControl<TEntity, TKey>;
