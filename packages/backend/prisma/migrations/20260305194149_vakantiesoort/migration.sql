-- AlterTable
ALTER TABLE "Project" ADD COLUMN "vakantiesoort" INTEGER;
UPDATE "Project" SET "vakantiesoort" = 1 WHERE "type" = 2; -- Vakantie
