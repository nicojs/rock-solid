import { ProjectFilter, Queryfied, toProjectFilter } from '@rock-solid/shared';
import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class ProjectFilterPipe implements PipeTransform {
  transform(value: Queryfied<ProjectFilter>): ProjectFilter {
    return toProjectFilter(value);
  }
}
