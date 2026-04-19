// ChronoVault — File Commands
// Tauri Commands für Datei-Operationen, Timeline-Daten und einfache Suche.

use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use crate::AppState;

// ─── Datentypen ───────────────────────────────────────────────────────────────

/// Metadaten einer einzelnen Datei
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub extension: String,
    pub size: u64,
    pub is_dir: bool,
    pub created_at: String,   // ISO 8601
    pub modified_at: String,  // ISO 8601
    pub category: String,     // z.B. "document", "image", "video", etc.
    pub relevance: Option<f32>,
    // TODO Phase 2: pub tags: Vec<String>,
    // TODO Phase 2: pub ai_summary: Option<String>,
}

/// Cluster von Dateien für die Timeline (z.B. "Heute", "Gestern")
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineCluster {
    pub label: String,        // z.B. "Heute", "Gestern", "Letzte Woche"
    pub date: String,         // ISO 8601 Datum
    pub files: Vec<FileEntry>,
}

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

/// Bestimmt die Kategorie einer Datei anhand ihrer Erweiterung.
/// TODO Phase 2: Wird durch KI-basierte Kategorisierung (Ollama) ergänzt.
fn categorize_by_extension(ext: &str) -> String {
    match ext.to_lowercase().as_str() {
        "pdf" | "doc" | "docx" | "txt" | "rtf" | "odt" | "md" | "tex" => "document".to_string(),
        "jpg" | "jpeg" | "png" | "gif" | "bmp" | "svg" | "webp" | "ico" | "tiff" => "image".to_string(),
        "mp4" | "avi" | "mkv" | "mov" | "wmv" | "flv" | "webm" => "video".to_string(),
        "mp3" | "wav" | "flac" | "ogg" | "aac" | "wma" | "m4a" => "audio".to_string(),
        "zip" | "rar" | "7z" | "tar" | "gz" | "bz2" => "archive".to_string(),
        "exe" | "msi" | "bat" | "cmd" | "ps1" | "sh" => "executable".to_string(),
        "rs" | "js" | "ts" | "py" | "java" | "cpp" | "c" | "go" | "rb" | "php"
        | "html" | "css" | "json" | "xml" | "yaml" | "yml" | "toml" => "code".to_string(),
        "xls" | "xlsx" | "csv" | "ods" => "spreadsheet".to_string(),
        "ppt" | "pptx" | "odp" => "presentation".to_string(),
        "lnk" => "shortcut".to_string(),
        _ => "other".to_string(),
    }
}

/// Liest die Metadaten einer Datei vom Dateisystem.
pub fn read_file_entry(path: &std::path::Path) -> Option<FileEntry> {
    let metadata = std::fs::metadata(path).ok()?;
    let name = path.file_name()?.to_string_lossy().to_string();
    let extension = path
        .extension()
        .map(|e| e.to_string_lossy().to_string())
        .unwrap_or_default();

    let created_at = metadata
        .created()
        .ok()
        .and_then(|t| {
            let dt: DateTime<Local> = t.into();
            Some(dt.to_rfc3339())
        })
        .unwrap_or_default();

    let modified_at = metadata
        .modified()
        .ok()
        .and_then(|t| {
            let dt: DateTime<Local> = t.into();
            Some(dt.to_rfc3339())
        })
        .unwrap_or_default();

    Some(FileEntry {
        name,
        path: path.to_string_lossy().to_string(),
        extension: extension.clone(),
        size: metadata.len(),
        is_dir: metadata.is_dir(),
        created_at,
        modified_at,
        category: if metadata.is_dir() {
            "folder".to_string()
        } else {
            categorize_by_extension(&extension)
        },
        relevance: None,
    })
}

/// Erstellt ein Timeline-Label basierend auf dem Datum.
fn date_to_timeline_label(date_str: &str) -> String {
    let now = Local::now().date_naive();

    if let Ok(dt) = DateTime::parse_from_rfc3339(date_str) {
        let file_date = dt.with_timezone(&Local).date_naive();
        let diff = now.signed_duration_since(file_date).num_days();

        match diff {
            0 => "Heute".to_string(),
            1 => "Gestern".to_string(),
            2..=6 => format!("Vor {} Tagen", diff),
            7..=13 => "Letzte Woche".to_string(),
            14..=29 => "Vor 2-4 Wochen".to_string(),
            30..=89 => "Letzter Monat".to_string(),
            90..=364 => "Vor einigen Monaten".to_string(),
            _ => "Älter als ein Jahr".to_string(),
        }
    } else {
        "Unbekannt".to_string()
    }
}

/// Liest die überwachten Verzeichnisse aus der Datenbank.
/// Wenn die Tabelle leer ist, werden Standard-OS-Pfade (Desktop, Dokumente, etc.) geladen und gespeichert.
pub fn internal_get_watched_dirs(conn: &rusqlite::Connection) -> Vec<PathBuf> {
    let mut stmt = match conn.prepare("SELECT path FROM watched_directories") {
        Ok(s) => s,
        Err(_) => return Vec::new(),
    };
    
    let paths_result: Result<Vec<String>, _> = stmt.query_map([], |row| row.get(0))
        .and_then(|rows| rows.collect::<Result<Vec<String>, _>>());
    
    let mut dirs_list = Vec::new();
    
    if let Ok(paths) = paths_result {
        if !paths.is_empty() {
            return paths.into_iter().map(PathBuf::from).collect();
        }
    }

    // Wenn leer, Standard-Verzeichnisse ermitteln und speichern
    if let Some(desktop) = dirs::desktop_dir() { dirs_list.push(desktop); }
    if let Some(pictures) = dirs::picture_dir() { dirs_list.push(pictures); }
    if let Some(downloads) = dirs::download_dir() { dirs_list.push(downloads); }
    if let Some(documents) = dirs::document_dir() { dirs_list.push(documents); }

    for dir in &dirs_list {
        conn.execute(
            "INSERT OR IGNORE INTO watched_directories (path) VALUES (?1)",
            [dir.to_string_lossy().to_string()]
        ).ok();
    }

    dirs_list
}

// ─── Tauri Commands ───────────────────────────────────────────────────────────

/// Listet alle Dateien in einem bestimmten Verzeichnis auf.
#[tauri::command]
pub async fn list_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let dir_path = std::path::Path::new(&path);

    if !dir_path.exists() {
        return Err(format!("Verzeichnis existiert nicht: {}", path));
    }

    let mut entries = Vec::new();

    match std::fs::read_dir(dir_path) {
        Ok(read_dir) => {
            for entry in read_dir.flatten() {
                if let Some(file_entry) = read_file_entry(&entry.path()) {
                    // Versteckte Dateien überspringen (beginnen mit .)
                    if !file_entry.name.starts_with('.') {
                        entries.push(file_entry);
                    }
                }
            }
        }
        Err(e) => return Err(format!("Fehler beim Lesen des Verzeichnisses: {}", e)),
    }

    // Nach Änderungsdatum sortieren (neueste zuerst)
    entries.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));

    Ok(entries)
}

/// Gibt Timeline-Daten zurück: Dateien gruppiert nach Datum (Cluster).
/// Liest aus allen überwachten Verzeichnissen.
#[tauri::command]
pub async fn get_timeline_data(state: tauri::State<'_, AppState>) -> Result<Vec<TimelineCluster>, String> {
    let db = state.db.lock().await;
    let watched_dirs = internal_get_watched_dirs(&db.conn);
    drop(db);
    
    let mut all_files: Vec<FileEntry> = Vec::new();

    // Alle überwachten Verzeichnisse durchlesen
    for dir in &watched_dirs {
        if dir.exists() {
            if let Ok(read_dir) = std::fs::read_dir(dir) {
                for entry in read_dir.flatten() {
                    if let Some(file_entry) = read_file_entry(&entry.path()) {
                        if !file_entry.name.starts_with('.') {
                            all_files.push(file_entry);
                        }
                    }
                }
            }
        }
    }

    // Nach Änderungsdatum sortieren (neueste zuerst)
    all_files.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));

    // In Timeline-Cluster gruppieren
    let mut clusters: Vec<TimelineCluster> = Vec::new();
    let mut current_label = String::new();

    for file in all_files {
        let label = date_to_timeline_label(&file.modified_at);

        if label != current_label {
            current_label = label.clone();
            clusters.push(TimelineCluster {
                label: label.clone(),
                date: file.modified_at.clone(),
                files: vec![file],
            });
        } else if let Some(last_cluster) = clusters.last_mut() {
            last_cluster.files.push(file);
        }
    }

    Ok(clusters)
}

/// Gibt alle indexierten Dateien aus der Datenbank zurück.
#[tauri::command]
pub async fn get_all_files(state: tauri::State<'_, AppState>) -> Result<Vec<FileEntry>, String> {
    let db = state.db.lock().await;
    let mut stmt = db.conn.prepare("
        SELECT name, path, extension, size, is_dir, created_at, modified_at, category FROM files
        ORDER BY modified_at DESC
    ").map_err(|e| format!("Fehler beim Vorbereiten der Abfrage: {}", e))?;

    let rows = stmt.query_map([], |row| {
        Ok(FileEntry {
            name: row.get(0)?,
            path: row.get(1)?,
            extension: row.get(2)?,
            size: row.get(3)?,
            is_dir: row.get(4)?,
            created_at: row.get(5)?,
            modified_at: row.get(6)?,
            category: row.get(7)?,
            relevance: None,
        })
    }).map_err(|e| format!("Fehler beim Ausführen der Abfrage: {}", e))?;

    let mut results = Vec::new();
    for row in rows {
        if let Ok(entry) = row {
            results.push(entry);
        }
    }

    Ok(results)
}

/// Gibt Metadaten einer einzelnen Datei zurück.
#[tauri::command]
pub async fn get_file_metadata(path: String) -> Result<FileEntry, String> {
    let file_path = std::path::Path::new(&path);
    read_file_entry(file_path).ok_or_else(|| format!("Datei nicht gefunden: {}", path))
}

/// Einfache Text-basierte Suche über Dateinamen.
/// TODO Phase 2: Semantische Suche über Ollama Embeddings + sqlite-vec
#[tauri::command]
pub async fn search_files(state: tauri::State<'_, AppState>, query: String) -> Result<Vec<FileEntry>, String> {
    let db = state.db.lock().await;
    let watched_dirs = internal_get_watched_dirs(&db.conn);
    drop(db);
    
    let mut results: Vec<FileEntry> = Vec::new();
    let query_lower = query.to_lowercase();

    for dir in &watched_dirs {
        if dir.exists() {
            if let Ok(read_dir) = std::fs::read_dir(dir) {
                for entry in read_dir.flatten() {
                    if let Some(file_entry) = read_file_entry(&entry.path()) {
                        // Einfacher Namensabgleich — wird später durch KI-Suche ersetzt
                        if file_entry.name.to_lowercase().contains(&query_lower) {
                            results.push(file_entry);
                        }
                    }
                }
            }
        }
    }

    results.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));
    Ok(results)
}

/// Gibt die aktuell überwachten Verzeichnisse zurück.
#[tauri::command]
pub async fn get_watched_directories(state: tauri::State<'_, AppState>) -> Result<Vec<String>, String> {
    let db = state.db.lock().await;
    let dirs = internal_get_watched_dirs(&db.conn);
    Ok(dirs.iter().map(|d| d.to_string_lossy().to_string()).collect())
}

/// Fügt ein Verzeichnis zur Überwachung hinzu.
#[tauri::command]
pub async fn add_watched_directory(state: tauri::State<'_, AppState>, path: String) -> Result<(), String> {
    let db = state.db.lock().await;
    db.conn.execute(
        "INSERT OR IGNORE INTO watched_directories (path) VALUES (?1)",
        [&path]
    ).map_err(|e| format!("Fehler beim Hinzufügen: {}", e))?;
    Ok(())
}

/// Entfernt ein Verzeichnis aus der Überwachung.
#[tauri::command]
pub async fn remove_watched_directory(state: tauri::State<'_, AppState>, path: String) -> Result<(), String> {
    let db = state.db.lock().await;
    db.conn.execute(
        "DELETE FROM watched_directories WHERE path = ?1",
        [&path]
    ).map_err(|e| format!("Fehler beim Entfernen: {}", e))?;
    // Optional: Indexierte Dateien aus diesem Pfad bereinigen (Phase 3)
    Ok(())
}

/// Öffnet eine Datei direkt über das Betriebssystem (Bypass für Plugin-Probleme).
#[tauri::command]
pub async fn open_file_native(path: String) -> Result<(), String> {
    log::info!("Öffne Datei nativ: {}", path);
    open::that(&path).map_err(|e| format!("Fehler beim Öffnen: {}", e))
}

/// Löscht eine Datei permanent vom Dateisystem.
#[tauri::command]
pub async fn delete_file(path: String) -> Result<(), String> {
    log::info!("Lösche Datei: {}", path);
    std::fs::remove_file(&path).map_err(|e| format!("Fehler beim Löschen der Datei: {}", e))
}

/// Benennt eine Datei um. new_path sollte der absolute Pfad zum neuen Speicherort/Namen sein.
#[tauri::command]
pub async fn rename_file(path: String, new_path: String) -> Result<(), String> {
    log::info!("Benenne Datei um von {} nach {}", path, new_path);
    std::fs::rename(&path, &new_path).map_err(|e| format!("Fehler beim Umbenennen der Datei: {}", e))
}

/// Öffnet den Windows Explorer und markiert die spezifizierte Datei.
#[tauri::command]
pub async fn show_in_explorer(path: String) -> Result<(), String> {
    log::info!("Zeige in Explorer: {}", path);
    // Ersetze Vorwärtsslashes durch Backslashes für den Windows Explorer
    let win_path = path.replace("/", "\\");
    
    std::process::Command::new("explorer")
        .args(["/select,", &win_path])
        .spawn()
        .map_err(|e| format!("Fehler beim Öffnen des Explorers: {}", e))?;
        
    Ok(())
}
