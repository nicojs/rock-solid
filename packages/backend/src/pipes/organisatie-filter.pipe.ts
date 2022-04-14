import { OrganisatieFilter } from '@rock-solid/shared';
import { PipeTransform, Injectable } from '@nestjs/common';
import { FolderSelectie } from '@prisma/client';
import { filterMetaQuery } from './pipe-utils.js';

type Flat<T> = {
  [K in keyof T]: any[] extends T[K] ? string : T[K];
};

@Injectable()
export class OrganisatieFilterPipe implements PipeTransform {
  transform(value: Flat<OrganisatieFilter>): OrganisatieFilter {
    return {
      ...filterMetaQuery(value),
      folderVoorkeur: value.folderVoorkeur?.split(',') as FolderSelectie[],
    };
  }
}
