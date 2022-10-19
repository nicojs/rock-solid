import {
  GroupField,
  parse,
  ProjectType,
  ReportRoutes,
} from '@rock-solid/shared';
import { httpClient, HttpClient } from '../shared/index';

export class ReportsClient {
  constructor(private http: HttpClient = httpClient) {}

  public async get<TReportRoute extends keyof ReportRoutes>(
    reportRoute: TReportRoute,
    group1: GroupField,
    group2?: GroupField,
    type?: ProjectType,
    enkelNieuwkomers?: boolean,
  ): Promise<ReportRoutes[TReportRoute]['entity']> {
    const response = await this.http.fetch(
      `/api/${reportRoute}?${type ? `type=${type}&` : ''}by=${group1}${
        group2 ? `&andBy=${group2}` : ''
      }${enkelNieuwkomers ? '&enkelNieuwkomers=true' : ''}`,
    );
    const bodyText = await response.text();
    return parse(bodyText);
  }
}

export const reportsClient = new ReportsClient();
