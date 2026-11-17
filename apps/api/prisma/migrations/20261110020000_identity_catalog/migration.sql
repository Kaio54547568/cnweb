CREATE TYPE "AccountRole" AS ENUM ('LEARNER', 'EDITOR');
CREATE TYPE "EpisodeVisibility" AS ENUM ('SAMPLE', 'MEMBER');

ALTER TABLE "episodes"
    ADD COLUMN "channel_name" TEXT,
    ADD COLUMN "series_title" TEXT,
    ADD COLUMN "visibility" "EpisodeVisibility" NOT NULL DEFAULT 'MEMBER';

ALTER TABLE "subtitle_revisions" ADD COLUMN "author_id" UUID;

CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "google_subject" TEXT NOT NULL,
    "role" "AccountRole" NOT NULL DEFAULT 'LEARNER',
    "disabled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accounts_google_subject_key" ON "accounts"("google_subject");
ALTER TABLE "subtitle_revisions" ADD CONSTRAINT "subtitle_revisions_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
