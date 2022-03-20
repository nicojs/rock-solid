import { restClient } from '../shared/rest-client';
import { RestService } from '../shared/rest-service';

export const organisatieService = new RestService(restClient, 'organisaties');
