import { PagedStore } from '../shared/paged-store.store';
import { projectService } from './project.service';

export const projectenStore = new PagedStore<'projecten'>(projectService);
