-- AlterTable
ALTER TABLE "Persoon" ADD COLUMN "vervoerstoerStopId" INTEGER;

-- CreateTable
CREATE TABLE "Vervoerstoer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bestemmingId" INTEGER,
    CONSTRAINT "Vervoerstoer_bestemmingId_fkey" FOREIGN KEY ("bestemmingId") REFERENCES "Locatie" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VervoerstoerRoute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vervoerstoerId" INTEGER NOT NULL,
    "chauffeurId" INTEGER,
    "vertrekTijd" DATETIME,
    "vertrekadresId" INTEGER,
    CONSTRAINT "VervoerstoerRoute_vervoerstoerId_fkey" FOREIGN KEY ("vervoerstoerId") REFERENCES "Vervoerstoer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VervoerstoerRoute_chauffeurId_fkey" FOREIGN KEY ("chauffeurId") REFERENCES "Persoon" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VervoerstoerRoute_vertrekadresId_fkey" FOREIGN KEY ("vertrekadresId") REFERENCES "Adres" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VervoerstoerStop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "routeId" INTEGER NOT NULL,
    "locatieId" INTEGER NOT NULL,
    "volgnummer" INTEGER NOT NULL,
    "geplandeAankomst" DATETIME,
    CONSTRAINT "VervoerstoerStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "VervoerstoerRoute" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VervoerstoerStop_locatieId_fkey" FOREIGN KEY ("locatieId") REFERENCES "Locatie" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Aanmelding" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "deelnemerId" INTEGER,
    "rekeninguittrekselNummer" TEXT,
    "rekeninguittrekselNummerVoorschot" TEXT,
    "tijdstipVanAanmelden" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" INTEGER NOT NULL DEFAULT 0,
    "opmerking" TEXT,
    "bevestigingsbriefVerzondenOp" DATETIME,
    "vervoersbriefVerzondenOp" DATETIME,
    "opstapplaatsId" INTEGER,
    "plaatsId" INTEGER,
    "werksituatie" INTEGER,
    "woonsituatie" INTEGER,
    "geslacht" INTEGER,
    "vervoerstoerStopId" INTEGER,
    CONSTRAINT "Aanmelding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Aanmelding_deelnemerId_fkey" FOREIGN KEY ("deelnemerId") REFERENCES "Persoon" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Aanmelding_opstapplaatsId_fkey" FOREIGN KEY ("opstapplaatsId") REFERENCES "Locatie" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Aanmelding_plaatsId_fkey" FOREIGN KEY ("plaatsId") REFERENCES "Plaats" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Aanmelding_vervoerstoerStopId_fkey" FOREIGN KEY ("vervoerstoerStopId") REFERENCES "VervoerstoerStop" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Aanmelding" ("bevestigingsbriefVerzondenOp", "deelnemerId", "geslacht", "id", "opmerking", "opstapplaatsId", "plaatsId", "projectId", "rekeninguittrekselNummer", "rekeninguittrekselNummerVoorschot", "status", "tijdstipVanAanmelden", "vervoersbriefVerzondenOp", "werksituatie", "woonsituatie") SELECT "bevestigingsbriefVerzondenOp", "deelnemerId", "geslacht", "id", "opmerking", "opstapplaatsId", "plaatsId", "projectId", "rekeninguittrekselNummer", "rekeninguittrekselNummerVoorschot", "status", "tijdstipVanAanmelden", "vervoersbriefVerzondenOp", "werksituatie", "woonsituatie" FROM "Aanmelding";
DROP TABLE "Aanmelding";
ALTER TABLE "new_Aanmelding" RENAME TO "Aanmelding";
CREATE UNIQUE INDEX "Aanmelding_projectId_deelnemerId_key" ON "Aanmelding"("projectId", "deelnemerId");
CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectnummer" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "jaar" INTEGER NOT NULL,
    "saldo" DECIMAL,
    "vervoerstoerId" INTEGER,
    "organisatieonderdeel" INTEGER,
    "doelgroep" INTEGER,
    "categorie" INTEGER,
    "vakantiesoort" INTEGER,
    "bestemming" TEXT,
    "land" TEXT,
    "seizoen" INTEGER,
    "voorschot" DECIMAL,
    CONSTRAINT "Project_vervoerstoerId_fkey" FOREIGN KEY ("vervoerstoerId") REFERENCES "Vervoerstoer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("bestemming", "categorie", "doelgroep", "id", "jaar", "land", "naam", "organisatieonderdeel", "projectnummer", "saldo", "seizoen", "titel", "type", "vakantiesoort", "voorschot") SELECT "bestemming", "categorie", "doelgroep", "id", "jaar", "land", "naam", "organisatieonderdeel", "projectnummer", "saldo", "seizoen", "titel", "type", "vakantiesoort", "voorschot" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_projectnummer_key" ON "Project"("projectnummer");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "VervoerstoerStop_routeId_volgnummer_key" ON "VervoerstoerStop"("routeId", "volgnummer");
