-- AlterTable Vervoerstoer
ALTER TABLE "Vervoerstoer" ADD COLUMN "datum" DATETIME;
ALTER TABLE "Vervoerstoer" ADD COLUMN "datumTerug" DATETIME;

-- AlterTable VervoerstoerRoute
ALTER TABLE "VervoerstoerRoute" ADD COLUMN "vertrekTijdTerug" DATETIME;

-- AlterTable VervoerstoerStop
ALTER TABLE "VervoerstoerStop" ADD COLUMN "geplandeAankomstTerug" DATETIME;
