import {
  RestRoutes,
  EntityFrom,
  UpsertableFrom,
  FilterFrom,
} from '@rock-solid/shared';
import { BehaviorSubject, from, tap, of, Observable } from 'rxjs';
import { RestService } from './rest-service';

/**
 * Store pattern implementation for a rest endpoint that supports paging
 * It stores both the page number
 */
export class PagedStore<
  TRoute extends keyof RestRoutes,
  TService extends RestService<TRoute> = RestService<TRoute>,
> {
  private currentPageItemsSubject = new BehaviorSubject<
    EntityFrom<TRoute>[] | undefined
  >(undefined);
  private currentPageNumberSubject = new BehaviorSubject(0);
  private totalCountSubject = new BehaviorSubject(0);
  private focussedItemSubject = new BehaviorSubject<
    EntityFrom<TRoute> | undefined
  >(undefined);
  public currentPageItem$ = this.currentPageItemsSubject.asObservable();
  public currentPageNumber$ = this.currentPageNumberSubject.asObservable();
  public totalCount$ = this.totalCountSubject.asObservable();
  public focussedItem$ = this.focussedItemSubject.asObservable();

  private filter?: FilterFrom<TRoute>;

  constructor(public readonly service: TService) {}

  create(data: UpsertableFrom<TRoute>) {
    return from(this.service.create(data)).pipe(tap(() => this.loadPage()));
  }

  update(
    id: string | number,
    data: EntityFrom<TRoute>,
  ): Observable<EntityFrom<TRoute>> {
    return from(this.service.update(id, data)).pipe(
      tap((entity) => {
        const currentPage = this.currentPageItemsSubject.value;
        const indexOfItemToUpdate =
          currentPage?.findIndex((item) => item.id === id) ?? -1;
        if (currentPage && indexOfItemToUpdate !== -1) {
          const newPage: EntityFrom<TRoute>[] = [
            ...currentPage.slice(0, indexOfItemToUpdate),
            entity,
            ...currentPage.slice(indexOfItemToUpdate + 1),
          ];
          this.currentPageItemsSubject.next(newPage);
        } else {
          // Shouldn't happen, but if so, reload the page.
          this.loadPage();
        }
      }),
    );
  }

  delete(id: string | number): Observable<void> {
    return from(this.service.delete(id)).pipe(
      tap(() => {
        const currentPage = this.currentPageItemsSubject.value;
        if (currentPage) {
          const idNumber = typeof id === 'number' ? id : parseInt(id);
          this.currentPageItemsSubject.next(
            currentPage.filter(({ id }) => id !== idNumber),
          );
        }
      }),
    );
  }

  setCurrentPage(n: number, filter?: FilterFrom<TRoute>) {
    this.currentPageNumberSubject.next(n);
    if (arguments.length > 1) {
      // Only override filter if one was provided
      this.filter = filter;
    }
    this.loadPage();
  }

  setFilter(filter: FilterFrom<TRoute>) {
    this.filter = filter;
    this.loadPage();
  }

  setFocus(id: string | number) {
    const itemToFocus = this.currentPageItemsSubject.value?.find(
      (item) => item.id === id,
    );
    if (itemToFocus) {
      return of(itemToFocus);
    } else {
      // Shouldn't happen, but if so, retrieve from server
      this.focussedItemSubject.next(undefined);
      from(this.service.get(id)).subscribe((item) =>
        this.focussedItemSubject.next(item),
      );
    }
  }

  removeFocus() {
    this.focussedItemSubject.next(undefined);
  }

  private currentPageAbortController = new AbortController();
  protected loadPage() {
    this.currentPageItemsSubject.next(undefined);
    this.currentPageAbortController.abort();
    this.currentPageAbortController = new AbortController();
    from(
      this.service.getPage(
        this.currentPageNumberSubject.value,
        this.filter,
        this.currentPageAbortController.signal,
      ),
    ).subscribe({
      next: (page) => {
        this.currentPageItemsSubject.next(page.items);
        this.totalCountSubject.next(page.totalCount);
      },
      error: (error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          throw error;
        }
      },
    });
  }
}
