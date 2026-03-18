import { PagedStore } from '../shared/paged-store.store';
import { RestService } from '../shared/rest-service';
import { vervoerstoerenService } from './vervoerstoeren.service';

export const vervoerstoerenStore = new PagedStore<
  'vervoerstoeren',
  RestService<'vervoerstoeren'>
>(vervoerstoerenService);
