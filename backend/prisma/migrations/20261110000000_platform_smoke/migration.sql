CREATE TABLE "smoke_results" (
    "job_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "smoke_results_pkey" PRIMARY KEY ("job_id")
);
