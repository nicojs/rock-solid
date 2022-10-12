import { PipeTransform, Injectable } from '@nestjs/common';
import { ProjectType } from '@rock-solid/shared';

@Injectable()
export class ProjectTypePipe
  implements PipeTransform<string, ProjectType | undefined>
{
  transform(value: string | undefined): ProjectType | undefined {
    if (value === 'cursus' || value === 'vakantie') {
      return value;
    }
    return;
  }
}
