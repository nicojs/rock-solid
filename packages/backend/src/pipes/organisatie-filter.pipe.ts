import { OrganisatieFilter } from '@kei-crm/shared';
import { PipeTransform, Injectable } from '@nestjs/common';
import { FolderSelectie } from '@prisma/client';

type Flat<T> = {
  [K in keyof T]: any[] extends T[K] ? string : T[K];
};

@Injectable()
export class OrganisatieFilterPipe implements PipeTransform {
  transform(value: Flat<OrganisatieFilter>): OrganisatieFilter {
    return {
      ...value,
      folderVoorkeur: value.folderVoorkeur?.split(',') as FolderSelectie[],
    };
  }
}
