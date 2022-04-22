import { Upsertable } from './upsertable.js';
import { Options, groupOptions } from './options.js';
import { Adres, UpsertableAdres } from './adres.js';

export interface Organisatie {
  id: number;
  naam: string;
  emailadres?: string;
  adres?: Adres;
  opmerking?: string;
  doelgroep: Doelgroep;
  website?: string;
  soorten: OrganisatieSoort[];
  contacten: OrganisatieContact[];
}

export interface FolderAdressering {
  folderVoorkeur: FolderSelectie[];
  communicatieVoorkeur?: CommunicatieVoorkeur;
  emailadres?: string;
  adres?: Adres;
}

export interface OrganisatieContact extends FolderAdressering {
  id: number;
  terAttentieVan?: string;
  telefoonnummer?: string;
}

export const folderAdresseringColumnNames: Record<
  keyof FolderAdressering,
  string
> = Object.freeze({
  folderVoorkeur: 'Folder voorkeur',
  communicatieVoorkeur: 'Communicatie voorkeur',
  emailadres: 'Emailadres',
  adres: 'Adres',
});

export const organisatieColumnNames: Record<keyof Organisatie, string> =
  Object.freeze({
    id: 'id',
    naam: 'Naam',
    opmerking: 'Opmerking',
    doelgroep: 'Doelgroep',
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
  telefoonnummer: 'Telefoonnummer',
  ...folderAdresseringColumnNames,
});

export type OrganisatieFilter = Partial<
  Pick<OrganisatieContact, 'folderVoorkeur'>
>;

export type UpsertableOrganisatie = Upsertable<
  Omit<Organisatie, 'contacten'>,
  'naam' | 'doelgroep'
> & { contacten: UpsertableOrganisatieContact[] };

export type UpsertableOrganisatieContact = Upsertable<
  Omit<OrganisatieContact, 'adres'>,
  never
> & {
  adres?: UpsertableAdres;
};

export type Doelgroep = 'deKei' | 'keiJong';

export const doelgroepen: Options<Doelgroep> = Object.freeze({
  deKei: 'De Kei',
  keiJong: 'Kei-Jong',
});

export type CommunicatieVoorkeur = 'post' | 'email';

export type FolderSelectie =
  | 'deKeiCursussen'
  | 'deKeiZomervakanties'
  | 'deKeiWintervakanties'
  | 'KeiJongNietBuso'
  | 'KeiJongBuso';

export const folderSelecties: Options<FolderSelectie> = Object.freeze({
  deKeiCursussen: 'De Kei',
  deKeiZomervakanties: 'Zomervakanties',
  deKeiWintervakanties: 'Wintervakanties',
  KeiJongBuso: 'Buso',
  KeiJongNietBuso: 'niet Buso',
});

export const organisatieSoorten: Options<OrganisatieSoort> = {
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

export type OrganisatieSoort =
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
