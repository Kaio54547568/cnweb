CREATE TYPE "JlptLevel" AS ENUM ('N5', 'N4', 'N3', 'N2', 'N1');

ALTER TABLE "accounts"
    ADD COLUMN "display_name" TEXT,
    ADD COLUMN "jlpt_level" "JlptLevel",
    ADD COLUMN "learning_language" TEXT NOT NULL DEFAULT 'ja';
