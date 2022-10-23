import { PipeTransform, Injectable } from '@nestjs/common';
import { isProjectReportType, ProjectReportType } from '@rock-solid/shared';

@Injectable()
export class ProjectReportTypePipe
  implements PipeTransform<string, ProjectReportType | undefined>
{
  transform(value: string | undefined): ProjectReportType | undefined {
    if (value && isProjectReportType(value)) {
      return value;
    }
    return;
  }
}
