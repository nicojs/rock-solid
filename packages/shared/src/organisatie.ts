import { Upsertable } from './upsertable.js';
import { Options, groupOptions } from './options.js';
import { Adres, UpsertableAdres } from './adres.js';
import { Labels, Queryfied, filterMetaQuery, tryParseBoolean } from './util.js';

export interface Organisatie {
  id: number;
  naam: string;
  website?: string;
  soorten: Organisatiesoort[];
  soortOpmerking?: string;
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

export const folderAdresseringColumnNames: Labels<FolderAdressering> =
  Object.freeze({
    foldervoorkeuren: 'Foldervoorkeuren',
    emailadres: 'Emailadres',
    adres: 'Adres',
  });

export const organisatieLabels: Labels<Organisatie> = Object.freeze({
  id: 'id',
  naam: 'Naam',
  opmerking: 'Opmerking',
  website: 'Website',
  emailadres: 'Emailadres',
  adres: 'Adres',
  soorten: 'Soort(en)',
  soortOpmerking: 'Soort opmerking',
  contacten: 'Contact(en)',
});

export const organisatieContactColumnNames: Labels<OrganisatieContact> =
  Object.freeze({
    id: 'id',
    terAttentieVan: 'TAV',
    afdeling: 'Afdeling',
    doelgroepen: 'Doelgroepen',
    telefoonnummer: 'Telefoonnummer',
    ...folderAdresseringColumnNames,
  });

export type OrganisatieFilter = {
  naam?: string;
  folders?: Foldersoort[];
  metAdres?: boolean;
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

export type Communicatievoorkeur = 'post' | 'email' | 'postEnEmail';

export type Foldersoort =
  | 'deKeiCursussen'
  | 'deKeiZomervakantie'
  | 'deKeiWintervakantie'
  | 'keiJongNietBuso'
  | 'keiJongBuso'
  | 'infoboekje';

export interface Foldervoorkeur {
  communicatie: Communicatievoorkeur;
  folder: Foldersoort;
}

export const foldersoorten: Options<Foldersoort> = Object.freeze({
  deKeiCursussen: 'De Kei cursussen',
  deKeiZomervakantie: 'De Kei Zomervakanties',
  deKeiWintervakantie: 'De Kei Wintervakanties',
  keiJongBuso: 'Kei-Jong Buso',
  keiJongNietBuso: 'Kei-Jong niet Buso',
  infoboekje: 'Infoboekjes',
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

export function toOrganisatieFilter(
  query: Queryfied<OrganisatieFilter>,
): OrganisatieFilter {
  return {
    ...filterMetaQuery(query),
    folders: query.folders?.split(',') as Foldersoort[],
    metAdres: tryParseBoolean(query.metAdres),
  };
}
