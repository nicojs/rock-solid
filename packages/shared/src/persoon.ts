import { Options } from './options';
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
}

export type UpsertablePersoon = UpsertableDeelnemer | UpsertableVrijwilliger;
export type UpsertableDeelnemer = Upsertable<Deelnemer, 'achternaam'>;
export type UpsertableVrijwilliger = Upsertable<OverigPersoon, 'achternaam'>;
export type Persoon = Deelnemer | OverigPersoon;

export interface TextFilter {
  type: PersoonType;
  searchType: 'text';
  search: string;
}
export type PropertyFilter = Partial<
  Omit<OverigPersoon, 'type'> & Omit<Deelnemer, 'type'> & { type: PersoonType }
> & {
  searchType: 'persoon';
};

export type PersoonFilter = PropertyFilter | TextFilter;

export interface Deelnemer extends BasePersoon {
  type: 'deelnemer';
  woonsituatie: Woonsituatie;
  woonsituatieOpmerking?: string;
  werksituatie: Werksituatie;
  werksituatieOpmerking?: string;
}

export interface OverigPersoon extends BasePersoon {
  type: 'overigPersoon';
  vrijwilligerOpmerking?: string;
  selectie: OverigPersoonSelectie[];
}

export type PersoonType = 'deelnemer' | 'overigPersoon';
export const persoonTypeToPath: Options<PersoonType> = Object.freeze({
  deelnemer: 'deelnemers',
  overigPersoon: 'overige-personen',
});
export const persoonTypes: Options<PersoonType> = Object.freeze({
  deelnemer: 'deelnemer',
  overigPersoon: 'overig persoon',
});

export type Voedingswens = 'geen' | 'vegetarisch' | 'halal' | 'andere';
export const voedingswensen: Options<Voedingswens> = Object.freeze({
  geen: 'Geen speciale voedingswensen',
  vegetarisch: 'Vegetarisch',
  halal: 'Halal',
  andere: 'Andere voedingswensen',
});

export type Werksituatie =
  | 'onbekend'
  | 'school'
  | 'dagbesteding'
  | 'vrijwilligerswerk'
  | 'maatwerkbedrijf'
  | 'arbeidszorg'
  | 'arbeidstrajectbegeleiding'
  | 'reguliereArbeidscircuit'
  | 'pensioen'
  | 'werkzoekend';

export const werksituaties: Options<Werksituatie> = Object.freeze({
  onbekend: 'onbekend',
  school: 'school',
  dagbesteding: 'dagbesteding',
  vrijwilligerswerk: 'vrijwilligerswerk',
  maatwerkbedrijf: 'maatwerkbedrijf',
  arbeidszorg: 'arbeidszorg',
  arbeidstrajectbegeleiding: 'arbeidstrajectbegeleiding',
  reguliereArbeidscircuit: 'reguliere arbeidscircuit',
  pensioen: 'pensioen',
  werkzoekend: 'werkzoekend',
});

export type Woonsituatie =
  | 'onbekend'
  | 'thuisZonderProfessioneleBegeleiding'
  | 'thuisMetProfessioneleBegeleiding'
  | 'residentieleWoonondersteuning'
  | 'zelfstandigZonderProfessioneleBegeleiding'
  | 'zelfstandigMetProfessioneleBegeleiding';
export const woonsituaties: Options<Woonsituatie> = Object.freeze({
  onbekend: 'onbekend',
  thuisZonderProfessioneleBegeleiding: 'thuis zonder professionele begeleiding',
  thuisMetProfessioneleBegeleiding: 'thuis met professionele begeleiding',
  residentieleWoonondersteuning: 'residentiele woonondersteuning',
  zelfstandigZonderProfessioneleBegeleiding:
    'zelfstandig zonder professionele begeleiding',
  zelfstandigMetProfessioneleBegeleiding:
    'zelfstandig met professionele begeleiding',
});

export type Geslacht = 'onbekend' | 'man' | 'vrouw';
export const geslachten: Options<Geslacht> = Object.freeze({
  onbekend: 'onbekend',
  man: 'man',
  vrouw: 'vrouw',
});

export type OverigPersoonSelectie =
  | 'algemeneVergaderingKeiJong'
  | 'algemeneVergaderingDeKei'
  | 'overheid'
  | 'personeel'
  | 'vakantieVrijwilliger';

export const overigPersoonSelecties: Options<OverigPersoonSelectie> =
  Object.freeze({
    vakantieVrijwilliger: 'vakantie vrijwilliger',
    personeel: 'personeel',
    algemeneVergaderingKeiJong: 'kei-jong algemene vergadering',
    algemeneVergaderingDeKei: 'de kei algemene vergadering',
    overheid: 'overheid',
  });
