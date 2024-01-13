import { PagedStore } from '../shared/paged-store.store';
import { RestService } from '../shared/rest-service';
import { locatieService } from './locatie.service';

export const locatieStore = new PagedStore<'locaties', RestService<'locaties'>>(
  locatieService,
);
