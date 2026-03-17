-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Redefine Vervoerstoer: add bestemmingStopId
CREATE TABLE "new_Vervoerstoer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bestemmingStopId" INTEGER,
    "aangemaaktDoor" TEXT NOT NULL,
    CONSTRAINT "Vervoerstoer_bestemmingStopId_fkey" FOREIGN KEY ("bestemmingStopId") REFERENCES "VervoerstoerStop" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Vervoerstoer" ("aangemaaktDoor", "id", "bestemmingStopId")
SELECT v."aangemaaktDoor", v."id", s."id"
FROM "Vervoerstoer" v
LEFT JOIN "VervoerstoerStop" s ON s."vervoerstoerId" = v."id" AND s."isBestemming" = true;
DROP TABLE "Vervoerstoer";
ALTER TABLE "new_Vervoerstoer" RENAME TO "Vervoerstoer";
CREATE UNIQUE INDEX "Vervoerstoer_bestemmingStopId_key" ON "Vervoerstoer"("bestemmingStopId");

-- Redefine VervoerstoerStop: remove isBestemming
CREATE TABLE "new_VervoerstoerStop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "routeId" INTEGER,
    "vervoerstoerId" INTEGER,
    "locatieId" INTEGER NOT NULL,
    "volgnummer" INTEGER NOT NULL DEFAULT 0,
    "geplandeAankomst" DATETIME,
    CONSTRAINT "VervoerstoerStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "VervoerstoerRoute" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VervoerstoerStop_vervoerstoerId_fkey" FOREIGN KEY ("vervoerstoerId") REFERENCES "Vervoerstoer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VervoerstoerStop_locatieId_fkey" FOREIGN KEY ("locatieId") REFERENCES "Locatie" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_VervoerstoerStop" ("geplandeAankomst", "id", "locatieId", "routeId", "vervoerstoerId", "volgnummer")
SELECT "geplandeAankomst", "id", "locatieId", "routeId", "vervoerstoerId", "volgnummer" FROM "VervoerstoerStop";
DROP TABLE "VervoerstoerStop";
ALTER TABLE "new_VervoerstoerStop" RENAME TO "VervoerstoerStop";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
