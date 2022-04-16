import { PagedStore } from '../shared/paged-store.store';
import { RestService } from '../shared/rest-service';
import { organisatieService } from './organisatie.service';

export const organisatieStore = new PagedStore<
  'organisaties',
  RestService<'organisaties'>
>(organisatieService);
