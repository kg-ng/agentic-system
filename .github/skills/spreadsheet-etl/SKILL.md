---
name: spreadsheet-etl
description: Reads, transforms, and writes Excel/CSV data at any scale — streaming, batching, schema validation, and reconciliation patterns. Use when an agent ingests spreadsheet/CSV data or needs to generate Excel/CSV exports.
---

# Spreadsheet & CSV ETL

Reference for reading, transforming, and writing Excel/CSV data inside
agentic pipelines — covers both small ad-hoc files and heavy, high-volume
ETL jobs.

## When to use
- An agent/pipeline step ingests Excel (`.xlsx`) or CSV data (uploaded
  files, exports from another system) and needs to transform/validate it.
- Generating an Excel/CSV export as pipeline output (reports, remediation
  summaries, reconciliation results).
- Reconciling/diffing two datasets (e.g. "what changed between yesterday's
  and today's export").

## Recommended libraries (Node/TypeScript)
- **Excel (read/write):** `exceljs` (streaming reader/writer, formulas,
  styling) — prefer over `xlsx`/SheetJS for anything beyond trivial reads due
  to more predictable memory behavior on large files.
- **CSV (read/write):** `csv-parse` / `csv-stringify` (streaming, RFC 4180
  compliant) or `papaparse` if also needed client-side.
- **Schema validation:** `zod` — define a row schema once and validate every
  parsed row against it; reject/quarantine rows that don't conform instead of
  silently propagating bad data downstream.

## Patterns for heavy ETL
- **Stream, don't load whole-file.** For files above a few thousand rows,
  use streaming readers (`exceljs`'s `WorkbookReader`, `csv-parse`'s stream
  API) so memory usage stays flat regardless of file size.
- **Process in batches.** Accumulate rows into fixed-size batches (e.g. 500–
  1,000) before writing to a database/queue, rather than one row at a time
  (too slow) or the whole file at once (too much memory / no backpressure).
- **Validate at the boundary.** Parse raw cells into typed values (dates,
  numbers, enums) and validate with a schema (`zod`) as the very first step
  — don't let untyped `string | number | Date | null` cell values leak into
  business logic.
- **Make it idempotent and resumable.** Heavy ETL jobs fail partway through
  (network blip, OOM, bad row). Track progress (e.g. last successfully
  processed row/batch offset) so a retry doesn't reprocess or duplicate
  already-committed data. Use an idempotency key (e.g. source file hash +
  row number) for any downstream writes.
- **Quarantine, don't crash.** A single malformed row should not fail the
  entire job — collect validation failures into a rejects report/dead-letter
  output and continue processing the rest, then surface a summary
  (`N processed, M quarantined`) at the end.
- **Normalize before comparing.** When reconciling two datasets, normalize
  whitespace/casing/date formats *before* diffing — spreadsheet exports are
  notoriously inconsistent about formatting.

## Gotchas
- Excel dates are stored as serial numbers (days since 1900) — always
  convert through the library's date-parsing helpers rather than assuming a
  cell is already a `Date`/ISO string.
- Merged cells, hidden rows/columns, and multiple sheets are common sources
  of silent data loss — explicitly decide (and document) which sheet(s) and
  which rows are in scope, don't just read "sheet 1, all rows."
- Locale differences (decimal separator, date format, thousands separator)
  can silently corrupt numeric parsing — validate parsed numeric ranges
  (e.g. reject an amount that parses to an implausible magnitude) rather
  than trusting the parse succeeded.
- CSV files with inconsistent column counts per row (common in hand-edited
  exports) should be flagged, not silently padded/truncated.
