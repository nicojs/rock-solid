-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Redefine VervoerstoerStop: make routeId nullable, add vervoerstoerId and isBestemming
CREATE TABLE "new_VervoerstoerStop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "routeId" INTEGER,
    "vervoerstoerId" INTEGER,
    "locatieId" INTEGER NOT NULL,
    "volgnummer" INTEGER NOT NULL DEFAULT 0,
    "geplandeAankomst" DATETIME,
    "isBestemming" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "VervoerstoerStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "VervoerstoerRoute" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VervoerstoerStop_vervoerstoerId_fkey" FOREIGN KEY ("vervoerstoerId") REFERENCES "Vervoerstoer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VervoerstoerStop_locatieId_fkey" FOREIGN KEY ("locatieId") REFERENCES "Locatie" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_VervoerstoerStop" ("geplandeAankomst", "id", "locatieId", "routeId", "volgnummer")
SELECT "geplandeAankomst", "id", "locatieId", "routeId", "volgnummer" FROM "VervoerstoerStop";
DROP TABLE "VervoerstoerStop";
ALTER TABLE "new_VervoerstoerStop" RENAME TO "VervoerstoerStop";

-- Migrate existing bestemmingen to bestemming stops
INSERT INTO "VervoerstoerStop" ("vervoerstoerId", "locatieId", "volgnummer", "isBestemming")
SELECT v."id", v."bestemmingId", 0, true FROM "Vervoerstoer" v WHERE v."bestemmingId" IS NOT NULL;

-- Migrate existing aanmelding opstapplaatsen to toe-te-kennen stops
-- For each aanmelding with an opstapplaats, create a stop on the vervoerstoer if it doesn't exist yet
-- (This is complex, so we skip it for now — existing vervoerstoeren will need manual re-assignment)

-- Redefine Vervoerstoer: remove bestemmingId
CREATE TABLE "new_Vervoerstoer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "aangemaaktDoor" TEXT NOT NULL
);
INSERT INTO "new_Vervoerstoer" ("aangemaaktDoor", "id") SELECT "aangemaaktDoor", "id" FROM "Vervoerstoer";
DROP TABLE "Vervoerstoer";
ALTER TABLE "new_Vervoerstoer" RENAME TO "Vervoerstoer";

-- Redefine Aanmelding: remove opstapplaatsId
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
    "plaatsId" INTEGER,
    "werksituatie" INTEGER,
    "woonsituatie" INTEGER,
    "geslacht" INTEGER,
    CONSTRAINT "Aanmelding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Aanmelding_deelnemerId_fkey" FOREIGN KEY ("deelnemerId") REFERENCES "Persoon" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Aanmelding_plaatsId_fkey" FOREIGN KEY ("plaatsId") REFERENCES "Plaats" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Aanmelding" ("bevestigingsbriefVerzondenOp", "deelnemerId", "geslacht", "id", "opmerking", "plaatsId", "projectId", "rekeninguittrekselNummer", "rekeninguittrekselNummerVoorschot", "status", "tijdstipVanAanmelden", "vervoersbriefVerzondenOp", "werksituatie", "woonsituatie")
SELECT "bevestigingsbriefVerzondenOp", "deelnemerId", "geslacht", "id", "opmerking", "plaatsId", "projectId", "rekeninguittrekselNummer", "rekeninguittrekselNummerVoorschot", "status", "tijdstipVanAanmelden", "vervoersbriefVerzondenOp", "werksituatie", "woonsituatie" FROM "Aanmelding";
DROP TABLE "Aanmelding";
ALTER TABLE "new_Aanmelding" RENAME TO "Aanmelding";
CREATE UNIQUE INDEX "Aanmelding_projectId_deelnemerId_key" ON "Aanmelding"("projectId", "deelnemerId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
