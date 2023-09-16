import db from '@prisma/client';
import { ImportErrors } from './import-errors.js';

const adresRegex = /^(\D+)\s*(\d+)\s?(:?bus)?\s?(.*)?$/;

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

  fromRaw(
    raw: TRaw,
    adres: string,
    rawPostcode: string,
  ): undefined | db.Prisma.AdresCreateNestedOneWithoutVerblijfpersonenInput {
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

    const postCode = postcodeFromRaw(rawPostcode);
    const plaatsId = this.plaatsIdByPostcode.get(postCode);
    if (plaatsId === undefined) {
      this.importErrors.addWarning('postcode_doesnt_exist', {
        detail: `Cannot find postcode "${postCode}", using onbekend`,
        item: raw,
      });
      return;
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
const [from, to] = ['0'.charCodeAt(0), '9'.charCodeAt(0)];

function postcodeFromRaw(raw: string): string {
  return [...raw]
    .filter((char) => {
      const charCode = char.charCodeAt(0);
      return charCode >= from && charCode <= to;
    })
    .join('');
}
