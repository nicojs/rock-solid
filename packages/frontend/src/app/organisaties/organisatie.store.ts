import { EntityFrom, RestRoutes, UpsertableFrom } from '@rock-solid/shared';
import { BehaviorSubject, from, of, tap } from 'rxjs';
import { PagedStore } from '../shared/paged-store.store';
import { RestService } from '../shared/rest-service';
import { organisatieService } from './organisatie.service';

export const organisatieStore = new PagedStore(organisatieService);
