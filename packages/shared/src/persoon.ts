import { Adres, UpsertableAdres } from './adres.js';
import { Options } from './options.js';
import { Foldersoort, Foldervoorkeur } from './organisatie.js';
import { Upsertable } from './upsertable.js';

export interface BasePersoon {
  id: number;
  type: PersoonType;
  verblijfadres?: Adres;
  domicilieadres?: Adres;
  voornaam?: string;
  achternaam: string;
  emailadres?: string;
  geboortedatum?: Date;
  geboorteplaats?: string;
  voedingswens: Voedingswens;
  voedingswensOpmerking?: string;
  geslacht: Geslacht;
  geslachtOpmerking?: string;
  rekeningnummer?: string;
  rijksregisternummer?: string;
  telefoonnummer?: string;
  gsmNummer?: string;
  opmerking?: string;
  foldervoorkeuren: Foldervoorkeur[];
}

export type UpsertablePersoon = UpsertableDeelnemer | UpsertableOverigPersoon;
export type UpsertableDeelnemer = Upsertable<
  Omit<Deelnemer, 'domicilieadres' | 'verblijfadres'>,
  'achternaam' | 'type'
> & {
  domicilieadres?: UpsertableAdres;
  verblijfadres?: UpsertableAdres;
};
export type UpsertableOverigPersoon = Upsertable<
  Omit<OverigPersoon, 'domicilieadres' | 'verblijfadres'>,
  'achternaam' | 'type'
> & {
  domicilieadres?: UpsertableAdres;
  verblijfadres?: UpsertableAdres;
};
export type Persoon = Deelnemer | OverigPersoon;

export type PersoonTextFilter = DeelnemerTextFilter | OverigPersoonTextFilter;

export interface BasePersoonTextFilter {
  searchType: 'text';
  search: string;
}

export interface DeelnemerTextFilter extends BasePersoonTextFilter {
  type: 'deelnemer';
}

export interface OverigPersoonTextFilter extends BasePersoonTextFilter {
  type: 'overigPersoon';
  overigePersoonSelectie?: OverigPersoonSelectie;
}

export type PersoonDetailsFilter = Partial<
  Omit<OverigPersoon, 'type' | 'foldervoorkeuren'> &
    Omit<
      Deelnemer,
      'type' | 'eersteCursus' | 'eersteVakantie' | 'foldervoorkeuren'
    > & {
      type: PersoonType;
    }
> & {
  foldersoorten?: Foldersoort[];
  searchType: 'persoon';
  laatsteAanmeldingJaarGeleden?: number;
};

export type PersoonFilter = PersoonDetailsFilter | PersoonTextFilter;

export interface Contactpersoon {
  naam?: string;
  telefoon?: string;
  gsm?: string;
  email?: string;
}

export interface FotoToestemming {
  folder: boolean;
  website: boolean;
  socialeMedia: boolean;
  nieuwsbrief: boolean;
  infoboekje: boolean;
}

export interface Deelnemer extends BasePersoon {
  type: 'deelnemer';
  begeleidendeDienst?: string;
  contactpersoon: Contactpersoon;
  woonsituatie: Woonsituatie;
  woonsituatieOpmerking?: string;
  werksituatie: Werksituatie;
  werksituatieOpmerking?: string;
  eersteCursus?: string;
  eersteVakantie?: string;
  fotoToestemming: FotoToestemming;
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

export const persoonLabels: Record<keyof Persoon, string> = {
  id: 'id',
  achternaam: 'Achternaam',
  emailadres: 'Emailadres',
  verblijfadres: 'Verblijfadres',
  domicilieadres: 'Domicilieadres',
  geboortedatum: 'Geboortedatum',
  geboorteplaats: 'Geboorteplaats',
  geslacht: 'Geslacht',
  geslachtOpmerking: 'Geslacht opmerking',
  gsmNummer: 'GSM nummer',
  rekeningnummer: 'Rekeningnummer',
  rijksregisternummer: 'Rijksregisternummer',
  telefoonnummer: 'Telefoonnummer',
  voedingswens: 'Voedingswens',
  voedingswensOpmerking: 'Voedingswens opmerking',
  type: 'type',
  opmerking: 'Opmerking',
  voornaam: 'Voornaam',
  foldervoorkeuren: 'Foldervoorkeuren',
};

export const deelnemerLabels: Record<keyof Deelnemer, string> = {
  ...persoonLabels,
  contactpersoon: 'Contactpersoon',
  begeleidendeDienst: 'Begeleidende dienst',
  eersteCursus: 'Eerste cursus',
  eersteVakantie: 'Eerste vakantie',
  fotoToestemming: 'Foto toestemming',
  woonsituatie: 'Woonsituatie',
  woonsituatieOpmerking: 'Woonsituatie opmerking',
  werksituatie: 'Werksituatie',
  werksituatieOpmerking: 'Werksituatie opmerking',
};

export const fotoToestemmingLabels: Record<keyof FotoToestemming, string> = {
  folder: 'Folder',
  website: 'Website',
  socialeMedia: 'Sociale media',
  nieuwsbrief: 'Nieuwsbrief',
  infoboekje: 'Infoboekje',
};

export const overigPersoonLabels: Record<keyof OverigPersoon, string> = {
  ...persoonLabels,
  vrijwilligerOpmerking: 'Vrijwilliger opmerking',
  selectie: 'Selectie',
};

export type Voedingswens = 'geen' | 'vegetarisch' | 'halal' | 'anders';
export const voedingswensen: Options<Voedingswens> = Object.freeze({
  geen: 'Geen speciale voedingswensen',
  vegetarisch: 'Vegetarisch',
  halal: 'Halal',
  anders: 'Andere voedingswensen',
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
  | 'oudersMetProfessioneleBegeleiding'
  | 'oudersZonderProfessioneleBegeleiding'
  | 'residentieleWoonondersteuning'
  | 'zelfstandigMetProfessioneleBegeleiding'
  | 'zelfstandigZonderProfessioneleBegeleiding'
  | 'anders';
export const woonsituaties: Options<Woonsituatie> = Object.freeze({
  onbekend: 'Onbekend',
  oudersMetProfessioneleBegeleiding:
    '(Pleeg)ouders met professionele begeleiding',
  oudersZonderProfessioneleBegeleiding:
    '(Pleeg)ouders zonder professionele begeleiding',
  residentieleWoonondersteuning: 'Residentiële woonondersteuning',
  zelfstandigMetProfessioneleBegeleiding:
    'Zelfstandig met professionele begeleiding',
  zelfstandigZonderProfessioneleBegeleiding:
    'Zelfstandig zonder professionele begeleiding',
  anders: 'Anders, namelijk',
});

export type Geslacht = 'onbekend' | 'man' | 'vrouw' | 'x';
export const geslachten: Options<Geslacht> = Object.freeze({
  onbekend: 'onbekend',
  man: 'man',
  vrouw: 'vrouw',
  x: 'X',
});

export type OverigPersoonSelectie =
  | 'algemeneVergaderingDeBedding'
  | 'algemeneVergaderingDeKei'
  | 'algemeneVergaderingKeiJong'
  | 'raadVanBestuurDeKei'
  | 'raadVanBestuurKeiJong'
  | 'personeel'
  | 'vakantieVrijwilliger';

export const overigPersoonSelecties: Options<OverigPersoonSelectie> =
  Object.freeze({
    vakantieVrijwilliger: 'vakantie vrijwilliger',
    personeel: 'personeel',
    algemeneVergaderingDeBedding: 'De Bedding algemene vergadering',
    algemeneVergaderingKeiJong: 'Kei-jong algemene vergadering',
    algemeneVergaderingDeKei: 'De Kei algemene vergadering',
    raadVanBestuurKeiJong: 'Raad van bestuur Kei-jong',
    raadVanBestuurDeKei: 'Raad van bestuur De Kei',
  });
