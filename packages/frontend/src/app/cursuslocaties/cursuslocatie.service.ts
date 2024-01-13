import { restClient } from '../shared/rest-client';
import { RestService } from '../shared/rest-service';

export const cursusLocatieService = new RestService(
  restClient,
  'cursuslocaties',
);
