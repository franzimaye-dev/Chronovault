// ChronoVault — File System Watcher
// Überwacht konfigurierte Verzeichnisse und emittiert Events an das Frontend.
// Verwendet manuelles Debouncing mit tokio statt notify-debouncer-mini.

pub mod handler;

use handler::FileChangeEvent;
use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

// Unused paths logic removed in favor of DB paths in start_watcher

use crate::commands::files::internal_get_watched_dirs;
use crate::database::Database;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Startet den File System Watcher als Background-Task.
pub async fn start_watcher(app_handle: AppHandle, db: Arc<Mutex<Database>>) -> Result<(), Box<dyn std::error::Error>> {
    let (tx, rx) = std::sync::mpsc::channel();

    let mut watcher = RecommendedWatcher::new(
        move |res: notify::Result<notify::Event>| {
            if let Ok(event) = res {
                let _ = tx.send(event);
            }
        },
        Config::default(),
    )?;

    // Pfade aus DB laden
    let db_locked = db.lock().await;
    let paths = internal_get_watched_dirs(&db_locked.conn);
    drop(db_locked);

    for path in &paths {
        if path.exists() {
            log::info!("Überwache Verzeichnis (rekursiv): {}", path.display());
            // RecursiveMode::Recursive für volle Überwachung inkl. Subordner
            watcher.watch(path, RecursiveMode::Recursive)?;
        }
    }

    // Event-Loop mit manuellem Debouncing
    tokio::task::spawn_blocking(move || {
        // Watcher muss im Scope bleiben, sonst wird er gedroppt
        let _watcher = watcher;

        // Debouncing: Pfad -> letzter Event-Zeitpunkt
        let debounce_duration = Duration::from_secs(2);
        let mut last_events: HashMap<String, Instant> = HashMap::new();

        loop {
            match rx.recv() {
                Ok(event) => {
                    for path in &event.paths {
                        let path_str = path.to_string_lossy().to_string();
                        let now = Instant::now();

                        // Debouncing: Event nur emittieren wenn genug Zeit vergangen ist
                        let should_emit = last_events
                            .get(&path_str)
                            .map(|last| now.duration_since(*last) > debounce_duration)
                            .unwrap_or(true);

                        if should_emit {
                            last_events.insert(path_str.clone(), now);

                            let kind_str = format!("{:?}", event.kind);
                            let change_event = FileChangeEvent {
                                path: path_str.clone(),
                                kind: kind_str.clone(),
                            };

                            log::info!(
                                "Dateiänderung erkannt: {} ({})",
                                path_str,
                                kind_str
                            );

                            // Event an Frontend emittieren
                            if let Err(e) = app_handle.emit("file-change", &change_event) {
                                log::error!("Fehler beim Emittieren des Events: {}", e);
                            }
                        }
                    }
                }
                Err(e) => {
                    log::error!("Channel-Fehler: {}", e);
                    break;
                }
            }
        }
    });

    Ok(())
}
