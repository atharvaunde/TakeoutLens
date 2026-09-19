// Each entry migrates the database from version (index) to (index + 1).
export const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE files (
    id        INTEGER PRIMARY KEY,
    rel_path  TEXT NOT NULL UNIQUE,
    module    TEXT NOT NULL,
    size      INTEGER NOT NULL,
    mtime_ms  INTEGER NOT NULL
  );
  CREATE INDEX files_module ON files(module);

  CREATE TABLE modules (
    id          TEXT PRIMARY KEY,
    state       TEXT NOT NULL,
    file_count  INTEGER NOT NULL DEFAULT 0,
    total_bytes INTEGER NOT NULL DEFAULT 0,
    detail      TEXT,
    updated_at  INTEGER NOT NULL
  );

  CREATE TABLE index_errors (
    id          INTEGER PRIMARY KEY,
    module      TEXT NOT NULL,
    path        TEXT NOT NULL,
    reason      TEXT NOT NULL,
    occurred_at INTEGER NOT NULL
  );

  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL
  );
  `,
]
