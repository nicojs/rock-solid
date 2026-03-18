/*
  Warnings:

  - You are about to drop the column `opstapplaatsId` on the `Aanmelding` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Vervoerstoer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bestemmingStopId" INTEGER,
    "datum" DATETIME,
    "datumTerug" DATETIME,
    "aangemaaktDoor" TEXT NOT NULL,
    CONSTRAINT "Vervoerstoer_bestemmingStopId_fkey" FOREIGN KEY ("bestemmingStopId") REFERENCES "VervoerstoerStop" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VervoerstoerRoute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vervoerstoerId" INTEGER NOT NULL,
    "chauffeurId" INTEGER,
    "vertrekTijd" DATETIME,
    "vertrekTijdTerug" DATETIME,
    "vertrekadresId" INTEGER,
    CONSTRAINT "VervoerstoerRoute_vervoerstoerId_fkey" FOREIGN KEY ("vervoerstoerId") REFERENCES "Vervoerstoer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VervoerstoerRoute_chauffeurId_fkey" FOREIGN KEY ("chauffeurId") REFERENCES "Persoon" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "VervoerstoerRoute_vertrekadresId_fkey" FOREIGN KEY ("vertrekadresId") REFERENCES "Adres" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VervoerstoerStop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "routeId" INTEGER,
    "vervoerstoerId" INTEGER,
    "locatieId" INTEGER NOT NULL,
    "volgnummer" INTEGER NOT NULL DEFAULT 0,
    "geplandeAankomst" DATETIME,
    "geplandeAankomstTerug" DATETIME,
    CONSTRAINT "VervoerstoerStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "VervoerstoerRoute" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VervoerstoerStop_vervoerstoerId_fkey" FOREIGN KEY ("vervoerstoerId") REFERENCES "Vervoerstoer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VervoerstoerStop_locatieId_fkey" FOREIGN KEY ("locatieId") REFERENCES "Locatie" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ProjectToVervoerstoer" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ProjectToVervoerstoer_A_fkey" FOREIGN KEY ("A") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ProjectToVervoerstoer_B_fkey" FOREIGN KEY ("B") REFERENCES "Vervoerstoer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_AanmeldingToVervoerstoerStop" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_AanmeldingToVervoerstoerStop_A_fkey" FOREIGN KEY ("A") REFERENCES "Aanmelding" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AanmeldingToVervoerstoerStop_B_fkey" FOREIGN KEY ("B") REFERENCES "VervoerstoerStop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate data
INSERT INTO "Vervoerstoer"
    ("aangemaaktDoor")
SELECT DISTINCT "Project"."Id"
FROM "Aanmelding"
    INNER JOIN "Project" ON "Project"."Id" = "Aanmelding"."ProjectId"
WHERE "opstapplaatsId" IS NOT NULL;

INSERT INTO "_ProjectToVervoerstoer"
    ("A", "B")
SELECT "Project"."Id", "Vervoerstoer"."id"
FROM "Vervoerstoer"
    INNER JOIN "Project" ON "Project"."Id" = "Vervoerstoer"."aangemaaktDoor";

INSERT INTO "VervoerstoerStop"
    ("vervoerstoerId", "locatieId")
SELECT DISTINCT "Vervoerstoer"."id", "Aanmelding"."opstapplaatsId"
FROM "Vervoerstoer"
    INNER JOIN "Project" ON "Project"."Id" = "Vervoerstoer"."aangemaaktDoor"
    INNER JOIN "Aanmelding" ON "Aanmelding"."ProjectId" = "Project"."Id"
WHERE "Aanmelding"."opstapplaatsId" IS NOT NULL;

INSERT INTO "_AanmeldingToVervoerstoerStop"
    ("A", "B") 
SELECT "Aanmelding"."id", "VervoerstoerStop"."id"
FROM "VervoerstoerStop"
    INNER JOIN "Vervoerstoer" ON "Vervoerstoer"."id" = "VervoerstoerStop"."vervoerstoerId"
    INNER JOIN "Project" ON "Project"."Id" = "Vervoerstoer"."aangemaaktDoor"
    INNER JOIN "Aanmelding" ON "Aanmelding"."ProjectId" = "Project"."Id"
WHERE "Aanmelding"."opstapplaatsId" = "VervoerstoerStop"."locatieId";

UPDATE "Vervoerstoer" SET "aangemaaktDoor" = 'Nico Jansen';



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
    "plaatsId" INTEGER,
    "werksituatie" INTEGER,
    "woonsituatie" INTEGER,
    "geslacht" INTEGER,
    CONSTRAINT "Aanmelding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Aanmelding_deelnemerId_fkey" FOREIGN KEY ("deelnemerId") REFERENCES "Persoon" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Aanmelding_plaatsId_fkey" FOREIGN KEY ("plaatsId") REFERENCES "Plaats" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Aanmelding" ("bevestigingsbriefVerzondenOp", "deelnemerId", "geslacht", "id", "opmerking", "plaatsId", "projectId", "rekeninguittrekselNummer", "rekeninguittrekselNummerVoorschot", "status", "tijdstipVanAanmelden", "vervoersbriefVerzondenOp", "werksituatie", "woonsituatie") SELECT "bevestigingsbriefVerzondenOp", "deelnemerId", "geslacht", "id", "opmerking", "plaatsId", "projectId", "rekeninguittrekselNummer", "rekeninguittrekselNummerVoorschot", "status", "tijdstipVanAanmelden", "vervoersbriefVerzondenOp", "werksituatie", "woonsituatie" FROM "Aanmelding";
DROP TABLE "Aanmelding";
ALTER TABLE "new_Aanmelding" RENAME TO "Aanmelding";
CREATE UNIQUE INDEX "Aanmelding_projectId_deelnemerId_key" ON "Aanmelding"("projectId", "deelnemerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Vervoerstoer_bestemmingStopId_key" ON "Vervoerstoer"("bestemmingStopId");

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectToVervoerstoer_AB_unique" ON "_ProjectToVervoerstoer"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectToVervoerstoer_B_index" ON "_ProjectToVervoerstoer"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AanmeldingToVervoerstoerStop_AB_unique" ON "_AanmeldingToVervoerstoerStop"("A", "B");

-- CreateIndex
CREATE INDEX "_AanmeldingToVervoerstoerStop_B_index" ON "_AanmeldingToVervoerstoerStop"("B");
