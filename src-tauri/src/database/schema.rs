// ChronoVault — Database Schema
// Definiert das SQLite-Schema und Migrationen.

use rusqlite::Connection;

/// Initialisiert alle Datenbank-Tabellen.
pub fn initialize(conn: &Connection) -> Result<(), rusqlite::Error> {
    // ── Dateien-Tabelle ──────────────────────────────────────────────────
    // Speichert Metadaten und KI-generierte Informationen zu jeder Datei.
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS files (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            path        TEXT NOT NULL UNIQUE,
            name        TEXT NOT NULL,
            extension   TEXT NOT NULL DEFAULT '',
            size        INTEGER NOT NULL DEFAULT 0,
            is_dir      INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT NOT NULL,
            modified_at TEXT NOT NULL,
            indexed_at  TEXT NOT NULL DEFAULT (datetime('now')),
            category    TEXT NOT NULL DEFAULT 'other',
            -- TODO Phase 2: KI-generierte Felder
            ai_summary  TEXT,
            ai_category TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
        CREATE INDEX IF NOT EXISTS idx_files_modified ON files(modified_at);
        CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
        ",
    )?;

    // ── Tags-Tabelle ─────────────────────────────────────────────────────
    // Manuelle und KI-generierte Tags für Dateien.
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS tags (
            id   INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS file_tags (
            file_id INTEGER NOT NULL REFERENCES files(id) ON DELETE CASCADE,
            tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
            source  TEXT NOT NULL DEFAULT 'manual',  -- 'manual' oder 'ai'
            PRIMARY KEY (file_id, tag_id)
        );
        ",
    )?;

    // ── Regeln-Tabelle ───────────────────────────────────────────────────
    // TODO Phase 3: Benutzerdefinierte Auto-Organisationsregeln.
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS rules (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            condition   TEXT NOT NULL,  -- JSON: {\"field\": \"extension\", \"op\": \"eq\", \"value\": \"png\"}
            action      TEXT NOT NULL,  -- JSON: {\"type\": \"move\", \"target\": \"/Screenshots\"}
            enabled     INTEGER NOT NULL DEFAULT 1,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );
        ",
    )?;

    // ── Gamification-Tabelle ─────────────────────────────────────────────
    // TODO Phase 3: Fortschritts- und Achievement-System.
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS user_progress (
            id          INTEGER PRIMARY KEY CHECK (id = 1),  -- Singleton
            xp          INTEGER NOT NULL DEFAULT 0,
            level       INTEGER NOT NULL DEFAULT 1,
            streak_days INTEGER NOT NULL DEFAULT 0,
            total_files_analyzed INTEGER NOT NULL DEFAULT 0,
            total_ai_actions     INTEGER NOT NULL DEFAULT 0,
            last_active TEXT
        );

        CREATE TABLE IF NOT EXISTS achievements (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            description TEXT NOT NULL,
            xp_reward   INTEGER NOT NULL DEFAULT 0,
            unlocked_at TEXT
        );

        -- Initialer User-Progress Eintrag
        INSERT OR IGNORE INTO user_progress (id, xp, level) VALUES (1, 0, 1);

        -- Standard Achievements
        INSERT OR IGNORE INTO achievements (id, name, description, xp_reward) 
        VALUES ('first_scan', 'Erster Scan', 'Deine ersten Dateien wurden erfasst.', 500);
        INSERT OR IGNORE INTO achievements (id, name, description, xp_reward) 
        VALUES ('ai_pro', 'KI-Pionier', 'Lasse die KI 5 Dateien zusammenfassen.', 1000);
        INSERT OR IGNORE INTO achievements (id, name, description, xp_reward) 
        VALUES ('organizer', 'Ordnungs-Experte', 'Lege 10 verschiedene Dateikategorien an.', 1500);
        ",
    )?;

    // ── Embeddings-Tabelle (sqlite-vec) ───────────────────────────────────
    // Nutzt die vec0 virtuelle Tabelle für Vektorsuche. nomic-embed-text = 768 dimensionen (gemma=3072, aber nomic_embed_text is standard). 
    // Wait, ollama nomic-embed-text is 768 dimensions.
    conn.execute_batch(
        "
        CREATE VIRTUAL TABLE IF NOT EXISTS vec_embeddings USING vec0(
            file_id INTEGER PRIMARY KEY,
            embedding float[768]
        );
        ",
    )?;

    // ── Konfiguration ────────────────────────────────────────────────────
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS config (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS watched_directories (
            path TEXT PRIMARY KEY
        );

        -- Standard-Konfiguration
        INSERT OR IGNORE INTO config (key, value) 
        VALUES ('ollama_url', 'http://localhost:11434');
        INSERT OR IGNORE INTO config (key, value) 
        VALUES ('ollama_model', 'gemma');
        INSERT OR IGNORE INTO config (key, value) 
        VALUES ('embedding_model', 'nomic-embed-text');
        ",
    )?;

    log::info!("Datenbank-Schema erfolgreich initialisiert");
    Ok(())
}
