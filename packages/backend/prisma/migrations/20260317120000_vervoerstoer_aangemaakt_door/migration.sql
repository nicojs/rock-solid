-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vervoerstoer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bestemmingId" INTEGER,
    "aangemaaktDoor" TEXT NOT NULL,
    CONSTRAINT "Vervoerstoer_bestemmingId_fkey" FOREIGN KEY ("bestemmingId") REFERENCES "Locatie" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Vervoerstoer" ("id", "bestemmingId", "aangemaaktDoor")
SELECT "id", "bestemmingId", '' FROM "Vervoerstoer";
DROP TABLE "Vervoerstoer";
ALTER TABLE "new_Vervoerstoer" RENAME TO "Vervoerstoer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
