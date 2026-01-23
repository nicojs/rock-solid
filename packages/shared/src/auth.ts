import { Options } from './options.js';

export interface User {
  email: string;
  name: string;
  role: UserRole;
}

export type UserRole =
  | 'admin'
  | 'projectverantwoordelijke'
  | 'financieelBeheerder';
export type Privilege =
  | 'read'
  | 'read:backup'
  | 'create:projecten'
  | 'update:projecten'
  | 'delete:projecten'
  | 'write:organisaties'
  | 'create:aanmeldingen'
  | 'update:aanmeldingen'
  | 'delete:aanmeldingen'
  | 'write:deelnames'
  | 'create:personen'
  | 'update:personen'
  | 'delete:personen'
  | 'create:locaties'
  | 'update:locaties'
  | 'delete:locaties'
  // Usability privileges
  | 'custom:manage-plaatsen'
  | 'custom:statusverandering'
  | 'custom:rekeninguittreksels'
  | 'custom:brieven';

export const userRoleNames: Options<UserRole> = {
  admin: 'Admin',
  projectverantwoordelijke: 'Projectverantwoordelijke',
  financieelBeheerder: 'Financieel beheerder',
};

export interface LoginResponse {
  user: User;
  jwt: string;
}
export const loginUrl = '/auth/login';
export const logoutUrl = '/auth/logout';

export const privileges: Record<UserRole, Privilege[]> = {
  admin: [
    'read',
    'read:backup',
    'create:projecten',
    'update:projecten',
    'delete:projecten',
    'write:organisaties',
    'create:aanmeldingen',
    'update:aanmeldingen',
    'delete:aanmeldingen',
    'write:deelnames',
    'create:personen',
    'update:personen',
    'delete:personen',
    'create:locaties',
    'update:locaties',
    'delete:locaties',
    'custom:statusverandering',
    'custom:rekeninguittreksels',
    'custom:brieven',
    'custom:manage-plaatsen'
  ],
  projectverantwoordelijke: [
    'read',
    'update:projecten',
    'update:locaties',
    'update:personen',
    'create:locaties',
    'update:locaties',
    'write:deelnames',
    'create:aanmeldingen',
    'update:aanmeldingen',
  ],
  financieelBeheerder: [
    'read',
    'update:aanmeldingen',
    'custom:rekeninguittreksels',
  ],
};
