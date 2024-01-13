import { PagedStore } from '../shared/paged-store.store';
import { RestService } from '../shared/rest-service';
import { cursusLocatieService } from './cursuslocatie.service';

export const cursusLocatieStore = new PagedStore<
  'cursuslocaties',
  RestService<'cursuslocaties'>
>(cursusLocatieService);
