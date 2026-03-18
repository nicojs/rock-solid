import { restClient } from '../shared/rest-client';
import { RestService } from '../shared/rest-service';

export const vervoerstoerenService = new RestService(
  restClient,
  'vervoerstoeren',
);
