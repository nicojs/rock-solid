import { Plaats } from '@kei-crm/shared';
export function plaatsName(plaats?: Plaats): string {
  if (plaats) {
    return `${plaats.postcode} ${plaats.deelgemeente} (${plaats.gemeente})`;
  } else {
    return '';
  }
}
