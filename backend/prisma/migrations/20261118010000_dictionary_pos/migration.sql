ALTER TABLE "dictionary_entries"
    ADD COLUMN "parts_of_speech" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "jlpt_level" "JlptLevel";
