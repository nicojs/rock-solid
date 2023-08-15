import { Decimal } from 'decimal.js';
import { Options } from './options.js';
import { OverigPersoon } from './persoon.js';
import { Upsertable } from './upsertable.js';

export interface BaseProject {
  id: number;
  projectnummer: string;
  type: ProjectType;
  naam: string;
  aantalAanmeldingen: number;
  begeleiders: OverigPersoon[];
  jaar: number;
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
  activiteiten: VakantieActiviteit[];
  seizoen?: VakantieSeizoen;
  prijs?: Decimal;
  voorschot?: Decimal;
}

export const projectLabels: Record<keyof BaseProject, string> = {
  aantalAanmeldingen: 'Aantal aanmeldingen',
  begeleiders: 'Begeleiders',
  id: 'id',
  naam: 'Naam',
  projectnummer: 'Projectnummer',
  type: 'type',
  jaar: 'Jaar',
};

export const cursusLabels: Record<keyof Cursus, string> = {
  ...projectLabels,
  activiteiten: 'Activiteiten',
  organisatieonderdeel: 'Organisatie',
};

export const vakantieLabels: Record<keyof Vakantie, string> = {
  ...projectLabels,
  activiteiten: 'Activiteiten',
  seizoen: 'Seizoen',
  prijs: 'Prijs',
  voorschot: 'Voorschot',
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
}

export interface CursusActiviteit extends BaseActiviteit {}

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

export type UpsertableProject = Upsertable<
  Omit<Project, 'activiteiten'>,
  'projectnummer' | 'type' | 'naam'
> & {
  activiteiten: UpsertableActiviteit[];
};

export type ProjectFilter = Pick<Project, 'type'> & {
  aanmeldingPersoonId?: number;
  begeleidDoorPersoonId?: number;
};
