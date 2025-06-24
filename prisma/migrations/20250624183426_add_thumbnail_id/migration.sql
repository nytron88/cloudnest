/*
  Warnings:

  - A unique constraint covering the columns `[imagekitThumbnailId]` on the table `File` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "imagekitThumbnailId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "File_imagekitThumbnailId_key" ON "File"("imagekitThumbnailId");
