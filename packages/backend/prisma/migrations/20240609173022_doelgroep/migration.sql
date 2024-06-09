-- AlterTable
ALTER TABLE "Project" ADD COLUMN "doelgroep" INTEGER;

-- Organisatieonderdeel
--    deKei: 1,
--    keiJongBuSO: 2,
--    keiJongNietBuSO: 3,

-- Doelgroep
--     BuSO: 1,
--     nietBuSO: 2,
--     BuSOEnNietBuSO: 3,

UPDATE "Project" SET "doelgroep" = 1 WHERE "organisatieonderdeel" = 2;
UPDATE "Project" SET "doelgroep" = 2 WHERE "organisatieonderdeel" = 3;
UPDATE "Project" SET "organisatieonderdeel" = 2 WHERE "organisatieonderdeel" = 3;
