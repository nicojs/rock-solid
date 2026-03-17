-- CreateTable
CREATE TABLE "_AanmeldingToVervoerstoerStop" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_AanmeldingToVervoerstoerStop_A_fkey" FOREIGN KEY ("A") REFERENCES "Aanmelding" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AanmeldingToVervoerstoerStop_B_fkey" FOREIGN KEY ("B") REFERENCES "VervoerstoerStop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate existing data
INSERT INTO "_AanmeldingToVervoerstoerStop" ("A", "B")
SELECT "id", "vervoerstoerStopId" FROM "Aanmelding" WHERE "vervoerstoerStopId" IS NOT NULL;

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
    CONSTRAINT "Aanmelding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Aanmelding_deelnemerId_fkey" FOREIGN KEY ("deelnemerId") REFERENCES "Persoon" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Aanmelding_opstapplaatsId_fkey" FOREIGN KEY ("opstapplaatsId") REFERENCES "Locatie" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Aanmelding_plaatsId_fkey" FOREIGN KEY ("plaatsId") REFERENCES "Plaats" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Aanmelding" ("bevestigingsbriefVerzondenOp", "deelnemerId", "geslacht", "id", "opmerking", "opstapplaatsId", "plaatsId", "projectId", "rekeninguittrekselNummer", "rekeninguittrekselNummerVoorschot", "status", "tijdstipVanAanmelden", "vervoersbriefVerzondenOp", "werksituatie", "woonsituatie") SELECT "bevestigingsbriefVerzondenOp", "deelnemerId", "geslacht", "id", "opmerking", "opstapplaatsId", "plaatsId", "projectId", "rekeninguittrekselNummer", "rekeninguittrekselNummerVoorschot", "status", "tijdstipVanAanmelden", "vervoersbriefVerzondenOp", "werksituatie", "woonsituatie" FROM "Aanmelding";
DROP TABLE "Aanmelding";
ALTER TABLE "new_Aanmelding" RENAME TO "Aanmelding";
CREATE UNIQUE INDEX "Aanmelding_projectId_deelnemerId_key" ON "Aanmelding"("projectId", "deelnemerId");
CREATE TABLE "new_Persoon" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "voornaam" TEXT,
    "achternaam" TEXT NOT NULL,
    "volledigeNaam" TEXT NOT NULL,
    "emailadres" TEXT,
    "verblijfadresId" INTEGER,
    "domicilieadresId" INTEGER,
    "geboortedatum" DATETIME,
    "geboorteplaats" TEXT,
    "geslacht" INTEGER,
    "geslachtOpmerking" TEXT,
    "rekeningnummer" TEXT,
    "rijksregisternummer" TEXT,
    "telefoonnummer" TEXT,
    "gsmNummer" TEXT,
    "opmerking" TEXT,
    "type" INTEGER NOT NULL,
    "woonsituatie" INTEGER,
    "woonsituatieOpmerking" TEXT,
    "werksituatie" INTEGER,
    "opleidingsvorm" INTEGER,
    "werksituatieOpmerking" TEXT,
    "voedingswens" INTEGER,
    "voedingswensOpmerking" TEXT,
    "emailadres2" TEXT,
    "begeleidendeDienst" TEXT,
    "contactpersoon" TEXT,
    "contactpersoonTelefoon" TEXT,
    "contactpersoonGsm" TEXT,
    "contactpersoonEmail" TEXT,
    "eersteCursusAanmeldingId" INTEGER,
    "eersteVakantieAanmeldingId" INTEGER,
    "toestemmingFotosFolder" BOOLEAN NOT NULL DEFAULT false,
    "toestemmingFotosWebsite" BOOLEAN NOT NULL DEFAULT false,
    "toestemmingFotosSocialeMedia" BOOLEAN NOT NULL DEFAULT false,
    "toestemmingFotosNieuwsbrief" BOOLEAN NOT NULL DEFAULT false,
    "toestemmingFotosInfoboekje" BOOLEAN NOT NULL DEFAULT false,
    "locatieId" INTEGER,
    CONSTRAINT "Persoon_verblijfadresId_fkey" FOREIGN KEY ("verblijfadresId") REFERENCES "Adres" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Persoon_domicilieadresId_fkey" FOREIGN KEY ("domicilieadresId") REFERENCES "Adres" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Persoon_eersteCursusAanmeldingId_fkey" FOREIGN KEY ("eersteCursusAanmeldingId") REFERENCES "Aanmelding" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Persoon_eersteVakantieAanmeldingId_fkey" FOREIGN KEY ("eersteVakantieAanmeldingId") REFERENCES "Aanmelding" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Persoon_locatieId_fkey" FOREIGN KEY ("locatieId") REFERENCES "Locatie" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Persoon" ("achternaam", "begeleidendeDienst", "contactpersoon", "contactpersoonEmail", "contactpersoonGsm", "contactpersoonTelefoon", "domicilieadresId", "eersteCursusAanmeldingId", "eersteVakantieAanmeldingId", "emailadres", "emailadres2", "geboortedatum", "geboorteplaats", "geslacht", "geslachtOpmerking", "gsmNummer", "id", "locatieId", "opleidingsvorm", "opmerking", "rekeningnummer", "rijksregisternummer", "telefoonnummer", "toestemmingFotosFolder", "toestemmingFotosInfoboekje", "toestemmingFotosNieuwsbrief", "toestemmingFotosSocialeMedia", "toestemmingFotosWebsite", "type", "verblijfadresId", "voedingswens", "voedingswensOpmerking", "volledigeNaam", "voornaam", "werksituatie", "werksituatieOpmerking", "woonsituatie", "woonsituatieOpmerking") SELECT "achternaam", "begeleidendeDienst", "contactpersoon", "contactpersoonEmail", "contactpersoonGsm", "contactpersoonTelefoon", "domicilieadresId", "eersteCursusAanmeldingId", "eersteVakantieAanmeldingId", "emailadres", "emailadres2", "geboortedatum", "geboorteplaats", "geslacht", "geslachtOpmerking", "gsmNummer", "id", "locatieId", "opleidingsvorm", "opmerking", "rekeningnummer", "rijksregisternummer", "telefoonnummer", "toestemmingFotosFolder", "toestemmingFotosInfoboekje", "toestemmingFotosNieuwsbrief", "toestemmingFotosSocialeMedia", "toestemmingFotosWebsite", "type", "verblijfadresId", "voedingswens", "voedingswensOpmerking", "volledigeNaam", "voornaam", "werksituatie", "werksituatieOpmerking", "woonsituatie", "woonsituatieOpmerking" FROM "Persoon";
DROP TABLE "Persoon";
ALTER TABLE "new_Persoon" RENAME TO "Persoon";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_AanmeldingToVervoerstoerStop_AB_unique" ON "_AanmeldingToVervoerstoerStop"("A", "B");

-- CreateIndex
CREATE INDEX "_AanmeldingToVervoerstoerStop_B_index" ON "_AanmeldingToVervoerstoerStop"("B");
