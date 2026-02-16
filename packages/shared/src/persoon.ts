import { Adres, UpsertableAdres } from './adres.js';
import { Locatie } from './locatie.js';
import { Options } from './options.js';
import { Foldersoort, Foldervoorkeur } from './organisatie.js';
import { isProvincie, Provincie } from './plaats.js';
import { Patchable, Upsertable } from './upsertable.js';
import {
  Labels,
  Queryfied,
  filterMetaQuery,
  tryParseBoolean,
  tryParseInt,
} from './util.js';

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
  voedingswens?: Voedingswens;
  voedingswensOpmerking?: string;
  geslacht?: Geslacht;
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

export type PatchablePersoon = PatchableDeelnemer;
export type PatchableDeelnemer = Patchable<Deelnemer>;

export type UpsertableOverigPersoon = Upsertable<
  Omit<OverigPersoon, 'domicilieadres' | 'verblijfadres'>,
  'achternaam' | 'type'
> & {
  domicilieadres?: UpsertableAdres;
  verblijfadres?: UpsertableAdres;
};
export type Persoon = Deelnemer | OverigPersoon;

export type PersoonFilter = Partial<Pick<OverigPersoon, 'selectie'>> &
  Partial<Pick<Deelnemer, 'woonsituatie' | 'werksituatie' | 'geslacht' | 'voedingswens'>> & {
    type?: PersoonType;
    foldersoorten?: Foldersoort[];
    laatsteAanmeldingMinimaalJaarGeleden?: number;
    laatsteAanmeldingMaximaalJaarGeleden?: number;
    laatsteBegeleiddeProjectMinimaalJaarGeleden?: number;
    laatsteBegeleiddeProjectMaximaalJaarGeleden?: number;
    zonderAanmeldingen?: boolean;
    minLeeftijd?: number;
    maxLeeftijd?: number;
    volledigeNaamLike?: string;
    metVerblijfadres?: boolean;
    provincies?: Provincie[];
  };

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
  emailadres2?: string;
  begeleidendeDienst?: string;
  contactpersoon: Contactpersoon;
  woonsituatie?: Woonsituatie;
  woonsituatieOpmerking?: string;
  werksituatie?: Werksituatie;
  werksituatieOpmerking?: string;
  /** Projectnummer van de eerste cursus */
  eersteCursus?: string;
  /** Projectnummer van de eerste vakantie */
  eersteVakantie?: string;
  fotoToestemming: FotoToestemming;
  mogelijkeOpstapplaatsen: Locatie[];
}

export interface OverigPersoon extends BasePersoon {
  type: 'overigPersoon';
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
export type PersoonByType = {
  deelnemer: Deelnemer;
  overigPersoon: OverigPersoon;
};

export const persoonLabels: Labels<Persoon> = {
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

export const deelnemerLabels: Labels<Deelnemer> = {
  ...persoonLabels,
  emailadres2: '2de emailadres',
  contactpersoon: 'Contactpersoon',
  begeleidendeDienst: 'Begeleidende dienst',
  eersteCursus: 'Eerste cursus',
  eersteVakantie: 'Eerste vakantie',
  fotoToestemming: 'Foto toestemming',
  woonsituatie: 'Woonsituatie',
  woonsituatieOpmerking: 'Woonsituatie opmerking',
  werksituatie: 'Werksituatie',
  werksituatieOpmerking: 'Werksituatie opmerking',
  mogelijkeOpstapplaatsen: 'Mogelijke opstapplaatsen',
};

export const fotoToestemmingLabels: Labels<FotoToestemming> = {
  folder: 'Folder',
  website: 'Website',
  socialeMedia: 'Sociale media',
  nieuwsbrief: 'Nieuwsbrief',
  infoboekje: 'Infoboekje',
};

export const overigPersoonLabels: Labels<OverigPersoon> = {
  ...persoonLabels,
  selectie: 'Selectie',
};

export type Voedingswens = 'vegetarisch' | 'halal' | 'anders';
export const voedingswensen: Options<Voedingswens> = {
  vegetarisch: 'Vegetarisch',
  halal: 'Halal',
  anders: 'Andere voedingswensen',
};

export type Werksituatie =
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
  | 'oudersMetProfessioneleBegeleiding'
  | 'oudersZonderProfessioneleBegeleiding'
  | 'residentieleWoonondersteuning'
  | 'zelfstandigMetProfessioneleBegeleiding'
  | 'zelfstandigZonderProfessioneleBegeleiding'
  | 'anders';
export const woonsituaties: Options<Woonsituatie> = Object.freeze({
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

export type Geslacht = 'man' | 'vrouw' | 'x';
export const geslachten: Options<Geslacht> = Object.freeze({
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

export function toPersoonFilter(
  query: Queryfied<PersoonFilter>,
): PersoonFilter {
  const {
    selectie,
    foldersoorten,
    laatsteAanmeldingMinimaalJaarGeleden,
    laatsteAanmeldingMaximaalJaarGeleden,
    laatsteBegeleiddeProjectMinimaalJaarGeleden,
    laatsteBegeleiddeProjectMaximaalJaarGeleden,
    zonderAanmeldingen,
    metVerblijfadres,
    minLeeftijd,
    maxLeeftijd,
    provincies,
    ...filter
  } = query;
  return {
    ...filterMetaQuery(filter),
    selectie: selectie?.split(',') as OverigPersoonSelectie[],
    foldersoorten: foldersoorten?.split(',') as Foldersoort[],
    provincies: provincies?.split(',').filter(isProvincie),
    laatsteAanmeldingMinimaalJaarGeleden: tryParseInt(
      laatsteAanmeldingMinimaalJaarGeleden,
    ),
    laatsteAanmeldingMaximaalJaarGeleden: tryParseInt(
      laatsteAanmeldingMaximaalJaarGeleden,
    ),
    laatsteBegeleiddeProjectMinimaalJaarGeleden: tryParseInt(
      laatsteBegeleiddeProjectMinimaalJaarGeleden,
    ),
    laatsteBegeleiddeProjectMaximaalJaarGeleden: tryParseInt(
      laatsteBegeleiddeProjectMaximaalJaarGeleden,
    ),
    minLeeftijd: tryParseInt(minLeeftijd),
    maxLeeftijd: tryParseInt(maxLeeftijd),
    zonderAanmeldingen: tryParseBoolean(zonderAanmeldingen),
    metVerblijfadres: tryParseBoolean(metVerblijfadres),
  };
}
