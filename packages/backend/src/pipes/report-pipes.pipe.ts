import { PipeTransform, Injectable } from '@nestjs/common';
import {
  AanmeldingGroupField,
  AanmeldingReportFilter,
  AanmeldingReportType,
  ActiviteitGroupField,
  ActiviteitReportFilter,
  ActiviteitReportType,
  aanmeldingGroupingFieldOptions,
  activiteitGroupingFieldOptions,
  isAanmeldingReportType,
  isAanmeldingsstatus,
  isActiviteitReportType,
  isDoelgroep,
  isOrganisatieonderdeel,
  isOvernachtingDescription,
  isProjectType,
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
@Injectable()
export class ActiviteitGroupingFieldPipe
  implements PipeTransform<string, ActiviteitGroupField | undefined>
{
  transform(value: string | undefined): ActiviteitGroupField | undefined {
    if (value && value in activiteitGroupingFieldOptions) {
      return value as ActiviteitGroupField;
    }
    return;
  }
}

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

@Injectable()
export class ActiviteitReportTypePipe
  implements PipeTransform<string, ActiviteitReportType | undefined>
{
  transform(value: string | undefined): ActiviteitReportType | undefined {
    if (value && isActiviteitReportType(value)) {
      return value;
    }
    return;
  }
}

@Injectable()
export class AanmeldingReportFilterPipe
  implements
    PipeTransform<Record<string, string | undefined>, AanmeldingReportFilter>
{
  transform(value: Record<string, string | undefined>): AanmeldingReportFilter {
    const filter: AanmeldingReportFilter =
      new ActiviteitReportFilterPipe().transform(value);
    filter.enkelEersteAanmeldingen = key('enkelEersteAanmeldingen') in value;

    const aanmeldingsstatus = value[key('aanmeldingsstatus')];
    if (aanmeldingsstatus && isAanmeldingsstatus(aanmeldingsstatus)) {
      filter.aanmeldingsstatus = aanmeldingsstatus;
    }
    return filter;
  }
}
@Injectable()
export class ActiviteitReportFilterPipe
  implements
    PipeTransform<Record<string, string | undefined>, ActiviteitReportFilter>
{
  transform(value: Record<string, string | undefined>): ActiviteitReportFilter {
    const filter: ActiviteitReportFilter = {};
    const onderdeel = value[key('organisatieonderdeel')];
    if (onderdeel && isOrganisatieonderdeel(onderdeel)) {
      filter.organisatieonderdeel = onderdeel;
    }
    const projectType = value[key('type')];
    if (projectType && isProjectType(projectType)) {
      filter.type = projectType;
    }
    const jaar = value[key('jaar')];
    if (jaar) {
      filter.jaar = parseInt(jaar);
    }
    const overnachting = value[key('overnachting')];
    if (overnachting && isOvernachtingDescription(overnachting)) {
      filter.overnachting = overnachting;
    }
    const doelgroepen = value[key('doelgroepen')];
    if (doelgroepen) {
      filter.doelgroepen = doelgroepen.split(',').filter(isDoelgroep);
    }

    return filter;
  }
}

function key<T extends keyof AanmeldingReportFilter>(k: T): T {
  return k;
}
