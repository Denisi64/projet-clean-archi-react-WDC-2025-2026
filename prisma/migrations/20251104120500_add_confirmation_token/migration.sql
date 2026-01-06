-- Add confirmation token fields + adjust default activation flag
ALTER TABLE `User`
    ADD COLUMN `confirmationToken` VARCHAR(191) NULL,
    ADD COLUMN `confirmationTokenExpiresAt` DATETIME(3) NULL,
    MODIFY `isActive` BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX `User_confirmationToken_key` ON `User`(`confirmationToken`);
