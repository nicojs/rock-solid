-- CreateTable
CREATE TABLE "Persoon" (
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
    CONSTRAINT "Persoon_verblijfadresId_fkey" FOREIGN KEY ("verblijfadresId") REFERENCES "Adres" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Persoon_domicilieadresId_fkey" FOREIGN KEY ("domicilieadresId") REFERENCES "Adres" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Persoon_eersteCursusAanmeldingId_fkey" FOREIGN KEY ("eersteCursusAanmeldingId") REFERENCES "Aanmelding" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Persoon_eersteVakantieAanmeldingId_fkey" FOREIGN KEY ("eersteVakantieAanmeldingId") REFERENCES "Aanmelding" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OverigPersoonSelectie" (
    "overigPersoonId" INTEGER NOT NULL,
    "selectie" INTEGER NOT NULL,

    PRIMARY KEY ("overigPersoonId", "selectie"),
    CONSTRAINT "OverigPersoonSelectie_overigPersoonId_fkey" FOREIGN KEY ("overigPersoonId") REFERENCES "Persoon" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Adres" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "straatnaam" TEXT NOT NULL,
    "huisnummer" TEXT NOT NULL,
    "busnummer" TEXT,
    "plaatsId" INTEGER NOT NULL,
    CONSTRAINT "Adres_plaatsId_fkey" FOREIGN KEY ("plaatsId") REFERENCES "Plaats" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Plaats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deelgemeente" TEXT NOT NULL,
    "gemeente" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "volledigeNaam" TEXT NOT NULL,
    "provincieId" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectnummer" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "jaar" INTEGER NOT NULL,
    "saldo" DECIMAL,
    "organisatieonderdeel" INTEGER,
    "bestemming" TEXT,
    "land" TEXT,
    "seizoen" INTEGER,
    "voorschot" DECIMAL
);

-- CreateTable
CREATE TABLE "Aanmelding" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "deelnemerId" INTEGER,
    "rekeninguittrekselNummer" TEXT,
    "tijdstipVanAanmelden" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" INTEGER NOT NULL DEFAULT 0,
    "bevestigingsbriefVerzondenOp" DATETIME,
    "vervoersbriefVerzondenOp" DATETIME,
    "plaatsId" INTEGER,
    "werksituatie" INTEGER,
    "woonsituatie" INTEGER,
    "geslacht" INTEGER,
    CONSTRAINT "Aanmelding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Aanmelding_deelnemerId_fkey" FOREIGN KEY ("deelnemerId") REFERENCES "Persoon" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Aanmelding_plaatsId_fkey" FOREIGN KEY ("plaatsId") REFERENCES "Plaats" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activiteit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "van" DATETIME NOT NULL,
    "totEnMet" DATETIME NOT NULL,
    "vormingsuren" REAL,
    "begeleidingsuren" REAL,
    "metOvernachting" BOOLEAN NOT NULL DEFAULT false,
    "verblijf" INTEGER,
    "vervoer" INTEGER,
    CONSTRAINT "Activiteit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Deelname" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "aanmeldingId" INTEGER NOT NULL,
    "activiteitId" INTEGER NOT NULL,
    "effectieveDeelnamePerunage" REAL NOT NULL,
    "opmerking" TEXT,
    CONSTRAINT "Deelname_aanmeldingId_fkey" FOREIGN KEY ("aanmeldingId") REFERENCES "Aanmelding" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Deelname_activiteitId_fkey" FOREIGN KEY ("activiteitId") REFERENCES "Activiteit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Organisatie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "naam" TEXT NOT NULL,
    "website" TEXT,
    "soortOpmerking" TEXT
);

-- CreateTable
CREATE TABLE "Organisatiesoort" (
    "organisatieId" INTEGER NOT NULL,
    "soort" INTEGER NOT NULL,

    PRIMARY KEY ("organisatieId", "soort"),
    CONSTRAINT "Organisatiesoort_organisatieId_fkey" FOREIGN KEY ("organisatieId") REFERENCES "Organisatie" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrganisatieContact" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organisatieId" INTEGER NOT NULL,
    "terAttentieVan" TEXT NOT NULL,
    "afdeling" TEXT,
    "emailadres" TEXT,
    "telefoonnummer" TEXT,
    "adresId" INTEGER,
    "opmerking" TEXT,
    CONSTRAINT "OrganisatieContact_adresId_fkey" FOREIGN KEY ("adresId") REFERENCES "Adres" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OrganisatieContact_organisatieId_fkey" FOREIGN KEY ("organisatieId") REFERENCES "Organisatie" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Foldervoorkeur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "communicatie" INTEGER NOT NULL,
    "folder" INTEGER NOT NULL,
    "organisatieContactId" INTEGER,
    "persoonId" INTEGER,
    CONSTRAINT "Foldervoorkeur_organisatieContactId_fkey" FOREIGN KEY ("organisatieContactId") REFERENCES "OrganisatieContact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Foldervoorkeur_persoonId_fkey" FOREIGN KEY ("persoonId") REFERENCES "Persoon" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PersoonToProject" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_PersoonToProject_A_fkey" FOREIGN KEY ("A") REFERENCES "Persoon" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PersoonToProject_B_fkey" FOREIGN KEY ("B") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Plaats_postcode_key" ON "Plaats"("postcode");

-- CreateIndex
CREATE INDEX "Plaats_deelgemeente_idx" ON "Plaats"("deelgemeente");

-- CreateIndex
CREATE INDEX "Plaats_gemeente_idx" ON "Plaats"("gemeente");

-- CreateIndex
CREATE INDEX "Plaats_provincieId_idx" ON "Plaats"("provincieId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectnummer_key" ON "Project"("projectnummer");

-- CreateIndex
CREATE UNIQUE INDEX "Aanmelding_projectId_deelnemerId_key" ON "Aanmelding"("projectId", "deelnemerId");

-- CreateIndex
CREATE UNIQUE INDEX "Deelname_aanmeldingId_activiteitId_key" ON "Deelname"("aanmeldingId", "activiteitId");

-- CreateIndex
CREATE UNIQUE INDEX "Organisatie_naam_key" ON "Organisatie"("naam");

-- CreateIndex
CREATE INDEX "Foldervoorkeur_folder_idx" ON "Foldervoorkeur"("folder");

-- CreateIndex
CREATE UNIQUE INDEX "Foldervoorkeur_folder_persoonId_key" ON "Foldervoorkeur"("folder", "persoonId");

-- CreateIndex
CREATE UNIQUE INDEX "Foldervoorkeur_folder_organisatieContactId_key" ON "Foldervoorkeur"("folder", "organisatieContactId");

-- CreateIndex
CREATE UNIQUE INDEX "_PersoonToProject_AB_unique" ON "_PersoonToProject"("A", "B");

-- CreateIndex
CREATE INDEX "_PersoonToProject_B_index" ON "_PersoonToProject"("B");
