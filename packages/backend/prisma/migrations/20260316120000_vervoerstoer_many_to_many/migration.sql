-- CreateTable
CREATE TABLE "_ProjectToVervoerstoer" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ProjectToVervoerstoer_A_fkey" FOREIGN KEY ("A") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ProjectToVervoerstoer_B_fkey" FOREIGN KEY ("B") REFERENCES "Vervoerstoer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate existing data
INSERT INTO "_ProjectToVervoerstoer" ("A", "B")
SELECT "id", "vervoerstoerId" FROM "Project" WHERE "vervoerstoerId" IS NOT NULL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectnummer" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "jaar" INTEGER NOT NULL,
    "saldo" DECIMAL,
    "organisatieonderdeel" INTEGER,
    "doelgroep" INTEGER,
    "categorie" INTEGER,
    "vakantiesoort" INTEGER,
    "bestemming" TEXT,
    "land" TEXT,
    "seizoen" INTEGER,
    "voorschot" DECIMAL
);
INSERT INTO "new_Project" ("bestemming", "categorie", "doelgroep", "id", "jaar", "land", "naam", "organisatieonderdeel", "projectnummer", "saldo", "seizoen", "titel", "type", "vakantiesoort", "voorschot") SELECT "bestemming", "categorie", "doelgroep", "id", "jaar", "land", "naam", "organisatieonderdeel", "projectnummer", "saldo", "seizoen", "titel", "type", "vakantiesoort", "voorschot" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_projectnummer_key" ON "Project"("projectnummer");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectToVervoerstoer_AB_unique" ON "_ProjectToVervoerstoer"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectToVervoerstoer_B_index" ON "_ProjectToVervoerstoer"("B");
