/*
  Warnings:

  - You are about to drop the column `imagekitThumbnailId` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailUrl` on the `File` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "File_imagekitThumbnailId_key";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "imagekitThumbnailId",
DROP COLUMN "thumbnailUrl";
