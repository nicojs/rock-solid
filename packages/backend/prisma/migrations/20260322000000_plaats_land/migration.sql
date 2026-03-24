-- AlterTable
ALTER TABLE "Plaats" ADD COLUMN "land" TEXT NOT NULL DEFAULT 'België';

-- DropIndex
DROP INDEX "Plaats_postcode_deelgemeente_key";

-- CreateIndex
CREATE UNIQUE INDEX "Plaats_postcode_deelgemeente_land_key" ON "Plaats"("postcode", "deelgemeente", "land");
