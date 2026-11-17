CREATE TABLE "dictionary_vietnamese" (
    "entry_id" TEXT NOT NULL,
    "meaning_vi" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    CONSTRAINT "dictionary_vietnamese_pkey" PRIMARY KEY ("entry_id"),
    CONSTRAINT "dictionary_vietnamese_entry_id_fkey"
        FOREIGN KEY ("entry_id") REFERENCES "dictionary_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
