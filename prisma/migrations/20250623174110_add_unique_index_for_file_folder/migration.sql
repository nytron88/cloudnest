/*
  Warnings:

  - A unique constraint covering the columns `[userId,path]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,path]` on the table `Folder` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "File_userId_path_key" ON "File"("userId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_userId_path_key" ON "Folder"("userId", "path");
