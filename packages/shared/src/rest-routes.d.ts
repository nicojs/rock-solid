import { Persoon, UpsertablePersoon } from './persoon';
import { Project, UpsertableProject } from './project';
export interface RestRoutes {
    personen: {
        entity: Persoon;
        upsertableEntity: UpsertablePersoon;
    };
    projecten: {
        entity: Project;
        upsertableEntity: UpsertableProject;
    };
}
