-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Locatie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "naam" TEXT NOT NULL,
    "adresId" INTEGER,
    "opmerking" TEXT,
    "soort" INTEGER NOT NULL DEFAULT 0,
    "geschiktVoorVakantie" BOOLEAN,
    "persoonId" INTEGER,
    CONSTRAINT "Locatie_adresId_fkey" FOREIGN KEY ("adresId") REFERENCES "Adres" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Locatie_persoonId_fkey" FOREIGN KEY ("persoonId") REFERENCES "Persoon" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Locatie" ("adresId", "id", "naam", "opmerking") SELECT "adresId", "id", "naam", "opmerking" FROM "Locatie";
DROP TABLE "Locatie";
ALTER TABLE "new_Locatie" RENAME TO "Locatie";
CREATE UNIQUE INDEX "Locatie_naam_key" ON "Locatie"("naam");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
