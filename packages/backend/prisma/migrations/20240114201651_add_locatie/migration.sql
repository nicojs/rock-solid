-- AlterTable
ALTER TABLE "Aanmelding" ADD COLUMN "opmerking" TEXT;

-- CreateTable
CREATE TABLE "Locatie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "naam" TEXT NOT NULL,
    "adresId" INTEGER,
    CONSTRAINT "Locatie_adresId_fkey" FOREIGN KEY ("adresId") REFERENCES "Adres" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Activiteit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "van" DATETIME NOT NULL,
    "totEnMet" DATETIME NOT NULL,
    "vormingsuren" REAL,
    "begeleidingsuren" REAL,
    "metOvernachting" BOOLEAN NOT NULL DEFAULT false,
    "locatieId" INTEGER,
    "verblijf" INTEGER,
    "vervoer" INTEGER,
    CONSTRAINT "Activiteit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Activiteit_locatieId_fkey" FOREIGN KEY ("locatieId") REFERENCES "Locatie" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Activiteit" ("begeleidingsuren", "id", "metOvernachting", "projectId", "totEnMet", "van", "verblijf", "vervoer", "vormingsuren") SELECT "begeleidingsuren", "id", "metOvernachting", "projectId", "totEnMet", "van", "verblijf", "vervoer", "vormingsuren" FROM "Activiteit";
DROP TABLE "Activiteit";
ALTER TABLE "new_Activiteit" RENAME TO "Activiteit";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Locatie_naam_key" ON "Locatie"("naam");
