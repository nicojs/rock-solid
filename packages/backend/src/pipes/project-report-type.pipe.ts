import { PipeTransform, Injectable } from '@nestjs/common';
import {
  isProjectReportType,
  ProjectenReportType,
} from '@rock-solid/shared';

@Injectable()
export class ProjectReportTypePipe
  implements PipeTransform<string, ProjectenReportType | undefined>
{
  transform(value: string | undefined): ProjectenReportType | undefined {
    if (value && isProjectReportType(value)) {
      return value;
    }
    return;
  }
}
