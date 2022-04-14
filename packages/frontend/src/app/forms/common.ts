import { Adres } from '@rock-solid/shared';
import { FormControl, InputType } from './form-control';

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
