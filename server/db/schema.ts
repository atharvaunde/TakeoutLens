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
  `
  CREATE TABLE index_runs (
    id          INTEGER PRIMARY KEY,
    started_at  INTEGER NOT NULL,
    finished_at INTEGER NOT NULL,
    total_files INTEGER NOT NULL,
    added       INTEGER NOT NULL,
    updated     INTEGER NOT NULL,
    removed     INTEGER NOT NULL,
    errors      INTEGER NOT NULL
  );
  `,
  `
  CREATE VIRTUAL TABLE drive_fts USING fts5(name, path, tokenize = 'unicode61 remove_diacritics 2');
  `,
  `
  CREATE TABLE chat_conversations (
    id            INTEGER PRIMARY KEY,
    folder        TEXT NOT NULL UNIQUE,
    kind          TEXT NOT NULL,
    title         TEXT NOT NULL,
    member_count  INTEGER NOT NULL,
    message_count INTEGER NOT NULL,
    first_at      INTEGER,
    last_at       INTEGER,
    source_size   INTEGER NOT NULL,
    source_mtime  INTEGER NOT NULL
  );
  CREATE INDEX chat_conversations_last ON chat_conversations(last_at);

  CREATE TABLE chat_messages (
    id            INTEGER PRIMARY KEY,
    conv_id       INTEGER NOT NULL,
    seq           INTEGER NOT NULL,
    ts            INTEGER NOT NULL,
    creator_name  TEXT NOT NULL,
    creator_email TEXT NOT NULL,
    is_bot        INTEGER NOT NULL,
    text          TEXT NOT NULL,
    attachments   TEXT,
    reactions     TEXT,
    quoted        TEXT,
    links         TEXT,
    UNIQUE (conv_id, seq)
  );
  CREATE VIRTUAL TABLE chat_fts USING fts5(text, creator, tokenize = 'unicode61 remove_diacritics 2');
  `,
]
