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
  communicatievoorkeur: Communicatievoorkeur;
}

export type UpsertablePersoon = UpsertableDeelnemer | UpsertableVrijwilliger;
export type UpsertableDeelnemer = Upsertable<Deelnemer, 'achternaam'>;
export type UpsertableVrijwilliger = Upsertable<Vrijwilliger, 'achternaam'>;
export type Persoon = Deelnemer | Vrijwilliger;

export interface TextFilter {
  type: PersoonType;
  searchType: 'text';
  search: string;
}
export type PropertyFilter = Partial<
  Omit<Vrijwilliger, 'type'> & Omit<Deelnemer, 'type'> & { type: PersoonType }
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

export interface Vrijwilliger extends BasePersoon {
  type: 'vrijwilliger';
  vrijwilligerOpmerking?: string;
  begeleidtVakanties: boolean;
  begeleidtCursus: boolean;
  selectie: VrijwilligerSelectie[];
}

export type PersoonType = 'deelnemer' | 'vrijwilliger';

export type Voedingswens = 'geen' | 'vegetarisch';
export const voedingswensen: Options<Voedingswens> = Object.freeze({
  geen: 'geen',
  vegetarisch: 'vegetarisch',
});

export type Werksituatie =
  | 'onbekend'
  | 'dagcentrum'
  | 'begeleidwerkOfVrijwilligerswerk'
  | 'maatwerkbedrijf'
  | 'reguliereArbeidscircuit'
  | 'werkzoekend';

export const werksituaties: Options<Werksituatie> = Object.freeze({
  onbekend: 'onbekend',
  dagcentrum: 'dagcentrum',
  begeleidwerkOfVrijwilligerswerk: 'begeleidwerk of vrijwilligerswerk',
  maatwerkbedrijf: 'maatwerkbedrijf',
  reguliereArbeidscircuit: 'reguliere arbeidscircuit',
  werkzoekend: 'werkzoekend',
});

export type Woonsituatie = 'onbekend' | 'thuis' | 'residentieel';
export const woonsituaties: Options<Woonsituatie> = Object.freeze({
  onbekend: 'onbekend',
  thuis: 'thuis',
  residentieel: 'residentieel',
});

export type Communicatievoorkeur = 'post' | 'email';

export const communicatievoorkeuren: Options<Communicatievoorkeur> =
  Object.freeze({ post: 'post', email: 'email' });

export type Geslacht = 'onbekend' | 'man' | 'vrouw';
export const geslachten: Options<Geslacht> = Object.freeze({
  onbekend: 'onbekend',
  man: 'man',
  vrouw: 'vrouw',
});

export type VrijwilligerSelectie =
  | 'toeleider'
  | 'vakantieVrijwilliger'
  | 'extraPersoonDeKei'
  | 'extraPersoonKeiJong';
export const vrijwilligerSelecties: Options<VrijwilligerSelectie> =
  Object.freeze({
    toeleider: 'Toeleider',
    vakantieVrijwilliger: 'Vakantie vrijwilliger',
    extraPersoonDeKei: 'Extra persoon de kei',
    extraPersoonKeiJong: 'Extra persoon kei-jong',
  });
