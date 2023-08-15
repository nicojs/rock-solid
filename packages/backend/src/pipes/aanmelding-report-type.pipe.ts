import { PipeTransform, Injectable } from '@nestjs/common';
import {
  isAanmeldingReportType,
  AanmeldingReportType,
} from '@rock-solid/shared';

@Injectable()
export class AanmeldingReportTypePipe
  implements PipeTransform<string, AanmeldingReportType | undefined>
{
  transform(value: string | undefined): AanmeldingReportType | undefined {
    if (value && isAanmeldingReportType(value)) {
      return value;
    }
    return;
  }
}
