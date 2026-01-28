-- Add confirmation token fields + adjust default activation flag
ALTER TABLE "User"
    ALTER COLUMN "isActive" SET DEFAULT false,
    ADD COLUMN     "confirmationToken" TEXT,
    ADD COLUMN     "confirmationTokenExpiresAt" TIMESTAMP(3);

-- Ensure unique tokens (NULL allowed)
CREATE UNIQUE INDEX "User_confirmationToken_key" ON "User"("confirmationToken");
