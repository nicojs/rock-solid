export interface User {
  email: string;
  name: string;
}

export interface LoginResponse {
  user: User;
  jwt: string;
}
export const loginUrl = '/auth/login';
