import { BasePersoon, UpsertablePersoon } from './persoon';

export interface RestRoutes {
  personen: { entity: BasePersoon; upsertableEntity: UpsertablePersoon };
}
