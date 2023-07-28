export interface User {
  email: string;
  name: string;
  role: UserRole;
}

export type UserRole = 'admin' | 'projectverantwoordelijke';
export type Privilege =
  | 'read'
  | 'write:projecten'
  | 'write:organisaties'
  | 'write:aanmeldingen'
  | 'write:deelnames'
  | 'write:personen';

export interface LoginResponse {
  user: User;
  jwt: string;
}
export const loginUrl = '/auth/login';

export const privileges: Record<UserRole, Privilege[]> = {
  admin: [
    'read',
    'write:projecten',
    'write:organisaties',
    'write:aanmeldingen',
    'write:deelnames',
    'write:personen',
  ],
  projectverantwoordelijke: ['read', 'write:deelnames'],
};
