import {
  Adres,
  adresLabels,
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
    label: adresLabels.straatnaam, 
    type: InputType.text,
    validators: { required: true },
    cols: 8,
    labelCols: 3,
  }),
  Object.freeze({
    name: 'huisnummer',
    label: adresLabels.huisnummer,
    type: InputType.text,
    validators: { required: true },
    cols: 2,
    labelCols: 6,
  }),
  Object.freeze({
    name: 'busnummer',
    label: adresLabels.busnummer,
    type: InputType.text,
    cols: 2,
    labelCols: 6,
  }),
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
