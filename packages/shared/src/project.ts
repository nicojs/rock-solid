import { Decimal } from 'decimal.js';
import { Options } from './options.js';
import { OverigPersoon } from './persoon.js';
import { Upsertable } from './upsertable.js';
import { Aanmeldingsstatus } from './aanmelding.js';
import { Labels, Queryfied, filterMetaQuery, tryParseInt } from './util.js';
import { Locatie } from './locatie.js';

export interface BaseProject {
  id: number;
  projectnummer: string;
  type: ProjectType;
  naam: string;
  aantalInschrijvingen: number;
  begeleiders: OverigPersoon[];
  jaar: number;
  saldo?: Decimal;
  prijs?: Decimal;
  voorschot?: Decimal;
}

export type ProjectType = 'cursus' | 'vakantie';

export const projectTypes: Options<ProjectType> = Object.freeze({
  cursus: 'Cursus',
  vakantie: 'Vakantie',
});

export function isProjectType(maybe: string): maybe is ProjectType {
  return maybe in projectTypes;
}

export interface Cursus extends BaseProject {
  type: 'cursus';
  organisatieonderdeel: Organisatieonderdeel;
  activiteiten: CursusActiviteit[];
}

export interface Vakantie extends BaseProject {
  type: 'vakantie';
  bestemming: string;
  land: string;
  activiteiten: VakantieActiviteit[];
  seizoen?: VakantieSeizoen;
}

export type AanmeldingOf<T extends Project> = {
  status: Aanmeldingsstatus;
} & T;

export const projectLabels: Labels<BaseProject> = {
  aantalInschrijvingen: 'Aantal inschrijvingen',
  begeleiders: 'Begeleiders',
  id: 'id',
  naam: 'Naam',
  projectnummer: 'Projectnummer',
  type: 'type',
  jaar: 'Jaar',
  saldo: 'Saldo',
  prijs: 'Prijs',
  voorschot: 'Voorschot',
};

export const cursusLabels: Labels<Cursus> = {
  ...projectLabels,
  activiteiten: 'Activiteiten',
  organisatieonderdeel: 'Organisatie',
};

export const vakantieLabels: Labels<Vakantie> = {
  ...projectLabels,
  bestemming: 'Bestemming',
  land: 'Land',
  activiteiten: 'Activiteiten',
  seizoen: 'Seizoen',
};

export const allProjectLabels: Readonly<Labels<Project>> = Object.freeze({
  ...cursusLabels,
  ...vakantieLabels,
});

export const activiteitLabels: Labels<VakantieActiviteit & CursusActiviteit> = {
  aantalDeelnames: 'Aantal deelnames',
  aantalDeelnemersuren: 'Aantal deelnemersuren',
  begeleidingsuren: 'Begeleidingsuren',
  id: 'id',
  metOvernachting: 'Met overnachting',
  totEnMet: 'Tot en met',
  van: 'Van',
  vormingsuren: 'Vormingsuren',
  verblijf: 'Verblijf',
  vervoer: 'Vervoer',
  locatie: 'Locatie',
  isCompleted: 'Is afgerond',
};

export type Activiteit = CursusActiviteit | VakantieActiviteit;

export interface BaseActiviteit {
  id: number;
  van: Date;
  totEnMet: Date;
  metOvernachting: boolean;
  aantalDeelnames: number;
  vormingsuren?: number;
  begeleidingsuren?: number;
  aantalDeelnemersuren: number;
  isCompleted: boolean;
}

export interface CursusActiviteit extends BaseActiviteit {
  locatie?: Locatie;
}

export interface VakantieActiviteit extends BaseActiviteit {
  verblijf?: VakantieVerblijf;
  vervoer?: VakantieVervoer;
}

export type VakantieSeizoen = 'zomer' | 'winter';
export const vakantieSeizoenen: Options<VakantieSeizoen> = Object.freeze({
  zomer: 'Zomer',
  winter: 'Winter',
});
export type VakantieVerblijf = 'hotelOfPension' | 'vakantiehuis' | 'boot';
export type VakantieVervoer =
  | 'vliegtuig'
  | 'autocarNacht'
  | 'autocarOverdag'
  | 'trein'
  | 'minibus'
  | 'boot';

export const vakantieVerblijven: Options<VakantieVerblijf> = Object.freeze({
  hotelOfPension: 'Hotel of pension',
  vakantiehuis: 'Vakantiehuis',
  boot: 'Boot',
});

export const vakantieVervoerOptions: Options<VakantieVervoer> = Object.freeze({
  vliegtuig: 'Vliegtuig',
  autocarNacht: "Autocar 's nachts",
  autocarOverdag: 'Autocar overdag',
  trein: 'Trein',
  minibus: 'Minibus',
  boot: 'Boot',
});

export type Organisatieonderdeel = 'keiJongBuSO' | 'keiJongNietBuSO' | 'deKei';

export const organisatieonderdelen: Options<Organisatieonderdeel> =
  Object.freeze({
    deKei: 'de KEI',
    keiJongBuSO: 'KEI-JONG BuSO',
    keiJongNietBuSO: 'KEI-JONG niet BuSO',
  });

export function isOrganisatieonderdeel(
  maybe: string,
): maybe is Organisatieonderdeel {
  return maybe in organisatieonderdelen;
}

export type Project = Cursus | Vakantie;

export type UpsertableActiviteit = Upsertable<
  CursusActiviteit & VakantieActiviteit,
  'van' | 'totEnMet'
>;

export type UpsertableProject = UpsertableCursus | UpsertableVakantie;

export type UpsertableCursus = Upsertable<
  Omit<Cursus, 'activiteiten'>,
  'projectnummer' | 'naam' | 'type' | 'organisatieonderdeel'
> & {
  type: 'cursus';
  activiteiten: UpsertableActiviteit[];
};
export type UpsertableVakantie = Upsertable<
  Omit<Vakantie, 'activiteiten'>,
  'projectnummer' | 'bestemming' | 'land' | 'type'
> & {
  type: 'vakantie';
  activiteiten: UpsertableActiviteit[];
};

export type ProjectFilter = Pick<Project, 'type'> &
  Partial<Pick<Project, 'jaar'>> & {
    titelLike?: string;
    aanmeldingPersoonId?: number;
    begeleidDoorPersoonId?: number;
    organisatieonderdelen?: Organisatieonderdeel[];
  };

export function toProjectFilter(
  query: Queryfied<ProjectFilter>,
): ProjectFilter {
  return {
    ...filterMetaQuery(query),
    jaar: tryParseInt(query.jaar),
    organisatieonderdelen: query.organisatieonderdelen?.split(
      ',',
    ) as Organisatieonderdeel[],
    begeleidDoorPersoonId: tryParseInt(query.begeleidDoorPersoonId),
    aanmeldingPersoonId: tryParseInt(query.aanmeldingPersoonId),
  };
}
