import { Injectable } from '@nestjs/common';
import { DBService } from './db.service.js';
import * as db from '@prisma/client';
import {
  Contactpersoon,
  Deelnemer,
  Foldervoorkeur,
  FotoToestemming,
  OverigPersoon,
  Persoon,
  PersoonFilter,
  PersoonType,
  UpsertableDeelnemer,
  UpsertableOverigPersoon,
  UpsertablePersoon,
} from '@rock-solid/shared';
import { ExplicitNulls, purgeNulls } from './mapper-utils.js';
import { toPage } from './paging.js';
import {
  includeAdresWithPlaats,
  toAdres,
  toCreateAdresInput,
  toUpdateAdresInput,
} from './adres.mapper.js';
import {
  communicatievoorkeurMapper,
  foldersoortMapper,
  geslachtMapper,
  overigPersoonSelectieMapper,
  persoonTypeMapper,
  voedingswensMapper,
  werksituatieMapper,
  woonsituatieMapper,
} from './enum.mapper.js';

export type DBPersonAggregate = db.Persoon & {
  verblijfadres: DBAdresAggregate | null;
  domicilieadres: DBAdresAggregate | null;
  foldervoorkeuren: db.Foldervoorkeur[];
  selectie: db.OverigPersoonSelectie[];
  eersteCursusAanmelding: (db.Aanmelding & { project: db.Project }) | null;
  eersteVakantieAanmelding: (db.Aanmelding & { project: db.Project }) | null;
};

export type DBAdresAggregate = db.Adres & { plaats: db.Plaats };

/**
 * A data mapper for persoon
 * @see https://martinfowler.com/eaaCatalog/dataMapper.html
 */
@Injectable()
export class PersoonMapper {
  constructor(private db: DBService) {}

  async getOne(
    userWhereUniqueInput: db.Prisma.PersoonWhereUniqueInput,
  ): Promise<Persoon | null> {
    const persoon = await this.db.persoon.findUnique({
      where: userWhereUniqueInput,
      include: includePersoonAggregate,
    });
    return this.maybeToPersoon(persoon);
  }

  async getAll(
    filter: PersoonFilter,
    pageNumber: number | undefined,
  ): Promise<Persoon[]> {
    const people = await this.db.persoon.findMany({
      where: where(filter),
      orderBy: [
        {
          achternaam: 'asc',
        },
        { voornaam: 'asc' },
      ],
      include: includePersoonAggregate,
      ...toPage(pageNumber),
    });
    return people.map(toPersoon);
  }

  async delete(id: number) {
    await this.db.persoon.delete({ where: { id } });
  }

  async count(filter: PersoonFilter): Promise<number> {
    const count = await this.db.persoon.count({
      where: where(filter),
    });
    return count;
  }

  async createPersoon(persoon: UpsertablePersoon): Promise<Persoon> {
    const {
      id,
      verblijfadres,
      domicilieadres,
      foldervoorkeuren,
      eersteCursus,
      eersteVakantie,
      contactpersoon,
      fotoToestemming,
      geslacht,
      type,
      woonsituatie,
      werksituatie,
      voedingswens,
      selectie,
      ...props
    } = fillOutAllUpsertablePersoonFields(persoon);
    const dbPersoon = await this.db.persoon.create({
      data: {
        ...props,
        ...toContactPersoonFields(contactpersoon),
        ...toFotoToestemmingFields(fotoToestemming),
        volledigeNaam: computeVolledigeNaam(props),
        verblijfadres: toCreateAdresInput(verblijfadres),
        domicilieadres: domicilieadres
          ? toCreateAdresInput(domicilieadres)
          : undefined,
        geslacht: geslachtMapper.toDB(geslacht),
        type: persoonTypeMapper.toDB(type),
        woonsituatie: woonsituatieMapper.toDB(woonsituatie),
        werksituatie: werksituatieMapper.toDB(werksituatie),
        voedingswens: voedingswensMapper.toDB(voedingswens),
        selectie: {
          create: selectie?.map((s) => ({
            selectie: overigPersoonSelectieMapper.toDB(s),
          })),
        },
        foldervoorkeuren: foldervoorkeuren
          ? {
              create: foldervoorkeuren.map(({ communicatie, folder }) => ({
                communicatie: communicatievoorkeurMapper.toDB(communicatie),
                folder: foldersoortMapper.toDB(folder),
              })),
            }
          : undefined,
      },
      include: includePersoonAggregate,
    });
    return toPersoon(dbPersoon);
  }

  async updatePersoon({
    where,
    persoon,
  }: {
    where: db.Prisma.PersoonWhereUniqueInput;
    persoon: Persoon;
  }): Promise<Persoon> {
    const {
      id: personId,
      verblijfadres,
      domicilieadres,
      eersteCursus,
      eersteVakantie,
      contactpersoon,
      fotoToestemming,
      woonsituatie,
      werksituatie,
      voedingswens,
      selectie,
      geslacht,
      type,
      ...props
    } = toUpdatePersonFields(persoon);
    const { verblijfadresId, domicilieadresId } =
      await this.db.persoon.findUniqueOrThrow({
        where: { id: personId },
        select: { verblijfadresId: true, domicilieadresId: true },
      });
    const result = await this.db.persoon.update({
      where,
      data: {
        ...props,
        ...toContactPersoonFields(contactpersoon),
        ...toFotoToestemmingFields(fotoToestemming),
        volledigeNaam: computeVolledigeNaam(props),
        verblijfadres: toUpdateAdresInput(
          verblijfadres,
          typeof verblijfadresId === 'number',
        ),
        domicilieadres: toUpdateAdresInput(
          domicilieadres,
          typeof domicilieadresId === 'number',
        ),
        type: persoonTypeMapper.toDB(type),
        geslacht: geslachtMapper.toDB(geslacht),
        woonsituatie: woonsituatieMapper.toDB(woonsituatie),
        werksituatie: werksituatieMapper.toDB(werksituatie),
        voedingswens: voedingswensMapper.toDB(voedingswens),
        selectie: {
          connectOrCreate: selectie?.map((s) => {
            const dbValue = overigPersoonSelectieMapper.toDB(s);
            return {
              where: {
                overigPersoonId_selectie: {
                  overigPersoonId: personId,
                  selectie: dbValue,
                },
              },
              create: { selectie: dbValue },
            };
          }),
          deleteMany: {
            overigPersoonId: personId,
            selectie: {
              notIn: selectie?.map(overigPersoonSelectieMapper.toDB),
            },
          },
        },
        foldervoorkeuren: toFoldervoorkeurInput(persoon),
      },
      include: includePersoonAggregate,
    });

    // Delete domicilieadres after the fact of needed (this is the only way)
    if (!domicilieadres && result.domicilieadres) {
      return toPersoon(
        await this.db.persoon.update({
          where,
          data: { domicilieadres: { delete: true } },
          include: includePersoonAggregate,
        }),
      );
    } else {
      return toPersoon(result);
    }
  }

  async deleteUser(where: db.Prisma.PersoonWhereUniqueInput): Promise<Persoon> {
    return toPersoon(
      await this.db.persoon.delete({
        where,
        include: includePersoonAggregate,
      }),
    );
  }

  private maybeToPersoon(maybeP: DBPersonAggregate | null): Persoon | null {
    return maybeP ? toPersoon(maybeP) : null;
  }
}

function computeVolledigeNaam({
  voornaam,
  achternaam,
}: {
  voornaam?: string | undefined | null;
  achternaam: string;
}) {
  return `${voornaam ? `${voornaam} ` : ''}${achternaam}`;
}

export function toPersoon(p: DBPersonAggregate): Persoon {
  const {
    domicilieadres,
    domicilieadresId,
    verblijfadres,
    verblijfadresId,
    volledigeNaam,
    foldervoorkeuren,
    eersteCursusAanmelding,
    eersteVakantieAanmelding,
    eersteCursusAanmeldingId,
    eersteVakantieAanmeldingId,
    contactpersoon,
    contactpersoonEmail,
    contactpersoonGsm,
    contactpersoonTelefoon,
    toestemmingFotosFolder,
    toestemmingFotosInfoboekje,
    toestemmingFotosNieuwsbrief,
    toestemmingFotosSocialeMedia,
    toestemmingFotosWebsite,
    type: dbType,
    woonsituatie,
    werksituatie,
    voedingswens,
    geslacht,
    ...person
  } = p;
  const common = {
    ...purgeNulls(person),
    contactpersoon: toContactPersoon({
      contactpersoonEmail,
      contactpersoonGsm,
      contactpersoonTelefoon,
      contactpersoon,
    }),
    fotoToestemming: toFotoToestemming({
      toestemmingFotosFolder,
      toestemmingFotosInfoboekje,
      toestemmingFotosNieuwsbrief,
      toestemmingFotosSocialeMedia,
      toestemmingFotosWebsite,
    }),
    domicilieadres: toAdres(domicilieadres),
    verblijfadres: toAdres(verblijfadres),
    foldervoorkeuren: foldervoorkeuren.map(toFoldervoorkeur),
    voedingswens: voedingswensMapper.toSchema(voedingswens),
    geslacht: geslachtMapper.toSchema(geslacht),
    woonsituatie: woonsituatieMapper.toSchema(woonsituatie),
    werksituatie: werksituatieMapper.toSchema(werksituatie),
  };
  const type = persoonTypeMapper.toSchema(dbType);
  switch (type) {
    case 'deelnemer':
      return {
        ...common,
        type,
        eersteVakantie: eersteVakantieAanmelding?.project.projectnummer,
        eersteCursus: eersteCursusAanmelding?.project.projectnummer,
      };
    case 'overigPersoon':
      return {
        ...common,
        type,
        selectie: person.selectie.map((s) =>
          overigPersoonSelectieMapper.toSchema(s.selectie),
        ),
      };
    default:
      throw new Error(`Unknown persoon type ${type}`);
  }
}

function toFoldervoorkeur(foldervoorkeur: db.Foldervoorkeur): Foldervoorkeur {
  return {
    communicatie: communicatievoorkeurMapper.toSchema(
      foldervoorkeur.communicatie,
    ),
    folder: foldersoortMapper.toSchema(foldervoorkeur.folder),
  };
}

function where(filter: PersoonFilter): db.Prisma.PersoonWhereInput {
  const {
    foldersoorten,
    selectie,
    laatsteAanmeldingMinimaalJaarGeleden,
    laatsteAanmeldingMaximaalJaarGeleden,
    zonderAanmeldingen,
    minLeeftijd,
    maxLeeftijd,
    contactpersoon,
    volledigeNaamLike,
    type,
    geslacht,
    woonsituatie,
    werksituatie,
    voedingswens,
    metVerblijfadres,
    ...where
  } = filter;
  return {
    ...where,
    ...(foldersoorten?.length
      ? {
          foldervoorkeuren: {
            some: { folder: { in: foldersoorten.map(foldersoortMapper.toDB) } },
          },
        }
      : {}),
    ...(selectie?.length
      ? {
          selectie: {
            some: {
              selectie: { in: selectie.map(overigPersoonSelectieMapper.toDB) },
            },
          },
        }
      : {}),
    ...aanmeldingenWhere({
      laatsteAanmeldingMinimaalJaarGeleden,
      laatsteAanmeldingMaximaalJaarGeleden,
      zonderAanmeldingen,
    }),
    geboortedatum: dateRangeFilter({ minLeeftijd, maxLeeftijd }),
    type: persoonTypeMapper.toDB(type),
    woonsituatie: woonsituatieMapper.toDB(woonsituatie),
    werksituatie: werksituatieMapper.toDB(werksituatie),
    verblijfadresId: metVerblijfadres ? { not: null } : undefined,
    geslacht: geslachtMapper.toDB(geslacht),
    voedingswens: voedingswensMapper.toDB(voedingswens),
    ...(volledigeNaamLike
      ? {
          volledigeNaam: { contains: volledigeNaamLike },
        }
      : {}),
  };
}

type LeeftijdRangeFilter = Pick<PersoonFilter, 'minLeeftijd' | 'maxLeeftijd'>;

function aanmeldingenWhere({
  laatsteAanmeldingMaximaalJaarGeleden,
  laatsteAanmeldingMinimaalJaarGeleden,
  zonderAanmeldingen,
}: Pick<
  PersoonFilter,
  | 'laatsteAanmeldingMinimaalJaarGeleden'
  | 'laatsteAanmeldingMaximaalJaarGeleden'
  | 'zonderAanmeldingen'
>): db.Prisma.PersoonWhereInput {
  const thisYear = new Date().getFullYear();

  const someFilters: db.Prisma.AanmeldingWhereInput[] = [];
  const everyFilters: db.Prisma.AanmeldingWhereInput[] = [];
  if (laatsteAanmeldingMaximaalJaarGeleden !== undefined) {
    const maximaalFilter = {
      project: {
        jaar: {
          lte: thisYear - laatsteAanmeldingMaximaalJaarGeleden,
        },
      },
    };
    // Also fill in `someFilters`, so that empty aanmeldingen don't get returned
    someFilters.push(maximaalFilter);
    everyFilters.push(maximaalFilter);
  }
  if (laatsteAanmeldingMinimaalJaarGeleden !== undefined) {
    const minimaalFilter = {
      project: {
        jaar: {
          gte: thisYear - laatsteAanmeldingMinimaalJaarGeleden,
        },
      },
    };
    someFilters.push(minimaalFilter);
  }

  let zonderFilter: db.Prisma.AanmeldingWhereInput | undefined;
  if (zonderAanmeldingen) {
    zonderFilter = {};
  }
  return {
    aanmeldingen: {
      some: someFilters.length ? { AND: someFilters } : undefined,
      every: everyFilters.length ? { AND: everyFilters } : undefined,
      none: zonderFilter,
    },
  };
}

function dateRangeFilter({
  minLeeftijd,
  maxLeeftijd,
}: LeeftijdRangeFilter): db.Prisma.DateTimeNullableFilter<'Persoon'> {
  const now = new Date();
  return {
    ...(minLeeftijd === undefined
      ? {}
      : {
          lte: new Date(
            now.getFullYear() - minLeeftijd,
            now.getMonth(),
            now.getDate(),
          ),
        }),
    ...(maxLeeftijd === undefined
      ? {}
      : {
          gte: new Date(
            now.getFullYear() - (maxLeeftijd + 1),
            now.getMonth(),
            now.getDate() + 1,
          ),
        }),
  };
}

export const includePersoonAggregate = Object.freeze({
  verblijfadres: includeAdresWithPlaats,
  domicilieadres: includeAdresWithPlaats,
  foldervoorkeuren: true,
  eersteCursusAanmelding: Object.freeze({
    include: Object.freeze({
      project: true,
    }),
  }),
  eersteVakantieAanmelding: Object.freeze({
    include: Object.freeze({
      project: true,
    }),
  }),
  selectie: true,
} as const satisfies db.Prisma.PersoonInclude);

function toFoldervoorkeurInput(
  persoon: Persoon,
): db.Prisma.FoldervoorkeurUpdateManyWithoutPersoonNestedInput | undefined {
  return {
    deleteMany: {
      persoonId: persoon.id,
      folder: {
        notIn: persoon.foldervoorkeuren.map(({ folder }) =>
          foldersoortMapper.toDB(folder),
        ),
      },
    },
    upsert: persoon.foldervoorkeuren.map(({ communicatie, folder }) => {
      const dbFolderVoorkeur = {
        folder: foldersoortMapper.toDB(folder),
        communicatie: communicatievoorkeurMapper.toDB(communicatie),
      };
      return {
        where: {
          folder_persoonId: {
            folder: dbFolderVoorkeur.folder,
            persoonId: persoon.id,
          },
        },
        create: dbFolderVoorkeur,
        update: dbFolderVoorkeur,
      };
    }),
  };
}

type AllUpsertablePersoonFields = Omit<UpsertableDeelnemer, 'type'> &
  Omit<UpsertableOverigPersoon, 'type'> & {
    type: PersoonType;
  };

type PersoonUpdateFields = ExplicitNulls<
  Omit<Deelnemer, 'type'> &
    Omit<OverigPersoon, 'type'> & {
      type: PersoonType;
    }
>;

/**
 * This is a hack to make it easier to work with the UpsertablePersoon type
 */
function fillOutAllUpsertablePersoonFields(
  persoon: UpsertablePersoon,
): AllUpsertablePersoonFields {
  return {
    foldervoorkeuren: [],
    selectie: [],
    ...persoon,
  };
}
/**
 * This is a hack to make it easier to work with the Persoon type
 */
function toUpdatePersonFields(persoon: Persoon): PersoonUpdateFields {
  return {
    selectie: [],
    woonsituatieOpmerking: null,
    woonsituatie: null,
    werksituatie: null,
    voedingswens: null,
    begeleidendeDienst: null,
    domicilieadres: null,
    eersteCursus: null,
    eersteVakantie: null,
    voornaam: null,
    verblijfadres: null,
    werksituatieOpmerking: null,
    emailadres: null,
    rekeningnummer: null,
    rijksregisternummer: null,
    geboortedatum: null,
    geboorteplaats: null,
    voedingswensOpmerking: null,
    geslacht: null,
    geslachtOpmerking: null,
    telefoonnummer: null,
    gsmNummer: null,
    opmerking: null,
    fotoToestemming: {
      folder: false,
      infoboekje: false,
      nieuwsbrief: false,
      socialeMedia: false,
      website: false,
    },
    contactpersoon: {},
    ...persoon,
  };
}

type ContactPersoonFields = Pick<
  db.Prisma.PersoonCreateInput,
  | 'contactpersoon'
  | 'contactpersoonEmail'
  | 'contactpersoonGsm'
  | 'contactpersoonTelefoon'
>;

function toContactPersoonFields(
  contactpersoon?: Contactpersoon,
): ContactPersoonFields {
  return {
    contactpersoon: contactpersoon?.naam ?? null,
    contactpersoonEmail: contactpersoon?.email ?? null,
    contactpersoonGsm: contactpersoon?.gsm ?? null,
    contactpersoonTelefoon: contactpersoon?.telefoon ?? null,
  };
}

function toContactPersoon(contact: ContactPersoonFields): Contactpersoon {
  return purgeNulls({
    naam: contact.contactpersoon,
    email: contact.contactpersoonEmail,
    gsm: contact.contactpersoonGsm,
    telefoon: contact.contactpersoonTelefoon,
  });
}

type FotoToestemmingFields = Pick<
  db.Persoon,
  | 'toestemmingFotosFolder'
  | 'toestemmingFotosInfoboekje'
  | 'toestemmingFotosNieuwsbrief'
  | 'toestemmingFotosSocialeMedia'
  | 'toestemmingFotosWebsite'
>;

function toFotoToestemmingFields(
  toestemming?: FotoToestemming,
): FotoToestemmingFields {
  return {
    toestemmingFotosFolder: toestemming?.folder ?? false,
    toestemmingFotosInfoboekje: toestemming?.infoboekje ?? false,
    toestemmingFotosNieuwsbrief: toestemming?.nieuwsbrief ?? false,
    toestemmingFotosSocialeMedia: toestemming?.socialeMedia ?? false,
    toestemmingFotosWebsite: toestemming?.website ?? false,
  };
}

function toFotoToestemming(contact: FotoToestemmingFields): FotoToestemming {
  return {
    folder: contact.toestemmingFotosFolder,
    infoboekje: contact.toestemmingFotosInfoboekje,
    nieuwsbrief: contact.toestemmingFotosNieuwsbrief,
    socialeMedia: contact.toestemmingFotosSocialeMedia,
    website: contact.toestemmingFotosWebsite,
  };
}
