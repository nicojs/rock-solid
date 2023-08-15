import { Upsertable } from './upsertable.js';
import { Options, groupOptions } from './options.js';
import { Adres, UpsertableAdres } from './adres.js';

export interface Organisatie {
  id: number;
  naam: string;
  emailadres?: string;
  website?: string;
  soorten: Organisatiesoort[];
  contacten: OrganisatieContact[];
}

export interface FolderAdressering {
  foldervoorkeuren: Foldervoorkeur[];
  emailadres?: string;
  adres?: Adres;
}

export interface OrganisatieContact extends FolderAdressering {
  id: number;
  afdeling?: string;
  terAttentieVan?: string;
  telefoonnummer?: string;
}

export const folderAdresseringColumnNames: Record<
  keyof FolderAdressering,
  string
> = Object.freeze({
  foldervoorkeuren: 'Foldervoorkeuren',
  emailadres: 'Emailadres',
  adres: 'Adres',
});

export const organisatieColumnNames: Record<keyof Organisatie, string> =
  Object.freeze({
    id: 'id',
    naam: 'Naam',
    opmerking: 'Opmerking',
    website: 'Website',
    emailadres: 'Emailadres',
    adres: 'Adres',
    soorten: 'Soort(en)',
    contacten: 'Contact(en)',
  });

export const organisatieContactColumnNames: Record<
  keyof OrganisatieContact,
  string
> = Object.freeze({
  id: 'id',
  terAttentieVan: 'TAV',
  afdeling: 'Afdeling',
  doelgroepen: 'Doelgroepen',
  telefoonnummer: 'Telefoonnummer',
  ...folderAdresseringColumnNames,
});

export type OrganisatieFilter = {
  folders?: Foldersoort[];
};

export type UpsertableOrganisatie = Upsertable<
  Omit<Organisatie, 'contacten'>,
  'naam'
> & { contacten: UpsertableOrganisatieContact[] };

export type UpsertableOrganisatieContact = Upsertable<
  Omit<OrganisatieContact, 'adres'> & {
    adres?: UpsertableAdres;
  }
>;

export type Doelgroep = 'deKei' | 'keiJong';

export const doelgroepen: Options<Doelgroep> = Object.freeze({
  deKei: 'De Kei',
  keiJong: 'Kei-Jong',
});

export type Communicatievoorkeur = 'post' | 'email' | 'postEnEmail';

export type Foldersoort =
  | 'deKeiCursussen'
  | 'deKeiZomervakanties'
  | 'deKeiWintervakanties'
  | 'keiJongNietBuso'
  | 'keiJongBuso';

export interface Foldervoorkeur {
  communicatie: Communicatievoorkeur;
  folder: Foldersoort;
}

export const foldersoorten: Options<Foldersoort> = Object.freeze({
  deKeiCursussen: 'De Kei',
  deKeiZomervakanties: 'Zomervakanties',
  deKeiWintervakanties: 'Wintervakanties',
  keiJongBuso: 'Buso',
  keiJongNietBuso: 'niet Buso',
});

export const communicatievoorkeuren: Options<Communicatievoorkeur> =
  Object.freeze({
    post: 'post',
    email: 'e-mail',
    postEnEmail: 'post en e-mail',
  });

export const organisatieSoorten: Options<Organisatiesoort> = {
  AmbulanteWoonondersteuning: 'Ambulante en/of mobiele woonondersteuning',
  ResidentieleWoonondersteuningMinderjarigen:
    'Residentiële woonondersteuning minderjarigen',
  ResidentieleWoonondersteuningMeerderjarigen:
    'Residentiële woonondersteuning meerderjarigen',
  Pleegzorg: 'Pleegzorg',
  RechtstreeksToegankelijkeHulp: 'Rechtstreeks toegankelijke hulp',
  BijzondereJeugdzorg: 'Bijzondere Jeugdzorg',
  Psychiatrie: 'Psychiatrie',
  Maatwerkbedrijf: 'Maatwerkbedrijf',
  Dagwerking: 'Dagwerking (Dagcentrum en/of dagbesteding)',
  BegeleidWerkOfVrijwilligerswerk: 'Begeleid werk/Vrijwilligerswerk',
  ArbeidstrajectBegeleiding: 'Arbeidstraject begeleiding (GTB)',
  Arbeidszorg: 'Arbeidszorg',
  BuSO: 'BuSO',
  CLB: 'CLB',
  CentraBasiseducatie: 'Centra basiseducatie',
  CAW: 'CAW',
  JAC: 'JAC',
  OCMW: 'OCMW',
  GGZ: 'GGZ & psychiatrische hulpverlening',
  Justitiehuizen: 'Justitiehuizen - bemiddeling strafzaken',
  OndersteuningTrajectbegeleiding: 'Ondersteuning-trajectbegeleiding',
  Vrijetijdsaanbod: 'Vrijetijdsaanbod',
  Algemeen: 'Algemeen, vb. DOP',
  Jeugdorganisatie: 'Jeugdorganisatie',
  Jeugddienst: 'Jeugddienst',
  SociaalCultureleOrganisaties: 'Sociaal-culturele organisaties',
  SteunpuntenEnFederaties: 'Steunpunten & federaties',
  Anders: 'Anders, zie opmerking',
};

export const groupedOrganisatieSoorten = groupOptions(organisatieSoorten, {
  Wonen: [
    'AmbulanteWoonondersteuning',
    'ResidentieleWoonondersteuningMinderjarigen',
    'ResidentieleWoonondersteuningMeerderjarigen',
    'Pleegzorg',
    'RechtstreeksToegankelijkeHulp',
    'BijzondereJeugdzorg',
    'Psychiatrie',
  ],
  Werken: [
    'Maatwerkbedrijf',
    'Dagwerking',
    'BegeleidWerkOfVrijwilligerswerk',
    'ArbeidstrajectBegeleiding',
    'Arbeidszorg',
  ],
  School: ['BuSO', 'CLB'],
  Welzijn: ['CAW', 'JAC', 'OCMW', 'GGZ', 'Justitiehuizen'],
  'Vrije tijd': ['OndersteuningTrajectbegeleiding', 'Vrijetijdsaanbod'],
  Trajectbegeleiding: ['Algemeen'],
  Jeugdwerk: ['Jeugdorganisatie', 'Jeugddienst'],
  'Volwassenen werk': [
    'SociaalCultureleOrganisaties',
    'SteunpuntenEnFederaties',
  ],
  Andere: ['Anders'],
});

export type Organisatiesoort =
  | 'AmbulanteWoonondersteuning'
  | 'ResidentieleWoonondersteuningMinderjarigen'
  | 'ResidentieleWoonondersteuningMeerderjarigen'
  | 'Pleegzorg'
  | 'RechtstreeksToegankelijkeHulp'
  | 'BijzondereJeugdzorg'
  | 'Psychiatrie'
  | 'Maatwerkbedrijf'
  | 'Dagwerking'
  | 'BegeleidWerkOfVrijwilligerswerk'
  | 'ArbeidstrajectBegeleiding'
  | 'Arbeidszorg'
  | 'BuSO'
  | 'CLB'
  | 'CentraBasiseducatie'
  | 'CAW'
  | 'JAC'
  | 'OCMW'
  | 'GGZ'
  | 'Justitiehuizen'
  | 'OndersteuningTrajectbegeleiding'
  | 'Vrijetijdsaanbod'
  | 'Algemeen'
  | 'Jeugdorganisatie'
  | 'Jeugddienst'
  | 'SociaalCultureleOrganisaties'
  | 'SteunpuntenEnFederaties'
  | 'Anders';
