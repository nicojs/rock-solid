-- CreateTable
CREATE TABLE "_mogelijkeOpstapplaatsen" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_mogelijkeOpstapplaatsen_A_fkey" FOREIGN KEY ("A") REFERENCES "Locatie" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_mogelijkeOpstapplaatsen_B_fkey" FOREIGN KEY ("B") REFERENCES "Persoon" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Aanmelding" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "deelnemerId" INTEGER,
    "rekeninguittrekselNummer" TEXT,
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
INSERT INTO "new_Aanmelding" ("bevestigingsbriefVerzondenOp", "deelnemerId", "geslacht", "id", "opmerking", "plaatsId", "projectId", "rekeninguittrekselNummer", "status", "tijdstipVanAanmelden", "vervoersbriefVerzondenOp", "werksituatie", "woonsituatie") SELECT "bevestigingsbriefVerzondenOp", "deelnemerId", "geslacht", "id", "opmerking", "plaatsId", "projectId", "rekeninguittrekselNummer", "status", "tijdstipVanAanmelden", "vervoersbriefVerzondenOp", "werksituatie", "woonsituatie" FROM "Aanmelding";
DROP TABLE "Aanmelding";
ALTER TABLE "new_Aanmelding" RENAME TO "Aanmelding";
CREATE UNIQUE INDEX "Aanmelding_projectId_deelnemerId_key" ON "Aanmelding"("projectId", "deelnemerId");
CREATE TABLE "new_Locatie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "naam" TEXT NOT NULL,
    "adresId" INTEGER,
    "opmerking" TEXT,
    "soort" INTEGER NOT NULL DEFAULT 0,
    "geschiktVoorVakantie" BOOLEAN,
    CONSTRAINT "Locatie_adresId_fkey" FOREIGN KEY ("adresId") REFERENCES "Adres" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Locatie" ("adresId", "id", "naam", "opmerking") SELECT "adresId", "id", "naam", "opmerking" FROM "Locatie";
DROP TABLE "Locatie";
ALTER TABLE "new_Locatie" RENAME TO "Locatie";
CREATE UNIQUE INDEX "Locatie_naam_key" ON "Locatie"("naam");
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
INSERT INTO "new_Persoon" ("achternaam", "begeleidendeDienst", "contactpersoon", "contactpersoonEmail", "contactpersoonGsm", "contactpersoonTelefoon", "domicilieadresId", "eersteCursusAanmeldingId", "eersteVakantieAanmeldingId", "emailadres", "emailadres2", "geboortedatum", "geboorteplaats", "geslacht", "geslachtOpmerking", "gsmNummer", "id", "opleidingsvorm", "opmerking", "rekeningnummer", "rijksregisternummer", "telefoonnummer", "toestemmingFotosFolder", "toestemmingFotosInfoboekje", "toestemmingFotosNieuwsbrief", "toestemmingFotosSocialeMedia", "toestemmingFotosWebsite", "type", "verblijfadresId", "voedingswens", "voedingswensOpmerking", "volledigeNaam", "voornaam", "werksituatie", "werksituatieOpmerking", "woonsituatie", "woonsituatieOpmerking") SELECT "achternaam", "begeleidendeDienst", "contactpersoon", "contactpersoonEmail", "contactpersoonGsm", "contactpersoonTelefoon", "domicilieadresId", "eersteCursusAanmeldingId", "eersteVakantieAanmeldingId", "emailadres", "emailadres2", "geboortedatum", "geboorteplaats", "geslacht", "geslachtOpmerking", "gsmNummer", "id", "opleidingsvorm", "opmerking", "rekeningnummer", "rijksregisternummer", "telefoonnummer", "toestemmingFotosFolder", "toestemmingFotosInfoboekje", "toestemmingFotosNieuwsbrief", "toestemmingFotosSocialeMedia", "toestemmingFotosWebsite", "type", "verblijfadresId", "voedingswens", "voedingswensOpmerking", "volledigeNaam", "voornaam", "werksituatie", "werksituatieOpmerking", "woonsituatie", "woonsituatieOpmerking" FROM "Persoon";
DROP TABLE "Persoon";
ALTER TABLE "new_Persoon" RENAME TO "Persoon";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_mogelijkeOpstapplaatsen_AB_unique" ON "_mogelijkeOpstapplaatsen"("A", "B");

-- CreateIndex
CREATE INDEX "_mogelijkeOpstapplaatsen_B_index" ON "_mogelijkeOpstapplaatsen"("B");
