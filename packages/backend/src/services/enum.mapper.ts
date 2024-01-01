import {
  Aanmeldingsstatus,
  Communicatievoorkeur,
  Foldersoort,
  Geslacht,
  Organisatieonderdeel,
  Organisatiesoort,
  OverigPersoonSelectie,
  PersoonType,
  ProjectType,
  VakantieSeizoen,
  VakantieVerblijf,
  VakantieVervoer,
  Voedingswens,
  Werksituatie,
  Woonsituatie,
} from '@rock-solid/shared';

type EnumDBMap<T extends string> = Record<Exclude<T, 'onbekend'>, number>;
type DBType<T extends string, U extends T | undefined> = U extends undefined
  ? undefined
  : number;
type SchemaType<
  T extends string,
  U extends number | undefined | null,
> = U extends undefined | null ? undefined : T;

function createEnumMapper<T extends string>(name: string, map: EnumDBMap<T>) {
  const reverseMap: Readonly<Record<number, T>> = Object.entries(map).reduce(
    (acc, [k, v]) => {
      const dbValue = v as number;
      if (acc[dbValue] !== undefined)
        throw new Error(`Duplicate value ${dbValue} for enum ${name}`);
      acc[dbValue] = k as T;
      return acc;
    },
    {} as Record<number, T>,
  );
  return {
    toDB<U extends T | undefined>(value: U): DBType<T, U> {
      if (value === 'onbekend' || value === undefined) {
        return undefined as DBType<T, U>;
      }
      const result = map[value as unknown as Exclude<T, 'onbekend'>];
      if (result === undefined) {
        throw new Error(`Value ${value} is not a valid enum value for ${name}`);
      }
      return result as DBType<T, U>;
    },
    toSchema<U extends undefined | null | number>(value: U): SchemaType<T, U> {
      if (value === undefined || value === null) {
        return undefined as SchemaType<T, U>;
      }
      const mapped = reverseMap[value as number];
      if (mapped === undefined) {
        throw new Error(`Value ${value} is not a valid enum value for ${name}`);
      }
      return mapped as SchemaType<T, U>;
    },
  };
}

export const geslachtMapper = createEnumMapper<Geslacht>('geslacht', {
  man: 1,
  vrouw: 2,
  x: 3,
});

export const persoonTypeMapper = createEnumMapper<PersoonType>('persoonType', {
  deelnemer: 1,
  overigPersoon: 2,
});

export const communicatievoorkeurMapper =
  createEnumMapper<Communicatievoorkeur>('communicatievoorkeur', {
    email: 1,
    post: 2,
    postEnEmail: 3,
  });

export const foldersoortMapper = createEnumMapper<Foldersoort>('foldersoort', {
  deKeiCursussen: 1,
  deKeiWintervakantie: 2,
  deKeiZomervakantie: 3,
  keiJongBuso: 4,
  keiJongNietBuso: 5,
  infoboekje: 6,
});

export const projectTypeMapper = createEnumMapper<ProjectType>('projectType', {
  cursus: 1,
  vakantie: 2,
});

export const organisatieonderdeelMapper =
  createEnumMapper<Organisatieonderdeel>('organisatieonderdeel', {
    deKei: 1,
    keiJongBuSO: 2,
    keiJongNietBuSO: 3,
  });

export const woonsituatieMapper = createEnumMapper<Woonsituatie>(
  'woonsituatie',
  {
    oudersMetProfessioneleBegeleiding: 1,
    oudersZonderProfessioneleBegeleiding: 2,
    residentieleWoonondersteuning: 3,
    zelfstandigMetProfessioneleBegeleiding: 4,
    zelfstandigZonderProfessioneleBegeleiding: 5,
    anders: 6,
  },
);

export const werksituatieMapper = createEnumMapper<Werksituatie>(
  'werksituatie',
  {
    arbeidstrajectbegeleiding: 1,
    arbeidszorg: 2,
    dagbesteding: 3,
    maatwerkbedrijf: 4,
    pensioen: 6,
    reguliereArbeidscircuit: 7,
    school: 8,
    vrijwilligerswerk: 9,
    werkzoekend: 10,
  },
);

export const aanmeldingsstatusMapper = createEnumMapper<Aanmeldingsstatus>(
  'aanmeldingsstatus',
  {
    Aangemeld: 0,
    Bevestigd: 1,
    Geannuleerd: 2,
    OpWachtlijst: 3,
  },
);

export const overigPersoonSelectieMapper =
  createEnumMapper<OverigPersoonSelectie>('overigPersoonSelectie', {
    algemeneVergaderingDeBedding: 1,
    algemeneVergaderingDeKei: 2,
    algemeneVergaderingKeiJong: 3,
    personeel: 4,
    raadVanBestuurDeKei: 5,
    raadVanBestuurKeiJong: 6,
    vakantieVrijwilliger: 7,
  });

export const vakantieseizoenMapper = createEnumMapper<VakantieSeizoen>(
  'vakantieseizoen',
  {
    winter: 1,
    zomer: 2,
  },
);

export const vakantieVerblijfMapper = createEnumMapper<VakantieVerblijf>(
  'vakantieverblijf',
  {
    boot: 1,
    hotelOfPension: 2,
    vakantiehuis: 3,
  },
);

export const vakantieVervoerMapper = createEnumMapper<VakantieVervoer>(
  'vakantieVervoer',
  {
    autocarNacht: 1,
    autocarOverdag: 2,
    boot: 3,
    minibus: 4,
    trein: 5,
    vliegtuig: 6,
  },
);

export const organisatiesoortMapper = createEnumMapper<Organisatiesoort>(
  'organisatiesoort',
  {
    AmbulanteWoonondersteuning: 1,
    ResidentieleWoonondersteuningMinderjarigen: 2,
    ResidentieleWoonondersteuningMeerderjarigen: 3,
    Pleegzorg: 4,
    RechtstreeksToegankelijkeHulp: 5,
    BijzondereJeugdzorg: 6,
    Psychiatrie: 7,
    Maatwerkbedrijf: 8,
    Dagwerking: 9,
    BegeleidWerkOfVrijwilligerswerk: 10,
    ArbeidstrajectBegeleiding: 11,
    Arbeidszorg: 12,
    BuSO: 13,
    CLB: 14,
    CentraBasiseducatie: 15,
    CAW: 16,
    JAC: 17,
    OCMW: 18,
    GGZ: 19,
    Justitiehuizen: 20,
    OndersteuningTrajectbegeleiding: 21,
    Vrijetijdsaanbod: 22,
    Algemeen: 23,
    Jeugdorganisatie: 24,
    Jeugddienst: 25,
    SociaalCultureleOrganisaties: 26,
    SteunpuntenEnFederaties: 27,
    Anders: 100,
  },
);

export const voedingswensMapper = createEnumMapper<Voedingswens>(
  'voedingswens',
  {
    vegetarisch: 1,
    halal: 2,
    anders: 100,
  },
);
