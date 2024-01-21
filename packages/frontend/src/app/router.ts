import { Query, toQueryString } from '@rock-solid/shared';
import { fromEvent, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export class RouteParams {
  constructor(
    public readonly path: readonly string[],
    public readonly query: Query,
  ) {}

  static parse(
    href = `${window.location.pathname}${window.location.search}`,
    base = `${window.location.protocol}//${window.location.host}`,
  ): RouteParams {
    if (
      !href.startsWith('/') &&
      !href.startsWith('http://') &&
      !href.startsWith('https://')
    ) {
      throw new Error(
        `Relative paths are not supported by the rock solid router. Tried to resolve: ${href}`,
      );
    }
    const { pathname, searchParams } = new URL(href, base);
    const path = pathname.slice(1).split('/').filter(Boolean);
    const query: Query = {};
    searchParams.forEach((val, key) => (query[key] = val));
    return new RouteParams(path, query);
  }

  get pathname() {
    return `/${this.path.join('/')}`;
  }

  get href() {
    return `${window.location.protocol}//${window.location.host}${this.pathname}${this.queryString}`;
  }

  get queryString() {
    return toQueryString(this.query);
  }
}

export class Router {
  private navigatorSubject = new BehaviorSubject<RouteParams>(
    RouteParams.parse(),
  );
  public routeChange$ = this.navigatorSubject.asObservable();

  constructor() {
    fromEvent(window, 'popstate')
      .pipe(map(() => RouteParams.parse()))
      .subscribe(this.navigatorSubject);
  }

  isActive(path: string) {
    return (
      RouteParams.parse(path).pathname === this.navigatorSubject.value.pathname
    );
  }

  navigate(path: string) {
    const route = RouteParams.parse(path);
    window.history.pushState({}, '', route.href);
    this.navigatorSubject.next(route);
  }

  setQuery(query: Query) {
    const route = new RouteParams(this.navigatorSubject.value.path, query);
    window.history.pushState({}, '', `${route.pathname}${route.queryString}`);
    this.navigatorSubject.next(route);
  }

  patchQuery(patchQueryValues: Query) {
    const route = new RouteParams(this.navigatorSubject.value.path, {
      ...this.navigatorSubject.value.query,
      ...patchQueryValues,
    });
    window.history.pushState({}, '', `${route.pathname}${route.queryString}`);
    this.navigatorSubject.next(route);
  }

  linkClick(this: HTMLElement, event: MouseEvent) {
    event.preventDefault();
    router.navigate((event.target as HTMLAnchorElement).href);
  }
}

export const router = new Router();
