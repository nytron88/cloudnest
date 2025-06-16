/*
  Warnings:

  - You are about to drop the column `status` on the `Subscription` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Subscription_status_idx";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "status";

-- DropEnum
DROP TYPE "SubscriptionStatus";
