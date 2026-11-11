CREATE TYPE "NlpStatus" AS ENUM ('PENDING', 'READY', 'FAILED', 'SUPERSEDED');

CREATE TABLE "episodes" (
    "id" UUID NOT NULL,
    "youtube_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "draft_id" UUID,
    "published_id" UUID,
    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subtitle_revisions" (
    "id" UUID NOT NULL,
    "episode_id" UUID NOT NULL,
    "source_draft_id" UUID,
    "request_id" TEXT NOT NULL,
    "cues" JSONB NOT NULL,
    "nlp_status" "NlpStatus" NOT NULL DEFAULT 'PENDING',
    "next_dispatch_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subtitle_revisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "episodes_draft_id_key" ON "episodes"("draft_id");
CREATE UNIQUE INDEX "episodes_published_id_key" ON "episodes"("published_id");
CREATE INDEX "subtitle_revisions_nlp_status_next_dispatch_at_idx"
    ON "subtitle_revisions"("nlp_status", "next_dispatch_at");

ALTER TABLE "episodes" ADD CONSTRAINT "episodes_draft_id_fkey"
    FOREIGN KEY ("draft_id") REFERENCES "subtitle_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_published_id_fkey"
    FOREIGN KEY ("published_id") REFERENCES "subtitle_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "subtitle_revisions" ADD CONSTRAINT "subtitle_revisions_episode_id_fkey"
    FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
