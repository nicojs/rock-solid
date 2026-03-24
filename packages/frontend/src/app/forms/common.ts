import {
  Adres,
  communicatievoorkeuren,
  foldersoorten,
  Foldervoorkeur,
  Plaats,
  UpsertablePlaats,
} from '@rock-solid/shared';
import {
  AutocompleteControl,
  FormControl,
  InputControl,
  InputType,
  KeysOfType,
  radioControl,
  Validators,
} from './form-control';
import { plaatsService, showPlaats } from '../shared';

export const adresFieldControls: readonly FormControl<Adres>[] = Object.freeze([
  Object.freeze({
    name: 'straatnaam',
    type: InputType.text,
    validators: { required: true },
  }),
  Object.freeze({
    name: 'huisnummer',
    type: InputType.text,
    validators: { required: true },
  }),
  Object.freeze({ name: 'busnummer', type: InputType.text }),
] satisfies FormControl<Adres>[]);

export const foldervoorkeurControls: readonly FormControl<Foldervoorkeur>[] = [
  radioControl('folder', foldersoorten, {
    validators: { required: true },
  }),
  radioControl('communicatie', communicatievoorkeuren, {
    validators: { required: true },
  }),
];

export function generateInputName(path: string, name: string) {
  return [path, name].join('_');
}

export function generateInputId(control: InputControl<any>, path: string) {
  return control.id ?? generateInputName(path, control.name);
}

export function plaatsControl<
  TEntity,
  TKey extends KeysOfType<TEntity, Plaats | UpsertablePlaats>,
>(
  name: TKey,
  additionalOptions?: Omit<
    AutocompleteControl<TEntity, TKey>,
    'name' | 'searchAction' | 'labelFor' | 'type' | 'validators'
  > & {
    validators?: Validators<TEntity, Plaats | UpsertablePlaats>;
  },
): AutocompleteControl<TEntity, Plaats | UpsertablePlaats> {
  return {
    name,
    type: InputType.autocomplete,
    searchAction: (text) => plaatsService.getAll({ search: text }),
    labelFor: showPlaats,
    ...additionalOptions,
  };
}
