import { PipeTransform, Injectable } from '@nestjs/common';
import { GroupField, groupingFieldOptions } from '@rock-solid/shared';

@Injectable()
export class GroupingFieldPipe
  implements PipeTransform<string, GroupField | undefined>
{
  transform(value: string | undefined): GroupField | undefined {
    if (value && value in groupingFieldOptions) {
      return value as GroupField;
    }
    return;
  }
}
