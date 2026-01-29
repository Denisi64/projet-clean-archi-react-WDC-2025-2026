CREATE TYPE "DiscussionStatus" AS ENUM ('OPEN', 'ASSIGNED', 'CLOSED');
CREATE TYPE "MessageAuthorRole" AS ENUM ('CLIENT', 'ADVISOR');

ALTER TABLE "Discussion"
    ADD COLUMN "status" "DiscussionStatus" NOT NULL DEFAULT 'OPEN';

ALTER TABLE "Message"
    ADD COLUMN "authorRole" "MessageAuthorRole" NOT NULL DEFAULT 'CLIENT';
