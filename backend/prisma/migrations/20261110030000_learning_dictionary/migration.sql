ALTER TABLE "accounts" ALTER COLUMN "google_subject" DROP NOT NULL;

CREATE TABLE "dictionary_entries" (
    "id" TEXT NOT NULL,
    "headword" TEXT NOT NULL,
    "readings" TEXT[],
    "glosses" JSONB NOT NULL,
    CONSTRAINT "dictionary_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dictionary_terms" (
    "term" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    CONSTRAINT "dictionary_terms_pkey" PRIMARY KEY ("term","entry_id")
);

CREATE TABLE "bookmarks" (
    "account_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "episode_id" UUID,
    "cue_id" UUID,
    "entry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("account_id","key"),
    CONSTRAINT "bookmarks_reference_check" CHECK (
        ("episode_id" IS NOT NULL AND "cue_id" IS NOT NULL AND "entry_id" IS NULL)
        OR ("episode_id" IS NULL AND "cue_id" IS NULL AND "entry_id" IS NOT NULL)
    )
);

CREATE TABLE "checkpoints" (
    "account_id" UUID NOT NULL,
    "episode_id" UUID NOT NULL,
    "position_ms" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "checkpoints_pkey" PRIMARY KEY ("account_id","episode_id"),
    CONSTRAINT "checkpoints_position_check" CHECK ("position_ms" BETWEEN 0 AND 86400000)
);

CREATE INDEX "dictionary_terms_entry_id_idx" ON "dictionary_terms"("entry_id");
CREATE INDEX "bookmarks_account_id_created_at_idx" ON "bookmarks"("account_id", "created_at");
CREATE INDEX "checkpoints_account_id_updated_at_idx" ON "checkpoints"("account_id", "updated_at");

ALTER TABLE "dictionary_terms" ADD CONSTRAINT "dictionary_terms_entry_id_fkey"
    FOREIGN KEY ("entry_id") REFERENCES "dictionary_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_episode_id_fkey"
    FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_entry_id_fkey"
    FOREIGN KEY ("entry_id") REFERENCES "dictionary_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "checkpoints" ADD CONSTRAINT "checkpoints_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "checkpoints" ADD CONSTRAINT "checkpoints_episode_id_fkey"
    FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
