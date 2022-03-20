import { Upsertable } from '.';
import { Options } from './options';

export interface Organisatie {
  id: number;
  naam: string;
  terAttentieVan?: string;
  emailadres?: string;
  opmerking?: string;
  doelgroep: Doelgroep;
  telefoonnummer?: string;
  website?: string;
  folderVoorkeur: FolderSelectie[];
  communicatieVoorkeur?: CommunicatieVoorkeur;
}

export const organisatieColumnNames: Record<keyof Organisatie, string> = {
  id: 'id',
  naam: 'Naam',
  terAttentieVan: 'TAV',
  emailadres: 'Emailadres',
  opmerking: 'Opmerking',
  doelgroep: 'Doelgroep',
  telefoonnummer: 'Telefoonnummer',
  website: 'Website',
  folderVoorkeur: 'Folder voorkeur',
  communicatieVoorkeur: 'Communicatie voorkeur',
};

export type OrganisatieFilter = Partial<Pick<Organisatie, 'folderVoorkeur'>>;

export type UpsertableOrganisatie = Upsertable<
  Organisatie,
  'naam' | 'doelgroep' | 'folderVoorkeur'
>;

export type Doelgroep = 'deKei' | 'keiJong';

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
