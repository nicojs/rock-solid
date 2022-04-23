import { Project, UpsertableDeelname } from '@rock-solid/shared';
import { from, Observable, tap } from 'rxjs';
import { PagedStore } from '../shared/paged-store.store';
import { ProjectService, projectService } from './project.service';

export class ProjectenStore extends PagedStore<'projecten', ProjectService> {
  updateDeelnames(
    projectId: number,
    activiteitId: number,
    deelnames: UpsertableDeelname[],
  ): Observable<void> {
    return from(
      this.service.updateDeelnames(projectId, activiteitId, deelnames),
    ).pipe(tap(() => this.loadPage()));
  }

  override update(id: string | number, data: Project): Observable<Project> {
    return super.update(id, data).pipe(
      tap(() => {
        // Side effect: Deelnemersuren may have been updated!
        this.loadPage();
      }),
    );
  }
}

export const projectenStore = new ProjectenStore(projectService);
