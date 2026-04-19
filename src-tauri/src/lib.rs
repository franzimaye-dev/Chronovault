// ChronoVault — Rust Backend
// This module defines the Tauri app configuration and registers all modules.

mod commands;
mod database;
mod watcher;
mod ai;        // Ollama REST Client
// TODO Phase 3: mod rules;     // Auto-organization rule engine
// TODO Phase 3: mod gamification; // Gamification engine

use database::Database;
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

use std::sync::atomic::AtomicBool;

/// Shared App State, shared via Tauri Managed State.
pub struct AppState {
    pub db: Arc<Mutex<Database>>,
    pub indexing_cancelled: Arc<AtomicBool>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_handle = app.handle().clone();

            // ── Initialize Database ───────────────────────────────────────
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Could not determine App Data directory");
            std::fs::create_dir_all(&app_data_dir)
                .expect("Could not create App Data directory");

            let db_path = app_data_dir.join("chronovault.db");
            let db = Database::new(&db_path).expect("Database initialization failed");
            let db = Arc::new(Mutex::new(db));

            // Register State
            app.manage(AppState { 
                db: db.clone(),
                indexing_cancelled: Arc::new(AtomicBool::new(false)),
            });

            // ── Start File Watcher ────────────────────────────────────────
            let watcher_handle = app_handle.clone();
            let watcher_db = db.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = watcher::start_watcher(watcher_handle, watcher_db).await {
                    log::error!("File Watcher error: {}", e);
                }
            });

            log::info!("ChronoVault successfully started!");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::files::list_directory,
            commands::files::get_timeline_data,
            commands::files::get_file_metadata,
            commands::files::search_files,
            commands::files::get_watched_directories,
            commands::files::add_watched_directory,
            commands::files::remove_watched_directory,
            commands::files::open_file_native,
            commands::files::delete_file,
            commands::files::rename_file,
            commands::files::show_in_explorer,
            commands::search::semantic_search,
            commands::search::get_file_relationships,
            commands::search::index_files,
            commands::search::cancel_indexing,
            commands::search::summarize_file,
            commands::gamification::get_user_progress,
            commands::gamification::add_xp,
            commands::gamification::get_achievements,
        ])
        .run(tauri::generate_context!())
        .expect("Error while starting the Tauri app");
}
