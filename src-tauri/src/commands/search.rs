use crate::ai::ollama::generate_embedding;
use crate::commands::files::{FileEntry, internal_get_watched_dirs, read_file_entry};
use crate::AppState;
use zerocopy::AsBytes;
use std::fs::File;
use std::io::Read;
use tauri::Emitter;

fn read_text_snippet(path: &str) -> String {
    let mut file = match File::open(path) {
        Ok(f) => f,
        Err(_) => return String::new(),
    };
    // We read the first ~1000 characters
    let mut buffer = [0; 1000];
    let bytes_read = file.read(&mut buffer).unwrap_or(0);
    if bytes_read == 0 {
        return String::new();
    }
    String::from_utf8_lossy(&buffer[..bytes_read]).to_string()
}

#[tauri::command]
pub async fn index_files(state: tauri::State<'_, AppState>, app: tauri::AppHandle, force_reindex: bool) -> Result<usize, String> {
    if force_reindex {
        let db = state.db.lock().await;
        // Clear vector table to force fresh embeddings
        db.conn.execute("DELETE FROM vec_embeddings", []).ok();
        drop(db);
    }

    let db = state.db.lock().await;
    let watched_dirs = internal_get_watched_dirs(&db.conn);
    drop(db);

    let mut files_to_index: Vec<FileEntry> = Vec::new();
    let mut stack = watched_dirs;

    // 1. Recursive search for all files in watched directories
    while let Some(current_path) = stack.pop() {
        if current_path.is_dir() {
            if let Ok(entries) = std::fs::read_dir(&current_path) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if let Some(file_entry) = read_file_entry(&path) {
                        // Skip hidden files and system folders
                        if !file_entry.name.starts_with('.') {
                            if path.is_dir() {
                                stack.push(path);
                            }
                            files_to_index.push(file_entry);
                        }
                    }
                }
            }
        }
    }

    // Reset cancellation flag at start
    state.indexing_cancelled.store(false, std::sync::atomic::Ordering::SeqCst);

    let _progress_sender = app.clone();
    let mut indexed_count = 0;

    for (idx, file) in files_to_index.iter().enumerate() {
        // Cancellation check
        if state.indexing_cancelled.load(std::sync::atomic::Ordering::SeqCst) {
            println!("Indexing cancelled by user.");
            break;
        }

        let progress = format!("{}/{}", idx + 1, files_to_index.len());
        println!("Indexing progress: {}", progress);
        if let Err(e) = app.emit("indexing-progress", progress.clone()) {
            eprintln!("Failed to emit indexing-progress: {}", e);
        }

        let db = state.db.lock().await;

        let file_id: i64 = match db.conn.query_row(
            "SELECT id FROM files WHERE path = ?1",
            [&file.path],
            |row| row.get(0),
        ) {
            Ok(id) => id,
            Err(_) => {
                db.conn.execute(
                    "INSERT INTO files (name, path, extension, size, is_dir, category, created_at, modified_at)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                    (
                        &file.name,
                        &file.path,
                        &file.extension,
                        file.size as i64,
                        file.is_dir,
                        &file.category,
                        &file.created_at,
                        &file.modified_at,
                    ),
                ).map_err(|e| format!("Failed to insert file: {}", e))?;
                db.conn.last_insert_rowid()
            }
        };

        let has_embedding: bool = db.conn.query_row(
            "SELECT 1 FROM vec_embeddings WHERE file_id = ?1",
            [file_id],
            |_| Ok(true),
        ).unwrap_or(false);

        drop(db);

        if !has_embedding {
            // For documents/code, also read content for better embeddings
            let content_preview = match file.category.as_str() {
                "document" | "code" | "other" | "spreadsheet" => read_text_snippet(&file.path),
                _ => String::new(),
            };

            // Nomic-embed-text recommended format: "search_document: ..."
            let text_to_embed = format!(
                "search_document: File Name: {}. Extension: {}. Category: {}. Content Preview: {}", 
                file.name,
                file.extension,
                file.category, 
                content_preview
            );
            
            if let Ok(embedding) = generate_embedding(&text_to_embed).await {
                let db_locked = state.db.lock().await;
                let mut stmt = db_locked.conn.prepare(
                    "INSERT INTO vec_embeddings (file_id, embedding) VALUES (?1, ?2)"
                ).map_err(|e| format!("Prepare insert failed: {}", e))?;
                
                stmt.execute(rusqlite::params![file_id, embedding.as_bytes()])
                    .unwrap_or(0); // Ignore individual insert fails
                
                indexed_count += 1;
            }
        }
    }

    Ok(indexed_count)
}

/// Cancels the ongoing indexing process.
#[tauri::command]
pub async fn cancel_indexing(state: tauri::State<'_, AppState>) -> Result<(), String> {
    state.indexing_cancelled.store(true, std::sync::atomic::Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
pub async fn semantic_search(state: tauri::State<'_, AppState>, query: String) -> Result<Vec<FileEntry>, String> {
    // Nomic-embed-text recommended search query prefix: "search_query: "
    let query_prompt = format!("search_query: {}", query);
    let embedded_query = generate_embedding(&query_prompt).await.map_err(|e| format!("Embedding failed: {}", e))?;

    let db = state.db.lock().await;

    // Use sqlite-vec to find nearest neighbors
    let mut stmt = db.conn.prepare("
        SELECT f.path, f.name, f.extension, f.size, f.is_dir, f.created_at, f.modified_at, f.category, v.distance
        FROM vec_embeddings v
        JOIN files f ON f.id = v.file_id
        WHERE v.embedding MATCH ? AND k = 25
        ORDER BY distance
        LIMIT 1000
    ").map_err(|e| format!("Prepare failed: {}", e))?;

    let rows = stmt.query_map([embedded_query.as_bytes()], |row| {
        let distance: f32 = row.get(8)?;
        Ok(FileEntry {
            path: row.get(0)?,
            name: row.get(1)?,
            extension: row.get(2)?,
            size: row.get(3)?,
            is_dir: row.get(4)?,
            created_at: row.get(5)?,
            modified_at: row.get(6)?,
            category: row.get(7)?,
            relevance: Some(1.0 - distance), // Convert distance to relevance
        })
    }).map_err(|e| format!("Query execution failed: {}", e))?;

    let mut results = Vec::new();
    for row in rows {
        if let Ok(file_entry) = row {
            results.push(file_entry);
        }
    }

    Ok(results)
}

/// Structure for a relationship between two files
#[derive(serde::Serialize)]
pub struct FileRelationship {
    pub source: String,
    pub target: String,
    pub distance: f32,
}

/// Finds semantic similarities between ALL indexed files.
/// Returns pairs whose distance is below a threshold.
#[tauri::command]
pub async fn get_file_relationships(state: tauri::State<'_, AppState>, threshold: f32) -> Result<Vec<FileRelationship>, String> {
    let db = state.db.lock().await;

    // We compare all embeddings with each other (Brute Force in SQL, as SQLite-Vec is k-NN optimized)
    // Note: For a very large number of files (>1000), this should be optimized.
    let mut stmt = db.conn.prepare("
        SELECT v1.file_id, v2.file_id, vec_distance_cosine(v1.embedding, v2.embedding) as dist,
               f1.path, f2.path
        FROM vec_embeddings v1
        CROSS JOIN vec_embeddings v2
        JOIN files f1 ON f1.id = v1.file_id
        JOIN files f2 ON f2.id = v2.file_id
        WHERE v1.file_id < v2.file_id  -- Prevent self-links and duplicates (A-B vs B-A)
          AND dist < ?1
        ORDER BY dist ASC
        LIMIT 1000
    ").map_err(|e| format!("Prepare failed: {}", e))?;

    let rows = stmt.query_map([threshold], |row| {
        Ok(FileRelationship {
            source: row.get(3)?,
            target: row.get(4)?,
            distance: row.get(2)?,
        })
    }).map_err(|e| format!("Query failed: {}", e))?;

    let mut relationships = Vec::new();
    for row in rows {
        if let Ok(rel) = row {
            relationships.push(rel);
        }
    }

    Ok(relationships)
}

#[tauri::command]
pub async fn summarize_file(state: tauri::State<'_, AppState>, path: String) -> Result<String, String> {
    // Read up to 4000 characters from the file to respect context limits
    let mut file = match File::open(&path) {
        Ok(f) => f,
        Err(_) => return Err("Could not read file.".into()),
    };
    
    let mut buffer = [0; 4000];
    let bytes_read = file.read(&mut buffer).unwrap_or(0);
    
    if bytes_read == 0 {
        return Err("File is empty or not text-based.".into());
    }
    
    let text_content = String::from_utf8_lossy(&buffer[..bytes_read]).to_string();
    
    // Check if the content seems like valid text (lossy string should not just be gibberish)
    // If it's mostly random bytes, it's a binary file
    if text_content.chars().filter(|c| c.is_ascii_graphic() || c.is_ascii_whitespace()).count() < bytes_read / 3 {
         return Err("Summary only available for text documents.".into());
    }

    let summary = crate::ai::ollama::generate_summary(&text_content).await.map_err(|e| format!("AI summary failed: {}", e))?;
    
    // Grant XP for analysis (100 XP)
    let db_locked = state.db.lock().await;
    crate::commands::gamification::internal_add_xp(100, true, &db_locked.conn).ok();

    Ok(summary)
}
