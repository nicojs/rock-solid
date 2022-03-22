import { restClient } from '../shared/rest-client';
import { RestService } from '../shared/rest-service';

export const plaatsService = new RestService(restClient, 'plaatsen');
