/*
  Warnings:

  - A unique constraint covering the columns `[postcode,deelgemeente]` on the table `Plaats` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Plaats_postcode_key";

-- CreateIndex
CREATE UNIQUE INDEX "Plaats_postcode_deelgemeente_key" ON "Plaats"("postcode", "deelgemeente");
