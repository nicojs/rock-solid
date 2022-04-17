import db from '@prisma/client';
import { ImportErrors } from './import-errors';

const adresRegex = /^(\D+)\s*(\d+)\s?(:?bus)?\s?(.*)?$/;
const ONBEKENDE_PLAATS_ID = 1; // 1 = "onbekend"

export class AdresSeeder<TRaw> {
  private plaatsIdByPostcode!: Map<string, number>;

  constructor(
    private client: db.PrismaClient,
    private importErrors: ImportErrors<TRaw>,
  ) {}

  async init() {
    this.plaatsIdByPostcode = new Map<string, number>(
      (
        await this.client.plaats.findMany({
          select: { postcode: true, id: true },
        })
      ).map(({ postcode, id }) => [postcode, id] as const),
    );
  }

  fromRawOrOnbekend(
    raw: TRaw,
    adres: string,
    postcode: string,
  ): db.Prisma.AdresCreateNestedOneWithoutVerblijfpersoonInput {
    return (
      this.fromRaw(raw, adres, postcode) ?? {
        create: {
          huisnummer: '',
          plaatsId: ONBEKENDE_PLAATS_ID,
          straatnaam: '',
        },
      }
    );
  }

  fromRaw(
    raw: TRaw,
    adres: string,
    postcode: string,
  ): undefined | db.Prisma.AdresCreateNestedOneWithoutVerblijfpersoonInput {
    if (!adres.length) {
      return undefined;
    }
    const adresMatch = adresRegex.exec(adres);

    if (!adresMatch) {
      this.importErrors.addWarning('adres_parse_error', {
        item: raw,
        detail: `Adres "${adres}" doesn\'t match pattern`,
      });
      return;
    }
    const [, straatnaam, huisnummer, busnummer] = adresMatch as unknown as [
      string,
      string,
      string,
      string | undefined,
    ];
    let plaatsId = this.plaatsIdByPostcode.get(postcode);
    if (plaatsId === undefined) {
      this.importErrors.addWarning('postcode_doesnt_exist', {
        detail: `Cannot find postcode "${postcode}", using onbekend`,
        item: raw,
      });
      plaatsId = ONBEKENDE_PLAATS_ID;
    }
    return {
      create: {
        huisnummer,
        straatnaam,
        busnummer,
        plaats: { connect: { id: plaatsId } },
      },
    };
  }
}
