export interface User {
  email: string;
  name: string;
  role: UserRole;
}

export type UserRole = 'admin' | 'projectverantwoordelijke';
export type Privilege =
  | 'read'
  | 'manageProjecten'
  | 'manageOrganisaties'
  | 'manageInschrijvingen'
  | 'manageDeelnames'
  | 'manageDeelnemers';

export interface LoginResponse {
  user: User;
  jwt: string;
}
export const loginUrl = '/auth/login';

export const privileges: Record<UserRole, Privilege[]> = {
  admin: [
    'read',
    'manageProjecten',
    'manageOrganisaties',
    'manageInschrijvingen',
    'manageDeelnames',
    'manageDeelnemers',
  ],
  projectverantwoordelijke: ['read', 'manageDeelnames'],
};
