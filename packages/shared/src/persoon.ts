import { Upsertable } from './upsertable';

export interface Persoon {
  id: number;
  voornaam: string | null;
  achternaam: string;
  emailadres: string | null;
  geboortedatum: Date | null;
  geboorteplaats: string | null;
  geslacht: Geslacht;
  rekeningnummer: string | null;
  rijksregisternummer: string | null;
  telefoonnummer: string | null;
  gsmNummer: string | null;
  communicatievoorkeur: Communicatievoorkeur;
}

export type Geslacht = 'onbekend' | 'man' | 'vrouw';

export type Communicatievoorkeur = 'post' | 'email';

export type UpsertablePersoon = Upsertable<Persoon, 'achternaam'>;
