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
  | 'delete:locaties';

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
  ],
  projectverantwoordelijke: [
    'read',
    'update:projecten',
    'update:locaties',
    'update:personen',
    'write:deelnames',
    'create:aanmeldingen',
    'update:aanmeldingen',
  ],
  financieelBeheerder: ['read', 'update:aanmeldingen'],
};
