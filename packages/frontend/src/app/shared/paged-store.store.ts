import {
  RestRoutes,
  EntityFrom,
  UpsertableFrom,
  FilterFrom,
} from '@rock-solid/shared';
import { BehaviorSubject, from, tap, of } from 'rxjs';
import { RestService } from './rest-service';

export class PagedStore<TRoute extends keyof RestRoutes> {
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

  constructor(private service: RestService<TRoute>) {
    this.loadPage();
  }

  create(data: UpsertableFrom<TRoute>) {
    return from(this.service.create(data)).pipe(tap(() => this.loadPage()));
  }

  update(id: string | number, data: EntityFrom<TRoute>) {
    return from(this.service.update(id, data)).pipe(
      tap(() => {
        const currentPage = this.currentPageItemsSubject.value;
        const indexOfItemToUpdate =
          currentPage?.findIndex((item) => item.id === id) ?? -1;
        if (currentPage && indexOfItemToUpdate !== -1) {
          const newPage: EntityFrom<TRoute>[] = [
            ...currentPage.slice(0, indexOfItemToUpdate),
            data,
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

  private loadPage() {
    this.currentPageItemsSubject.next(undefined);
    from(
      this.service.getPage(this.currentPageNumberSubject.value, this.filter),
    ).subscribe((page) => {
      this.currentPageItemsSubject.next(page.items);
      this.totalCountSubject.next(page.totalCount);
    });
  }
}
