# Data Pipeline Hardening

General reliability/safety patterns for any heavy ETL or document-processing
pipeline (PDF/Excel/CSV ingestion, event-driven data pipelines, batch jobs),
independent of the specific file format involved. Pair this with
`pdf-processing` / `spreadsheet-etl` for format-specific guidance, and
`security-and-hardening` for input-validation fundamentals.

## Core principles

1. **Validate at the boundary, trust nothing downstream.** The moment
   external data (uploaded file, webhook payload, API response) enters the
   pipeline, parse it into a strictly-typed, schema-validated shape (`zod`
   or equivalent). Every step after that boundary can assume valid data.
2. **Idempotency by design.** Every write (DB insert, queue publish, file
   write) should be safe to retry. Derive a stable idempotency key from the
   source data (content hash, natural key, source-row offset) rather than
   relying on "this only runs once."
3. **Explicit failure handling, not silent skips.** A row/record that fails
   validation or processing should be quarantined with a reason, counted,
   and reported — never silently dropped. End every batch job with a summary:
   `{ processed, quarantined, failed, durationMs }`.
4. **Backpressure over unbounded buffering.** Stream + batch (see
   `spreadsheet-etl`) instead of loading entire datasets into memory. If a
   downstream system is slow, the pipeline should slow its intake, not queue
   unboundedly and OOM.
5. **Observability from the start.** Emit structured logs/metrics per stage
   (records-in, records-out, error-count, duration) — a pipeline that fails
   silently at 2am with no signal is worse than one that fails loudly at the
   first bad record.
6. **Dead-letter everything you can't process.** Route unprocessable
   records (schema mismatch, downstream 5xx after retries) to a dead-letter
   store/queue with the original payload + failure reason, so they can be
   replayed later without re-running the whole job.

## Retry & replay
- Use exponential backoff with jitter for transient failures (network,
  rate limits); fail fast (no retry) for validation errors — retrying bad
  data just wastes time and can mask the real bug.
- Cap retry attempts and route to dead-letter after the cap — infinite retry
  loops are a common cause of silent pipeline stalls.
- Design replay to be safe: replaying a dead-lettered batch should produce
  the same result as if it had succeeded the first time (idempotency key
  from principle 2 is what makes this safe).

## Testing heavy ETL logic
- Unit test the **transform** logic against fixtures for: a clean/typical
  record, a record missing optional fields, a record with a validation
  error, and a record at each documented format gotcha (e.g. Excel serial
  date, inconsistent CSV column count).
- Test **idempotency** explicitly: running the same batch twice should not
  double-write / double-count.
- Test **partial failure**: a batch with one bad record among many good ones
  should process the good ones and quarantine only the bad one.

## Anti-patterns to avoid
| Anti-pattern | Why it's a problem |
| --- | --- |
| Loading an entire large file into memory before processing | OOMs at scale; no backpressure |
| Catching all errors and continuing silently | Data loss goes unnoticed until someone asks "where did row 40,231 go?" |
| No idempotency key on writes | Retries create duplicates |
| Logging only on failure, not on success | No way to confirm the pipeline is healthy day-to-day |
| One giant transaction for the whole batch | A single bad record rolls back everything already processed |
