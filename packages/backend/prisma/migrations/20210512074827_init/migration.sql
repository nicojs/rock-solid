-- CreateEnum
CREATE TYPE "geslacht" AS ENUM ('onbekend', 'man', 'vrouw');

-- CreateEnum
CREATE TYPE "communicatievoorkeur" AS ENUM ('post', 'email');

-- CreateTable
CREATE TABLE "persoon" (
    "id" SERIAL NOT NULL,
    "voornaam" VARCHAR(255),
    "achternaam" VARCHAR(255) NOT NULL,
    "emailadres" VARCHAR(255),
    "geboortedatum" TIMESTAMP(3),
    "geboorteplaats" VARCHAR(255),
    "geslacht" "geslacht" NOT NULL DEFAULT E'onbekend',
    "rekeningnummer" VARCHAR(255),
    "rijksregisternummer" VARCHAR(255),
    "telefoonnummer" VARCHAR(255),
    "gsmNummer" VARCHAR(255),
    "communicatievoorkeur" "communicatievoorkeur" NOT NULL DEFAULT E'post',

    PRIMARY KEY ("id")
);
