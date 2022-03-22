import { Plaats, Provincie } from '@kei-crm/shared';
export function plaatsName(plaats: Plaats): string {
  return `${plaats.postcode} ${plaats.deelgemeente} (${plaats.gemeente})`;
}
