# 0047 - Error Taxonomy and Messaging

## Status

Accepted

## Context

User errors, file errors, browser support errors, and internal bugs need
different recovery paths.

## Decision

Represent errors as recoverable or fatal. Recoverable errors preserve current
work and include `what`, `why`, and `nextStep`. Fatal errors must still offer a
safe reset path. Known categories are empty file, unsupported format, truncated
audio, decode failed, processing cancelled, processing failed, and export
failed.

## Consequences

- Error copy becomes testable.
- Users can act without opening devtools.

## Alternatives Considered

- Plain `Error.message` strings. Rejected because they collapse cause and
  recovery.
