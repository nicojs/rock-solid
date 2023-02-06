import { fromEvent, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export type Query = Record<string, string | undefined>;

export class RouteParams {
  constructor(
    public readonly path: readonly string[],
    public readonly query: Query,
  ) {}

  static parse(
    href: string,
    base = `${window.location.protocol}//${window.location.host}`,
  ): RouteParams {
    const { pathname, searchParams } = new URL(href, base);
    const path = pathname.slice(1).split('/').filter(Boolean);
    const query: Query = {};
    searchParams.forEach((val, key) => (query[key] = val));
    return new RouteParams(path, query);
  }

  resolve(href: string) {
    return RouteParams.parse(href, this.href);
  }

  get pathname() {
    return `/${this.path.length ? `${this.path.join('/')}/` : ''}`;
  }

  get href() {
    return `${window.location.protocol}//${window.location.host}${this.pathname}${this.queryString}`;
  }

  get queryString() {
    const entries = Object.entries(this.query);
    if (entries.length) {
      return `?${entries
        .map(([k, v]) => `${k}=${encodeURIComponent(v ?? '')}`)
        .join('&')}`;
    }
    return '';
  }
}

export class Router {
  private navigatorSubject = new BehaviorSubject<RouteParams>(
    RouteParams.parse(`${window.location.pathname}${window.location.search}`),
  );
  public routeChange$ = this.navigatorSubject.asObservable();

  constructor() {
    fromEvent(window, 'popstate')
      .pipe(map(() => RouteParams.parse(window.location.pathname)))
      .subscribe(this.navigatorSubject);
  }

  resolve(path: string) {
    return this.navigatorSubject.value.resolve(path);
  }

  isActive(path: string) {
    return this.resolve(path).pathname === this.navigatorSubject.value.pathname;
  }

  navigate(path: string) {
    const route = this.resolve(path);
    window.history.pushState({}, '', route.pathname);
    this.navigatorSubject.next(route);
  }

  linkClick(this: HTMLElement, event: MouseEvent) {
    event.preventDefault();
    router.navigate((event.target as HTMLAnchorElement).href);
  }
}

export const router = new Router();
