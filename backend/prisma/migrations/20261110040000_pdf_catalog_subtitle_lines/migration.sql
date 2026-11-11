BEGIN;

-- AlterTable
ALTER TABLE "episodes" ADD COLUMN "channel_id" UUID,
ADD COLUMN "duration_ms" INTEGER,
ADD COLUMN "episode_number" INTEGER,
ADD COLUMN "series_id" UUID;

-- AlterTable
ALTER TABLE "subtitle_revisions" ALTER COLUMN "cues" SET DEFAULT '[]';

-- CreateTable
CREATE TABLE "channels" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'YouTube',
    "image_url" TEXT,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL DEFAULT 'ja',
    "level" TEXT,
    "genre" TEXT,
    "channel_id" UUID,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speakers" (
    "id" UUID NOT NULL,
    "episode_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "avatar_url" TEXT,

    CONSTRAINT "speakers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subtitle_cues" (
    "episode_id" UUID NOT NULL,
    "id" UUID NOT NULL,

    CONSTRAINT "subtitle_cues_pkey" PRIMARY KEY ("episode_id","id")
);

-- CreateTable
CREATE TABLE "subtitle_lines" (
    "revision_id" UUID NOT NULL,
    "episode_id" UUID NOT NULL,
    "cue_id" UUID NOT NULL,
    "speaker_id" UUID,
    "ordinal" INTEGER NOT NULL,
    "start_ms" INTEGER NOT NULL,
    "end_ms" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "translation_vi" TEXT NOT NULL,
    "tokens" JSONB,

    CONSTRAINT "subtitle_lines_pkey" PRIMARY KEY ("revision_id","cue_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "channels_name_key" ON "channels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "series_slug_key" ON "series"("slug");

-- CreateIndex
CREATE INDEX "series_channel_id_idx" ON "series"("channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "speakers_episode_id_id_key" ON "speakers"("episode_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "speakers_episode_id_name_key" ON "speakers"("episode_id", "name");

-- CreateIndex
CREATE INDEX "subtitle_lines_episode_id_start_ms_idx" ON "subtitle_lines"("episode_id", "start_ms");

-- CreateIndex
CREATE INDEX "subtitle_lines_episode_id_cue_id_idx" ON "subtitle_lines"("episode_id", "cue_id");

-- CreateIndex
CREATE UNIQUE INDEX "subtitle_lines_revision_id_ordinal_key" ON "subtitle_lines"("revision_id", "ordinal");

-- CreateIndex
CREATE INDEX "episodes_channel_id_idx" ON "episodes"("channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_series_id_episode_number_key" ON "episodes"("series_id", "episode_number");

-- CreateIndex
CREATE UNIQUE INDEX "subtitle_revisions_episode_id_id_key" ON "subtitle_revisions"("episode_id", "id");

-- AddForeignKey
ALTER TABLE "series" ADD CONSTRAINT "series_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speakers" ADD CONSTRAINT "speakers_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtitle_cues" ADD CONSTRAINT "subtitle_cues_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtitle_lines" ADD CONSTRAINT "subtitle_lines_episode_id_revision_id_fkey" FOREIGN KEY ("episode_id", "revision_id") REFERENCES "subtitle_revisions"("episode_id", "id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subtitle_lines" ADD CONSTRAINT "subtitle_lines_episode_id_cue_id_fkey" FOREIGN KEY ("episode_id", "cue_id") REFERENCES "subtitle_cues"("episode_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subtitle_lines" ADD CONSTRAINT "subtitle_lines_episode_id_speaker_id_fkey" FOREIGN KEY ("episode_id", "speaker_id") REFERENCES "speakers"("episode_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey


ALTER TABLE "episodes" ADD CONSTRAINT "episodes_number_check"
    CHECK ("episode_number" IS NULL OR ("series_id" IS NOT NULL AND "episode_number" > 0));
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_duration_check"
    CHECK ("duration_ms" IS NULL OR "duration_ms" BETWEEN 1 AND 86400000);
ALTER TABLE "subtitle_lines" ADD CONSTRAINT "subtitle_lines_timing_check"
    CHECK ("start_ms" >= 0 AND "end_ms" > "start_ms" AND "end_ms" <= 86400000);
ALTER TABLE "subtitle_lines" ADD CONSTRAINT "subtitle_lines_ordinal_check" CHECK ("ordinal" >= 0);

-- Import exact legacy labels. Unlabelled episodes remain standalone.
INSERT INTO "channels" ("id", "name")
SELECT gen_random_uuid(), name
FROM (SELECT DISTINCT NULLIF(btrim("channel_name"), '') AS name FROM "episodes") AS labels
WHERE name IS NOT NULL;

INSERT INTO "series" ("id", "slug", "title", "channel_id")
SELECT gen_random_uuid(), 'legacy-' || md5(jsonb_build_array(title, channel_name)::text), title, c.id
FROM (
    SELECT DISTINCT NULLIF(btrim("series_title"), '') AS title,
           NULLIF(btrim("channel_name"), '') AS channel_name
    FROM "episodes"
) AS labels
LEFT JOIN "channels" c ON c.name = labels.channel_name
WHERE title IS NOT NULL;

UPDATE "episodes" e SET "series_id" = s.id
FROM "series" s
WHERE s.slug = 'legacy-' || md5(jsonb_build_array(
    NULLIF(btrim(e."series_title"), ''), NULLIF(btrim(e."channel_name"), '')
)::text);

UPDATE "episodes" e SET "channel_id" = c.id
FROM "channels" c
WHERE e."series_id" IS NULL AND c.name = NULLIF(btrim(e."channel_name"), '');

-- Materialize legacy cues once. Invalid legacy data aborts the migration.
CREATE TEMP TABLE "legacy_subtitle_rows" ON COMMIT DROP AS
SELECT r.id AS revision_id, r.episode_id, (cue.value->>'id')::uuid AS cue_id,
       NULLIF(btrim(cue.value->>'speaker'), '') AS speaker_name,
       (cue.ordinality - 1)::integer AS ordinal,
       (cue.value->>'startMs')::integer AS start_ms, (cue.value->>'endMs')::integer AS end_ms,
       cue.value->>'text' AS text, COALESCE(cue.value->>'translation', '') AS translation_vi,
       NULLIF(cue.value->'ruby', 'null'::jsonb) AS tokens
FROM "subtitle_revisions" r
CROSS JOIN LATERAL jsonb_array_elements(r.cues) WITH ORDINALITY AS cue(value, ordinality);

INSERT INTO "speakers" ("id", "episode_id", "name")
SELECT gen_random_uuid(), episode_id, speaker_name
FROM (SELECT DISTINCT episode_id, speaker_name FROM "legacy_subtitle_rows") AS names
WHERE speaker_name IS NOT NULL;

-- Move the bookmark FK after stable identities are available.
INSERT INTO "subtitle_cues" ("episode_id", "id")
SELECT episode_id, cue_id FROM "legacy_subtitle_rows"
UNION
SELECT episode_id, cue_id FROM "bookmarks" WHERE cue_id IS NOT NULL;

INSERT INTO "subtitle_lines" (
    "revision_id", "episode_id", "cue_id", "speaker_id", "ordinal", "start_ms",
    "end_ms", "text", "translation_vi", "tokens"
)
SELECT legacy.revision_id, legacy.episode_id, legacy.cue_id, speaker.id, legacy.ordinal,
       legacy.start_ms, legacy.end_ms, legacy.text, legacy.translation_vi, legacy.tokens
FROM "legacy_subtitle_rows" legacy
LEFT JOIN "speakers" speaker
  ON speaker.episode_id = legacy.episode_id AND speaker.name = legacy.speaker_name;

ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_episode_id_cue_id_fkey" FOREIGN KEY ("episode_id", "cue_id") REFERENCES "subtitle_cues"("episode_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

COMMIT;
