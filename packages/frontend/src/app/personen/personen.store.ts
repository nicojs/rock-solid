import { PagedStore } from '../shared/paged-store.store';
import { persoonService } from './persoon.service';

export const personenStore = new PagedStore(persoonService);
