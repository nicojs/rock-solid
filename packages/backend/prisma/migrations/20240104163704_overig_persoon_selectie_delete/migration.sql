-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OverigPersoonSelectie" (
    "overigPersoonId" INTEGER NOT NULL,
    "selectie" INTEGER NOT NULL,

    PRIMARY KEY ("overigPersoonId", "selectie"),
    CONSTRAINT "OverigPersoonSelectie_overigPersoonId_fkey" FOREIGN KEY ("overigPersoonId") REFERENCES "Persoon" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OverigPersoonSelectie" ("overigPersoonId", "selectie") SELECT "overigPersoonId", "selectie" FROM "OverigPersoonSelectie";
DROP TABLE "OverigPersoonSelectie";
ALTER TABLE "new_OverigPersoonSelectie" RENAME TO "OverigPersoonSelectie";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
