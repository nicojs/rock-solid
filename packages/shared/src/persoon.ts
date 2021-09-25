import { Upsertable } from './upsertable';

export interface BasePersoon {
  id: number;
  type: PersoonType;
  voornaam?: string;
  achternaam: string;
  emailadres?: string;
  geboortedatum?: Date;
  geboorteplaats?: string;
  geslacht: Geslacht;
  rekeningnummer?: string;
  rijksregisternummer?: string;
  telefoonnummer?: string;
  gsmNummer?: string;
  communicatievoorkeur: Communicatievoorkeur;
}

export type UpsertablePersoon = UpsertableDeelnemer | UpsertableVrijwilliger;
export type UpsertableDeelnemer = Upsertable<Deelnemer, 'achternaam'>;
export type UpsertableVrijwilliger = Upsertable<Vrijwilliger, 'achternaam'>;
export type Persoon = Deelnemer | Vrijwilliger;

export interface Deelnemer extends BasePersoon {
  type: 'deelnemer';
  woonsituatie: Woonsituatie;
  woonsituatieOpmerking?: string;
  werksituatie: Werksituatie;
  werksituatieOpmerking?: string;
}

export interface Vrijwilliger extends BasePersoon {
  type: 'vrijwilliger';
  vrijwilligerOpmerking?: string;
  begeleidtVakanties: boolean;
  begeleidtCursus: boolean;
}

export type PersoonType = 'deelnemer' | 'vrijwilliger';

export type Voedingswens = 'geen' | 'vegetarisch';
export const voedingswensen: readonly Voedingswens[] = Object.freeze([
  'geen',
  'vegetarisch',
]);

export type Werksituatie =
  | 'onbekend'
  | 'dagcentrum'
  | 'begeleidwerkOfVrijwilligerswerk'
  | 'maatwerkbedrijf'
  | 'reguliereArbeidscircuit'
  | 'werkzoekend';
export const werksituaties: readonly Werksituatie[] = Object.freeze([
  'onbekend',
  'dagcentrum',
  'begeleidwerkOfVrijwilligerswerk',
  'maatwerkbedrijf',
  'reguliereArbeidscircuit',
  'werkzoekend',
]);

export type Woonsituatie = 'onbekend' | 'thuis' | 'residentieel';
export const woonsituaties: readonly Woonsituatie[] = Object.freeze([
  'onbekend',
  'thuis',
  'residentieel',
]);

export type Geslacht = 'onbekend' | 'man' | 'vrouw';

export type Communicatievoorkeur = 'post' | 'email';

export const communicatievoorkeuren: readonly Communicatievoorkeur[] =
  Object.freeze(['post', 'email']);
export const geslachten: readonly Geslacht[] = Object.freeze([
  'onbekend',
  'man',
  'vrouw',
]);
