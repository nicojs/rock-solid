-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "gewensteOpstapplaatsId" INTEGER,
    CONSTRAINT "Persoon_verblijfadresId_fkey" FOREIGN KEY ("verblijfadresId") REFERENCES "Adres" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Persoon_domicilieadresId_fkey" FOREIGN KEY ("domicilieadresId") REFERENCES "Adres" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Persoon_eersteCursusAanmeldingId_fkey" FOREIGN KEY ("eersteCursusAanmeldingId") REFERENCES "Aanmelding" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Persoon_eersteVakantieAanmeldingId_fkey" FOREIGN KEY ("eersteVakantieAanmeldingId") REFERENCES "Aanmelding" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Persoon_gewensteOpstapplaatsId_fkey" FOREIGN KEY ("gewensteOpstapplaatsId") REFERENCES "Locatie" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Persoon" ("achternaam", "begeleidendeDienst", "contactpersoon", "contactpersoonEmail", "contactpersoonGsm", "contactpersoonTelefoon", "domicilieadresId", "eersteCursusAanmeldingId", "eersteVakantieAanmeldingId", "emailadres", "emailadres2", "geboortedatum", "geboorteplaats", "geslacht", "geslachtOpmerking", "gsmNummer", "id", "opleidingsvorm", "opmerking", "rekeningnummer", "rijksregisternummer", "telefoonnummer", "toestemmingFotosFolder", "toestemmingFotosInfoboekje", "toestemmingFotosNieuwsbrief", "toestemmingFotosSocialeMedia", "toestemmingFotosWebsite", "type", "verblijfadresId", "voedingswens", "voedingswensOpmerking", "volledigeNaam", "voornaam", "werksituatie", "werksituatieOpmerking", "woonsituatie", "woonsituatieOpmerking") SELECT "achternaam", "begeleidendeDienst", "contactpersoon", "contactpersoonEmail", "contactpersoonGsm", "contactpersoonTelefoon", "domicilieadresId", "eersteCursusAanmeldingId", "eersteVakantieAanmeldingId", "emailadres", "emailadres2", "geboortedatum", "geboorteplaats", "geslacht", "geslachtOpmerking", "gsmNummer", "id", "opleidingsvorm", "opmerking", "rekeningnummer", "rijksregisternummer", "telefoonnummer", "toestemmingFotosFolder", "toestemmingFotosInfoboekje", "toestemmingFotosNieuwsbrief", "toestemmingFotosSocialeMedia", "toestemmingFotosWebsite", "type", "verblijfadresId", "voedingswens", "voedingswensOpmerking", "volledigeNaam", "voornaam", "werksituatie", "werksituatieOpmerking", "woonsituatie", "woonsituatieOpmerking" FROM "Persoon";
DROP TABLE "Persoon";
ALTER TABLE "new_Persoon" RENAME TO "Persoon";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
