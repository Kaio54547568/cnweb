ALTER TABLE "bookmarks"
    ADD COLUMN "source_episode_id" UUID,
    ADD COLUMN "source_cue_id" UUID;

ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_source_check" CHECK (
    ("source_episode_id" IS NULL AND "source_cue_id" IS NULL)
    OR ("source_episode_id" IS NOT NULL AND "source_cue_id" IS NOT NULL AND "entry_id" IS NOT NULL)
);

-- No foreign key: the source is resolved against the current publication when read,
-- so unpublishing or removing an episode only hides the source and never deletes the bookmark.
