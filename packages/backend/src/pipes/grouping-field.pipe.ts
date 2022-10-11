import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { GroupField, groupingFieldOptions } from '@rock-solid/shared';

@Injectable()
export class GroupingFieldPipe implements PipeTransform<string, GroupField> {
  transform(value: string | undefined): GroupField {
    if (value && value in groupingFieldOptions) {
      return value as GroupField;
    }
    throw new BadRequestException('Validation failed');
  }
}
