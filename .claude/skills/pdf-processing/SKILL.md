---
name: pdf-processing
description: Extracts, generates, and validates PDF documents inside agentic pipelines — text/table extraction, form filling, and PDF generation. Use when an agent needs to read data out of PDFs or produce PDF reports/output.
---

# PDF Processing

Reference for extracting, generating, and validating PDF documents inside
agentic pipelines (e.g. an agent that reads uploaded PDFs, extracts
structured data, and hands it to a downstream ETL or LLM step).

## When to use
- An agent/pipeline step needs to **extract text/tables** from PDFs (invoices,
  statements, reports) for downstream processing.
- An agent/pipeline step needs to **generate** a PDF (report, remediation
  summary, generated document) as output.
- Validating that a PDF is well-formed / not corrupted before processing.

## Recommended libraries (Node/TypeScript)
- **Text/metadata extraction:** `pdf-parse` (simple, good for plain text) or
  `pdfjs-dist` (Mozilla's PDF.js — more control, handles complex layouts).
- **Table extraction:** PDFs rarely have real tabular structure — prefer
  extracting text with positional coordinates (`pdfjs-dist` gives `x`/`y`
  per text item) and reconstructing rows/columns by Y-coordinate clustering,
  rather than naive line-splitting.
- **Generation:** `pdf-lib` (pure JS, no native deps, good for filling
  forms/adding pages to existing PDFs) or `@react-pdf/renderer` (React-style
  declarative PDF generation for reports).

## Patterns
- **Always validate before parsing.** Check the file's magic bytes
  (`%PDF-`) and a reasonable size ceiling before handing it to a parser —
  malformed or oversized files should fail fast with a clear error, not hang
  the pipeline.
- **Stream large PDFs where possible.** Don't load an entire multi-hundred-page
  PDF into memory if only the first N pages are needed — most parsers
  support page-range extraction.
- **Treat extracted text as untrusted input.** If extracted text is passed to
  an LLM prompt or used to build a filename/path, sanitize it the same way
  you would any external user input (see `security-and-hardening` skill).
- **Idempotency:** when a pipeline re-processes the same PDF (retry, replay),
  derive a stable ID (e.g. content hash) so downstream steps can dedupe.

## Gotchas
- Scanned/image-only PDFs have no extractable text — detect this (near-empty
  text extraction result) and route to an OCR step (e.g. Tesseract) rather
  than silently returning an empty result.
- Password-protected PDFs will throw on open — surface a clear,
  actionable error rather than an opaque parser exception.
- Font-embedding issues can cause garbled/incorrect character extraction in
  older or poorly-generated PDFs — validate extracted text isn't
  mojibake/garbage before trusting it downstream (e.g. a ratio-of-printable-
  characters check).
