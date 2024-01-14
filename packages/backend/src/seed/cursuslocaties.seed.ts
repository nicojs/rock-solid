import * as db from '@prisma/client';
import { readImportJson, writeOutputJson } from './seed-utils.js';
import { notEmpty } from '@rock-solid/shared';
import { ImportDiagnostics } from './import-errors.js';

interface RawCursus {
  titel: string;
  'aantal uren': string;
  cursusbijdrage: string;
  cursusnaam: string;
  data: string;
  'De Kei': string;
  Digistap: string;
  jaar: string;
  'Kei-Jong (niet BUSO)': string;
  'Kei-Jong BUSO': string;
  locaties: string;
  logiesbijdrage: string;
  opmerkingen: string;
  prijs: string;
  schooljaar: string;
}

export async function seedCursuslocaties(
  client: db.PrismaClient,
  cursussenLookup: Map<string, number> | undefined,
  readonly: boolean,
) {
  const importDiagnostics = new ImportDiagnostics<RawCursus>();

  const cursusIdsByTitle =
    cursussenLookup ??
    new Map(
      Object.entries(
        await readImportJson<Record<string, number>>('cursussen-lookup.json'),
      ),
    );

  const cursussenRaw = await readImportJson<RawCursus[]>('cursussen.json');
  const cursussenById = (
    await client.project.findMany({
      where: { id: { in: [...cursusIdsByTitle.values()] } },
      include: { activiteiten: true },
    })
  ).reduce((acc, cursus) => {
    acc.set(cursus.id, cursus);
    return acc;
  }, new Map<number, db.Project & { activiteiten: db.Activiteit[] }>());
  const cursussenMetLocaties = cursussenRaw
    .map((raw) => {
      const cursusId = cursusIdsByTitle.get(raw.titel);
      if (cursusId !== undefined) {
        return {
          locaties: raw.locaties.split(',').map((loc) => loc.trim()),
          cursus: cursussenById.get(cursusId)!,
          raw,
        };
      }
      return;
    })
    .filter(notEmpty);

  const locatieMapper = new LocatieMapper(client);

  let updated = 0;
  for (const { locaties, cursus, raw } of cursussenMetLocaties) {
    const activiteiten = cursus.activiteiten.sort(
      (a, b) => a.van.getTime() - b.van.getTime(),
    );
    if (locaties.length > activiteiten.length) {
      importDiagnostics.addWarning('more-locaties', {
        detail: `Vond ${locaties.length} locaties voor ${activiteiten.length} activiteiten`,
        item: raw,
      });
    }
    for (let i = 0; i < locaties.length; i++) {
      const activiteit = activiteiten[i];
      const locatieNaam = locaties[i]!;
      if (activiteit && locatieNaam !== '') {
        const locatie = await locatieMapper.upsert(locatieNaam);
        await client.activiteit.update({
          where: { id: activiteit.id },
          data: { locatie: { connect: { id: locatie.id } } },
        });
        updated++;
      }
    }
  }
  console.log(
    `Seeded ${locatieMapper.created} locaties, updated ${updated} activiteiten`,
  );
  console.log(`(${importDiagnostics.report})`);
  await writeOutputJson(
    'cursuslocaties-diagnostics.json',
    importDiagnostics,
    readonly,
  );
}

class LocatieMapper {
  map = new Map<string, db.Locatie>();
  #created = 0;
  constructor(private client: db.PrismaClient) {}

  get created() {
    return this.#created;
  }

  async upsert(name: string) {
    name = this.normalize(name);
    let locatie = this.map.get(name.toLowerCase());
    if (!locatie) {
      locatie = await this.client.locatie.create({
        data: { naam: name },
      });
      this.#created++;
      this.map.set(name.toLowerCase(), locatie);
    }
    return locatie;
  }

  private normalize(name: string) {
    return this.#naamOverrides[name.toLowerCase()] ?? name;
  }

  #malle = 'Provinciaal Vormingscentrum Malle';
  #scoutshuis = 'Scoutshuis';
  #hanenbos = 'Hanenbos';
  #laathof = 'Het Laathof';
  #merkenveld = 'Merkenveld';
  #destelheide = 'Destelheide';
  #moerkesheide = 'Moerkensheide';
  #groeninge = 'Hostel Groeninghe';
  #hostelH = 'Hostel H.';
  #muzet = 'Jeugdberg Bed Muzet';
  #kluis = 'De Kluis';
  #blauwput = 'Jeugdherberg de Blauwput';
  #zandpoort = 'Jeugdherberg De Zandpoort';
  #draecke = 'Jeugdherberg De Draecke';
  #rielen = 'Hoge Rielen';
  #pelterke = "'t Pelterke";
  #fiertel = 'Jeugdherberg De Fiertel';
  #iep = 'De Iep';
  #pierlapont = 'Boerderij De Pierlapont';
  #europe = 'Jeugdherberg Génération Europe';
  #heibrand = 'Heibrand';
  #bos = 'Verloren Bos';
  #waterval = 'De Waterval';
  #roerdomp = 'Jeugdherberg De Roerdomp';
  #heidepark = 'Heidepark';
  #begeinhof = 'Jeugdherberg Begeinhof';
  #heywijck = 'Heywijck';
  #kei = 'De Kei';
  #peerdevisser = 'Jeugdherberg De Peerdevisser';
  #brink = 'De Brink';
  #axlandhoeve = 'Axlandhoeve';

  #naamOverrides: Record<string, string> = {
    scouthuis: this.#scoutshuis,
    scoutshuis: this.#scoutshuis,
    antwerpen: this.#scoutshuis,
    'het scoutshuis': this.#scoutshuis,
    'scoutshuis antwerpen': this.#scoutshuis,
    malle: this.#malle,
    pvc: this.#malle,
    'pvc malle': this.#malle,
    'provinciaal vormingscentrum': this.#malle,
    pvm: this.#malle,
    'lokalen gezin en handicap': 'Lokalen Gezin en Handicap',
    hanenbo: this.#hanenbos,
    'hanenbos beersel': this.#hanenbos,
    beersel: this.#hanenbos,
    ha: this.#hanenbos,
    hingene: this.#laathof,
    laathof: this.#laathof,
    bornem: this.#laathof,
    loppem: this.#merkenveld,
    dworp: this.#destelheide,
    'de pinte': this.#moerkesheide,
    moerkensheid: this.#moerkesheide,
    'jeugdherberg kortrijk': this.#groeninge,
    'jeugdherberg in kortrijk': this.#groeninge,
    kortrijk: this.#groeninge,
    'jeugdherberg hostel h.': this.#hostelH,
    'jeugdherberg hostel': this.#hostelH,
    'hostel h.': this.#hostelH,
    hasselt: this.#hostelH,
    'jeugdherberg hostel h': this.#hostelH,
    lier: this.#muzet,
    'jeugdherberg bed muzet': this.#muzet,
    'jeugdberg bed muzet': this.#muzet,
    'sint-joris-weert': this.#kluis,
    'de kluis in sint-joris-weert': this.#kluis,
    'jeugdherberg de blauwput in leuven': this.#blauwput,
    leuven: this.#blauwput,
    'jeugdherberg de blauwput': this.#blauwput,
    'de blauwput': this.#blauwput,
    'de zandpoort': this.#zandpoort,
    mechelen: this.#zandpoort,
    'de draecke': this.#draecke,
    gent: this.#draecke,
    'de hoge rielen': this.#rielen,
    kasterlee: this.#rielen,
    'het pelterke': this.#pelterke,
    overpelt: this.#pelterke,
    'jeugdherberg de fiertel': this.#fiertel,
    'de fiertel': this.#fiertel,
    ieper: this.#iep,
    'boerderij de pierlapont zedelgem': this.#pierlapont,
    'boerderije de pierlapont zedelgem': this.#pierlapont,
    'jeugdherberg génération europa': this.#europe,
    'jeugdherberg europa': this.#europe,
    'génération europe': this.#europe,
    brussel: this.#europe,
    westmalle: this.#heibrand,
    lokeren: this.#bos,
    retie: this.#waterval,
    bokrijk: this.#roerdomp,
    waasmunster: this.#heidepark,
    'jeugdherberg begeinhof tongeren': this.#begeinhof,
    heywyck: this.#heywijck,
    'sint-niklaas': this.#heywijck,
    deurne: this.#kei,
    'de peerdevisser': this.#peerdevisser,
    herentals: this.#brink,
    'de axlandhoeve': this.#axlandhoeve,
  };
}
