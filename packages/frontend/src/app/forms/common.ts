import {
  Adres,
  communicatievoorkeuren,
  foldersoorten,
  Foldervoorkeur,
} from '@rock-solid/shared';
import { FormControl, InputType, selectControl } from './form-control';

export const adresControls: readonly FormControl<Adres>[] = Object.freeze([
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
  Object.freeze({
    name: 'plaats',
    type: InputType.plaats,
    label: 'Plaats',
    validators: { required: true },
  }),
  Object.freeze({ name: 'busnummer', type: InputType.text }),
]);

export const foldervoorkeurControls: readonly FormControl<Foldervoorkeur>[] =
  Object.freeze([
    selectControl('folder', foldersoorten, { validators: { required: true } }),
    selectControl('communicatie', communicatievoorkeuren, {
      validators: { required: true },
    }),
  ]);
