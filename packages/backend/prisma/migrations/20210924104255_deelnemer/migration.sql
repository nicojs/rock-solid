-- CreateEnum
CREATE TYPE "woonsituatie" AS ENUM ('onbekend', 'thuis', 'residentieel');

-- CreateEnum
CREATE TYPE "werksituatie" AS ENUM ('onbekend', 'dagcentrum', 'begeleidwerkOfVrijwilligerswerk', 'maatwerkbedrijf', 'reguliereArbeidscircuit', 'werkzoekend');

-- CreateEnum
CREATE TYPE "voedingswens" AS ENUM ('geen', 'vegetarisch');

-- CreateTable
CREATE TABLE "deelnemer" (
    "id" INTEGER NOT NULL,
    "woonsituatie" "woonsituatie" NOT NULL DEFAULT E'onbekend',
    "woonsituatieOpmerking" TEXT,
    "werksituatie" "werksituatie" NOT NULL DEFAULT E'onbekend',
    "werksituatieOpmerking" TEXT,
    "voedingswens" "voedingswens" NOT NULL DEFAULT E'geen',
    "voedingswensOpmerking" TEXT,

    CONSTRAINT "deelnemer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "deelnemer" ADD CONSTRAINT "deelnemer_id_fkey" FOREIGN KEY ("id") REFERENCES "persoon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
