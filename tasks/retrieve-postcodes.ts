import fs from 'fs/promises';
import { z } from 'zod';

/**
 * @see https://docs.basisregisters.vlaanderen.be/docs/api-documentation.html#operation/ListMunicipalities
 * @see https://nl.wikipedia.org/wiki/Postcode#Postnummers_in_Belgi%C3%AB
 */

const PostcodeInfo = z.object({
  deelgemeente: z.string(),
  postcode: z.string(),
});

const Gemeente = z.object({
  naam: z.string(),
});

const Plaats = z.object({
  volledigeNaam: z.string(),
  deelgemeente: z.string(),
  gemeente: z.string(),
  postcode: z.string(),
  provincieId: z.number(),
});

const PostcodePage = z.object({
  postcodes: z.array(PostcodeInfo),
  volgende: z.string().nullable(),
});

const GemeentePage = z.object({
  gemeenten: z.array(Gemeente),
  volgende: z.string().nullable(),
});

const PostInfoObject = z.object({
  identificator: z.object({
    objectId: z.string(),
  }),
  postnamen: z.array(
    z.object({
      geografischeNaam: z.object({
        spelling: z.string(),
      }),
    }),
  ),
});

const PostInfoResponse = z.object({
  postInfoObjecten: z.array(PostInfoObject),
  volgende: z.string().optional(),
});

const GemeenteInfo = z.object({
  gemeentenaam: z.object({
    geografischeNaam: z.object({
      spelling: z.string(),
    }),
  }),
});

const GemeenteResponse = z.object({
  gemeenten: z.array(GemeenteInfo),
  volgende: z.string().optional(),
});

type PostcodeInfo = z.infer<typeof PostcodeInfo>;
type Gemeente = z.infer<typeof Gemeente>;
type Plaats = z.infer<typeof Plaats>;
type PostcodePage = z.infer<typeof PostcodePage>;
type GemeentePage = z.infer<typeof GemeentePage>;
type PostInfoResponse = z.infer<typeof PostInfoResponse>;
type GemeenteResponse = z.infer<typeof GemeenteResponse>;

async function get<T>(url: string, schema: z.ZodSchema<T>): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await response.json();
  return schema.parse(body);
}

/**
 * These postcodes seem to be duplicated, once for 'Sint-Niklaas' and once for 'Saint-Nicolas'
 */
const blacklist = [
  {
    postcode: '9100',
    gemeente: 'Saint-Nicolas',
  },
  {
    postcode: '9111',
    gemeente: 'Saint-Nicolas',
  },
  {
    postcode: '9112',
    gemeente: 'Saint-Nicolas',
  },
] as const;

async function retrievePostcodePage(url: string): Promise<PostcodePage> {
  const body = await get(url, PostInfoResponse);
  return {
    postcodes: body.postInfoObjecten.flatMap((postInfo) =>
      postInfo.postnamen.map((postnaam) => ({
        postcode: postInfo.identificator.objectId,
        deelgemeente: postnaam.geografischeNaam.spelling,
      })),
    ),
    volgende: body.volgende ?? null,
  };
}

async function retrieveGemeentePage(url: string): Promise<GemeentePage> {
  const body = await get(url, GemeenteResponse);
  return {
    gemeenten: body.gemeenten.map((gemeenteInfo) => ({
      naam: gemeenteInfo.gemeentenaam.geografischeNaam.spelling,
    })),
    volgende: body.volgende ?? null,
  };
}

/**
 * Gets the provincie id based on the postcode
 * @param postCode
 * @returns provincie id
 * @see https://nl.wikipedia.org/wiki/Postcode#Postnummers_in_Belgi%C3%AB
 */
function getProvincieId(postCode: string): number {
  const postnr = parseInt(postCode);

  if (postnr >= 1000 && postnr <= 1299) {
    return provincies['Brussels Hoofdstedelijk Gewest'];
  }
  if (postnr >= 1300 && postnr <= 1499) {
    return provincies['Waals-Brabant'];
  }
  if (
    (postnr >= 1500 && postnr <= 1999) ||
    (postnr >= 3000 && postnr <= 3499)
  ) {
    return provincies['Vlaams-Brabant'];
  }
  if (postnr >= 2000 && postnr <= 2999) {
    return provincies.Antwerpen;
  }
  if (postnr >= 3500 && postnr <= 3999) {
    return provincies.Limburg;
  }
  if (postnr >= 4000 && postnr <= 4999) {
    return provincies.Luik;
  }
  if (postnr >= 5000 && postnr <= 5999) {
    return provincies.Namen;
  }
  if (
    (postnr >= 6000 && postnr <= 6599) ||
    (postnr >= 7000 && postnr <= 7999)
  ) {
    return provincies.Henegouwen;
  }
  if (postnr >= 6600 && postnr <= 6999) {
    return provincies.Luxemburg;
  }
  if (postnr >= 8000 && postnr <= 8999) {
    return provincies['West-Vlaanderen'];
  }
  if (postnr >= 9000 && postnr <= 9999) {
    return provincies['Oost-Vlaanderen'];
  }
  throw new Error(`Postcode invalid: "${postCode}"`);
  // 'Brussels Hoofdstedelijk Gewest': 1000-1299
  // 'Waals-Brabant': 1300-1499
  // 'Vlaams-Brabant': 1500-1999, 3000-3499
  // 'Antwerpen': 2000-2999
  // 'Limburg': 3500-3999
  // 'Luik': 4000-4999
  // 'Namen': 5000-5999
  // 'Henegouwen': 6000-6599,7000-7999
  // 'Luxemburg': 6600-6999
  // 'West-Vlaanderen': 8000-8999
  // 'Oost-Vlaanderen': 9000-9999
}

const provincies = {
  'Brussels Hoofdstedelijk Gewest': 1,
  'Waals-Brabant': 2,
  'Vlaams-Brabant': 3,
  Antwerpen: 4,
  Limburg: 5,
  Luik: 6,
  Namen: 7,
  Henegouwen: 8,
  Luxemburg: 9,
  'West-Vlaanderen': 10,
  'Oost-Vlaanderen': 11,
} as const;

async function retrievePlaatsen(gemeente: string): Promise<Plaats[]> {
  let url: string | null =
    `https://api.basisregisters.vlaanderen.be/v2/postinfo?gemeentenaam=${gemeente}`;
  const plaatsen: Plaats[] = [];
  while (url) {
    const { postcodes, volgende } = await retrievePostcodePage(url);
    plaatsen.push(
      ...postcodes.map(({ postcode, ...info }) => {
        // Whenever the deelgemeente is equal to the gemeente, it will be all uppercase 🤷‍♂️. Let's correct for that
        const deelgemeente =
          info.deelgemeente === gemeente.toUpperCase()
            ? gemeente
            : info.deelgemeente;
        return {
          postcode: postcode,
          deelgemeente,
          gemeente,
          volledigeNaam: `${postcode} ${deelgemeente} (${gemeente})`,
          provincieId: getProvincieId(postcode),
        };
      }),
    );
    url = volgende;
    if (volgende) {
      console.log(`Gemeente ${gemeente} heeft volgende ${volgende}`);
    }
  }
  return plaatsen;
}

function removeDuplicates(allPlaatsen: Plaats[]): Plaats[] {
  const plaatsenPerPostcode = new Map<string, Plaats[]>();
  allPlaatsen.forEach((plaats) => {
    let plaatsen = plaatsenPerPostcode.get(plaats.postcode);
    if (plaatsen) {
      plaatsen.push(plaats);
      plaatsen = plaatsen.filter(
        (plaats) =>
          !blacklist.some(
            ({ gemeente, postcode }) =>
              plaats.gemeente === gemeente && plaats.postcode === postcode,
          ),
      );
      if (plaatsen.length > 1) {
        throw new Error(
          `Cannot remove duplicates, because they are not blacklisted: ${JSON.stringify(
            plaatsen,
            null,
            2,
          )}`,
        );
      }
    } else {
      plaatsen = [plaats];
    }
    plaatsenPerPostcode.set(plaats.postcode, plaatsen);
  });
  return [...plaatsenPerPostcode.values()].flat();
}

let gemeenteUrl: string | null =
  'https://api.basisregisters.vlaanderen.be/v2/gemeenten';
const allPlaatsen: Plaats[] = [];
const gemeentenSet = new Set<string>();
while (gemeenteUrl) {
  const { gemeenten, volgende } = await retrieveGemeentePage(gemeenteUrl);
  for (const gemeente of gemeenten) {
    if (gemeentenSet.has(gemeente.naam)) {
      console.log('Detected duplicate gemeente', gemeente);
    } else {
      gemeentenSet.add(gemeente.naam);
      const plaatsen = await retrievePlaatsen(gemeente.naam);
      allPlaatsen.push(...plaatsen);
    }
  }
  gemeenteUrl = volgende;
  console.log(allPlaatsen.length);
}

const result = allPlaatsen;
// const result = removeDuplicates(allPlaatsen).sort((a, b) =>
//   a.postcode < b.postcode ? -1 : 1,
// );
console.log('All plaatsen', result.length);
await fs.writeFile('plaatsen.json', JSON.stringify(result, null, 2), 'utf-8');
