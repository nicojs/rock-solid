import { PipeTransform, Injectable } from '@nestjs/common';
import { ProjectReportType } from '@rock-solid/shared';

@Injectable()
export class ProjectReportTypePipe
  implements PipeTransform<string, ProjectReportType | undefined>
{
  transform(value: string | undefined): ProjectReportType | undefined {
    if (value === 'inschrijvingen' || value === 'deelnames') {
      return value;
    }
    return;
  }
}
