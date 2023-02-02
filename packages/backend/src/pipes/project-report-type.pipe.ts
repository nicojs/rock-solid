import { PipeTransform, Injectable } from '@nestjs/common';
import {
  isAanmeldingenReportType,
  AanmeldingenReportType,
} from '@rock-solid/shared';

@Injectable()
export class ProjectReportTypePipe
  implements PipeTransform<string, AanmeldingenReportType | undefined>
{
  transform(value: string | undefined): AanmeldingenReportType | undefined {
    if (value && isAanmeldingenReportType(value)) {
      return value;
    }
    return;
  }
}
