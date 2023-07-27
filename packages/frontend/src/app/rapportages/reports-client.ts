import {
  GroupField,
  parse,
  ProjectReportFilter,
  ReportRoutes,
  toQueryString,
} from '@rock-solid/shared';
import { httpClient, HttpClient } from '../shared/index';

export class ReportsClient {
  constructor(private http: HttpClient = httpClient) {}

  public async get<TReportRoute extends keyof ReportRoutes>(
    reportRoute: TReportRoute,
    group1: GroupField,
    group2: GroupField | undefined,
    filter: ProjectReportFilter,
  ): Promise<ReportRoutes[TReportRoute]['entity']> {
    const response = await this.http.fetch(
      `/api/${reportRoute}${toQueryString({
        by: group1,
        andBy: group2,
        ...filter,
      })}`,
    );
    const bodyText = await response.text();
    return parse(bodyText);
  }
}

export const reportsClient = new ReportsClient();
