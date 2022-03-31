import { LoginResponse, User } from '@kei-crm/shared';
import { BehaviorSubject } from 'rxjs';

const KEI_LOGIN = 'kei-login';
export class AuthService {
  private _user$ = new BehaviorSubject<User | undefined>(
    this.currentLogin?.user,
  );
  private _jwt$ = new BehaviorSubject<string | undefined>(
    this.currentLogin?.jwt,
  );

  public user$ = this._user$.asObservable();
  public jwt$ = this._jwt$.asObservable();

  public login(login: LoginResponse) {
    this.currentLogin = login;
    this._user$.next(login.user);
    this._jwt$.next(login.jwt);
  }

  public logoff() {
    this.currentLogin = undefined;
    this._user$.next(undefined);
    this._jwt$.next(undefined);
  }

  private get currentLogin(): LoginResponse | undefined {
    const login = localStorage.getItem(KEI_LOGIN);
    if (login) {
      return JSON.parse(login);
    }
    return undefined;
  }
  private set currentLogin(value: LoginResponse | undefined) {
    if (value) {
      localStorage.setItem(KEI_LOGIN, JSON.stringify(value));
    } else {
      localStorage.removeItem(KEI_LOGIN);
    }
  }
}
export const authService = new AuthService();
