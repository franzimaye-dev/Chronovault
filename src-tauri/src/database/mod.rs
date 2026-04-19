// ChronoVault — Database Module
// SQLite database for file metadata, tags, and configuration.

pub mod schema;

use rusqlite::Connection;
use std::path::Path;

/// The central Database instance for ChronoVault.
pub struct Database {
    pub conn: Connection,
}

impl Database {
    /// Creates a new database instance and initializes the schema.
    pub fn new(db_path: &Path) -> Result<Self, rusqlite::Error> {
        // Load the sqlite-vec extension globally before opening the DB
        unsafe {
            rusqlite::ffi::sqlite3_auto_extension(Some(std::mem::transmute(
                sqlite_vec::sqlite3_vec_init as *const (),
            )));
        }

        let conn = Connection::open(db_path)?;

        // Enable WAL mode for better performance during concurrent read/write operations
        conn.execute_batch("PRAGMA journal_mode=WAL;")?;
        conn.execute_batch("PRAGMA foreign_keys=ON;")?;

        // Initialize table schemas
        schema::initialize(&conn)?;

        log::info!("Database initialized at: {}", db_path.display());

        Ok(Database { conn })
    }
}
