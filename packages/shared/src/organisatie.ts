import { Upsertable } from '.';
import { Options, groupOptions } from './options';
import { Adres, UpsertableAdres } from './adres';

export interface Organisatie {
  id: number;
  naam: string;
  terAttentieVan?: string;
  emailadres?: string;
  adres?: Adres;
  opmerking?: string;
  doelgroep: Doelgroep;
  telefoonnummer?: string;
  website?: string;
  folderVoorkeur: FolderSelectie[];
  communicatieVoorkeur?: CommunicatieVoorkeur;
  soorten: OrganisatieSoort[];
}

export const organisatieColumnNames: Record<keyof Organisatie, string> = {
  id: 'id',
  naam: 'Naam',
  terAttentieVan: 'TAV',
  emailadres: 'Emailadres',
  adres: 'Adres',
  opmerking: 'Opmerking',
  doelgroep: 'Doelgroep',
  telefoonnummer: 'Telefoonnummer',
  website: 'Website',
  folderVoorkeur: 'Folder voorkeur',
  communicatieVoorkeur: 'Communicatie voorkeur',
  soorten: 'Soort(en)',
};

export type OrganisatieFilter = Partial<Pick<Organisatie, 'folderVoorkeur'>>;

export type UpsertableOrganisatie = Upsertable<
  Omit<Organisatie, 'adres'>,
  'naam' | 'doelgroep' | 'folderVoorkeur'
> & { adres?: UpsertableAdres };

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
  deKeiCursussen: 'De Kei cursussen',
  deKeiZomervakanties: 'De Kei zomervakanties',
  deKeiWintervakanties: 'De Kei wintervakanties',
  KeiJongBuso: 'Kei-Jong Buso',
  KeiJongNietBuso: 'Kei-Jong niet Buso',
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
