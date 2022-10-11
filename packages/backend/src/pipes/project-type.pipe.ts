import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ProjectType } from '@rock-solid/shared';

@Injectable()
export class ProjectTypePipe implements PipeTransform<string, ProjectType> {
  transform(value: string | undefined): ProjectType {
    if (value === 'cursus' || value === 'vakantie') {
      return value;
    }
    throw new BadRequestException('Validation failed');
  }
}
