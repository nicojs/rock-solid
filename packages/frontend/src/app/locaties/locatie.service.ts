import { restClient } from '../shared/rest-client';
import { RestService } from '../shared/rest-service';

export const locatieService = new RestService(restClient, 'locaties');
