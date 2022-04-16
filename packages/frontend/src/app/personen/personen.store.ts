import { PagedStore } from '../shared/paged-store.store';
import { RestService } from '../shared/rest-service';
import { persoonService } from './persoon.service';

export const personenStore = new PagedStore<
  'personen',
  RestService<'personen'>
>(persoonService);
