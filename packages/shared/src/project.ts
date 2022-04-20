import Decimal from 'decimal.js';
import { Options } from './options.js';
import { Upsertable } from './upsertable.js';

export interface BaseProject {
  id: number;
  projectnummer: string;
  type: ProjectType;
  naam: string;
  aantalInschrijvingen?: number;
}

export type ProjectType = 'cursus' | 'vakantie';

export interface Cursus extends BaseProject {
  type: 'cursus';
  organisatieonderdeel: Organisatieonderdeel;
  overnachting: boolean;
  activiteiten: CursusActiviteit[];
}

export interface Vakantie extends BaseProject {
  type: 'vakantie';
  activiteiten: VakantieActiviteit[];
  seizoen?: VakantieSeizoen;
  prijs?: Decimal;
  voorschot?: Decimal;
}

export type Activiteit = CursusActiviteit | VakantieActiviteit;

export interface BaseActiviteit {
  id: number;
  van: Date;
  totEnMet: Date;
  aantalDeelnames?: number;
}

export interface CursusActiviteit extends BaseActiviteit {
  vormingsuren?: number;
  aantalDeelnemersuren?: number;
}

export interface VakantieActiviteit extends BaseActiviteit {
  begeleidingsuren?: number;
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

export const bedrijfsonderdelen: Options<Organisatieonderdeel> = Object.freeze({
  deKei: 'de KEI',
  keiJongBuSO: 'KEI-JONG BuSO',
  keiJongNietBuSO: 'KEI-JONG niet BuSO',
});

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

export type ProjectFilter = Pick<Project, 'type'>;
