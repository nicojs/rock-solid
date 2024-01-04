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
  | 'write:projecten'
  | 'write:organisaties'
  | 'write:aanmeldingen'
  | 'write:deelnames'
  | 'write:personen';

export const userRoleNames: Record<UserRole, string> = {
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
    'write:projecten',
    'write:organisaties',
    'write:aanmeldingen',
    'write:deelnames',
    'write:personen',
  ],
  projectverantwoordelijke: ['read', 'write:deelnames'],
  financieelBeheerder: ['read', 'write:aanmeldingen'],
};
