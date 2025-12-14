/*
  Warnings:

  - Added the required column `initialPrincipal` to the `Credit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insuranceRate` to the `Credit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monthlyInsurance` to the `Credit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remainingPrincipal` to the `Credit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remainingTermMonths` to the `Credit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Credit" ADD COLUMN     "initialPrincipal" DECIMAL(19,4) NOT NULL,
ADD COLUMN     "insuranceRate" DECIMAL(9,6) NOT NULL,
ADD COLUMN     "monthlyInsurance" DECIMAL(19,4) NOT NULL,
ADD COLUMN     "remainingPrincipal" DECIMAL(19,4) NOT NULL,
ADD COLUMN     "remainingTermMonths" INTEGER NOT NULL;
