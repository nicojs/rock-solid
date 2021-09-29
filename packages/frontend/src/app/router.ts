import { Observable, fromEvent, of, merge, Subject } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

export type Query = Record<string, string | undefined>;

export interface RouteParams {
  path: string[];
  query: Query;
}

export class Router {
  private navigatorSubject = new Subject<string>();

  routeChange$: Observable<RouteParams> = merge(
    of(0),
    fromEvent(window, 'popstate'),
    this.navigatorSubject,
  ).pipe(
    map(() => {
      const path = decodeURI(window.location.pathname).split('/').slice(1);
      const queryString = decodeURI(window.location.search);
      return { path, query: this.parseQuery(queryString) };
    }),
    shareReplay(1),
  );

  navigate(href: string) {
    window.history.pushState({}, '', href);
    this.navigatorSubject.next(href);
  }

  linkClick(this: HTMLElement, event: MouseEvent) {
    event.preventDefault();
    router.navigate((event.target as HTMLAnchorElement).href);
  }

  private parseQuery(queryString: string): Query {
    return queryString.split('&').reduce((queryResult, next) => {
      const [key = '_', value] = next.split('=');
      queryResult[key] = value;
      return queryResult;
    }, {} as Query);
  }
}

export const router = new Router();
