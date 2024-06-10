-- AlterTable
/*
    cursusMetOvernachting: 1,
    cursusZonderOvernachting: 2,
    inspraakproject: 3,
*/
ALTER TABLE "Project" ADD COLUMN "categorie" INTEGER;
UPDATE "Project" SET "categorie" = 2 WHERE "type" = 1 /*cursus*/ AND "id" IN (
  SELECT "projectId" FROM "Activiteit" WHERE "metOvernachting" = false
);
UPDATE "Project" SET "categorie" = 1 WHERE "type" = 1 /*cursus*/ AND "categorie" IS NULL; /* default cursusMetOvernachting 🤷‍♂️*/

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Activiteit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "van" DATETIME NOT NULL,
    "totEnMet" DATETIME NOT NULL,
    "vormingsuren" REAL,
    "begeleidingsuren" REAL,
    "locatieId" INTEGER,
    "verblijf" INTEGER,
    "vervoer" INTEGER,
    CONSTRAINT "Activiteit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Activiteit_locatieId_fkey" FOREIGN KEY ("locatieId") REFERENCES "Locatie" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Activiteit" ("begeleidingsuren", "id", "locatieId", "projectId", "totEnMet", "van", "verblijf", "vervoer", "vormingsuren") SELECT "begeleidingsuren", "id", "locatieId", "projectId", "totEnMet", "van", "verblijf", "vervoer", "vormingsuren" FROM "Activiteit";
DROP TABLE "Activiteit";
ALTER TABLE "new_Activiteit" RENAME TO "Activiteit";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
