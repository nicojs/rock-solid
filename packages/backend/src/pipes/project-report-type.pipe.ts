import { PipeTransform, Injectable } from '@nestjs/common';
import {
  isInschrijvingenReportType,
  InschrijvingenReportType,
} from '@rock-solid/shared';

@Injectable()
export class InschrijvingenReportTypePipe
  implements PipeTransform<string, InschrijvingenReportType | undefined>
{
  transform(value: string | undefined): InschrijvingenReportType | undefined {
    if (value && isInschrijvingenReportType(value)) {
      return value;
    }
    return;
  }
}
