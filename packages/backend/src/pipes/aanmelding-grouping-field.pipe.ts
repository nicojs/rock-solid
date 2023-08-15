import { PipeTransform, Injectable } from '@nestjs/common';
import {
  AanmeldingGroupField,
  aanmeldingGroupingFieldOptions,
} from '@rock-solid/shared';

@Injectable()
export class AanmeldingGroupingFieldPipe
  implements PipeTransform<string, AanmeldingGroupField | undefined>
{
  transform(value: string | undefined): AanmeldingGroupField | undefined {
    if (value && value in aanmeldingGroupingFieldOptions) {
      return value as AanmeldingGroupField;
    }
    return;
  }
}
