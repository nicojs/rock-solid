// @ts-check

import fs from 'fs/promises';

/**
 * @see https://docs.basisregisters.vlaanderen.be/docs/api-documentation.html#operation/ListMunicipalities
 * @see https://nl.wikipedia.org/wiki/Postcode#Postnummers_in_Belgi%C3%AB
 */

/**
 * @typedef PostcodeInfo
 * @property {string} deelgemeente
 * @property {string} postcode
 */

/**
 * @typedef Gemeente
 * @property {string} naam
 */

/**
 * @typedef Plaats
 * @property {string} volledigeNaam
 * @property {string} deelgemeente
 * @property {string} gemeente
 * @property {string} postcode
 * @property {number} provincieId
 */

/**
 * @typedef PostcodePage
 * @property {PostcodeInfo[]} postcodes
 * @property {string?} volgende
 */

/**
 * @typedef GemeentePage
 * @property {Gemeente[]} gemeenten
 * @property {string?} volgende
 */

/**
 * @typedef GeografischeNaamContainer
 * @property {} geografischeNaam
 * @property {string?} volgende
 */

async function get(url) {
  const response = await fetch(url, {
    headers: { ['Content-Type']: 'application/json' },
  });
  const body = await response.json();
  return body;
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
];

/**
 * @param {string} url
 * @returns {Promise<PostcodePage>}
 */
async function retrievePostcodePage(url) {
  const body = await get(url);
  return {
    postcodes: body.postInfoObjecten.map((postInfo) => ({
      postcode: postInfo.identificator.objectId,
      deelgemeente: postInfo.postnamen.sort((a, b) =>
        a.geografischeNaam.taal === 'nl'
          ? 1
          : b.geografischeNaam.taal === 'nl'
          ? -1
          : 0,
      )[0].geografischeNaam.spelling,
    })),
    volgende: body.volgende,
  };
}

/**
 * @param {string} url
 * @returns {Promise<GemeentePage>}
 */
async function retrieveGemeentePage(url) {
  const { gemeenten, volgende } = await get(url);
  return {
    gemeenten: gemeenten.map((gemeenteInfo) => ({
      naam: gemeenteInfo.gemeentenaam.geografischeNaam.spelling,
    })),
    volgende,
  };
}

/**
 * Gets the provincie id based on the postcode
 * @param {string} postCode
 * @returns {number}
 * @see https://nl.wikipedia.org/wiki/Postcode#Postnummers_in_Belgi%C3%AB
 */
function getProvincieId(postCode) {
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
};

/**
 * @param {string} gemeente
 * @returns {Promise<Plaats[]>}
 */
async function retrievePlaatsen(gemeente) {
  let url = `https://api.basisregisters.vlaanderen.be/v2/postinfo?gemeentenaam=${gemeente}`;
  /** @type {Plaats[]} */
  let plaatsen = [];
  while (url) {
    const { postcodes, volgende } = await retrievePostcodePage(url);
    plaatsen.push(
      ...postcodes.map(({postcode, ...info}) => {
        const deelgemeente = info.deelgemeente === gemeente.toUpperCase() ? gemeente : info.deelgemeente;
        return {
          postcode: postcode,
          // Whenever the deelgemeente is equal to the gemeente, it will be all uppercase 🤷‍♂️. Let's correct for that
          deelgemeente,
          gemeente,
          // Keep in sync with plaatsName pipe
          volledigeNaam: `${postcode} ${deelgemeente} (${gemeente})`,
          provincieId: getProvincieId(postcode),
        }
      }),
    );
    url = volgende;
    if (volgende) {
      console.log(`Gemeente ${gemeente} heeft volgende ${volgende}`);
    }
  }
  return plaatsen;
}

/**
 * @param {Plaats[]} allPlaatsen
 * @return {Plaats[]}
 */
function removeDuplicates(allPlaatsen) {
  /** @type {Map<string, Plaats[]>} */
  const plaatsenPerPostcode = new Map();
  allPlaatsen.forEach((plaats) => {
    let plaatsen = plaatsenPerPostcode.get(plaats.postcode);
    if (plaatsen) {
      plaatsen.push(plaats);
      plaatsen = plaatsen.filter(plaats => !blacklist.some(({ gemeente, postcode}) => plaats.gemeente === gemeente && plaats.postcode === postcode ))
      if(plaatsen.length > 1){
        throw new Error(`Cannot remove duplicates, because they are not blacklisted: ${JSON.stringify(plaatsen, null, 2)}`);
      }
    } else {
      plaatsen = [plaats];
    }
    plaatsenPerPostcode.set(plaats.postcode, plaatsen);
  });
  return [...plaatsenPerPostcode.values()].flat();
}

async function main() {
  let gemeenteUrl = 'https://api.basisregisters.vlaanderen.be/v2/gemeenten';
  /** @type {Plaats[]} */
  const allPlaatsen = [];
  /** @type {Set<string>} */
  const gemeentenSet = new Set();
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

  const result = removeDuplicates(allPlaatsen).sort((a, b) => a.postcode < b.postcode ? -1 : 1);
  console.log('All plaatsen', result.length);
  await fs.writeFile(
    'plaatsen.json',
    JSON.stringify(result, null, 2),
    'utf-8',
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
