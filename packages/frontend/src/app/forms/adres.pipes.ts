import { Adres, Plaats } from '@rock-solid/shared';

export function plaatsName(plaats?: Plaats): string {
  if (plaats) {
    return `${plaats.postcode} ${plaats.deelgemeente} (${plaats.gemeente})`;
  } else {
    return '';
  }
}

export function adresName(adres?: Adres) {
  if (adres) {
    return `${adres.straatnaam} ${adres.huisnummer}${
      adres.busnummer ? ` bus ${adres.busnummer}` : ''
    }, ${plaatsName(adres.plaats)}`;
  }
  return '';
}
