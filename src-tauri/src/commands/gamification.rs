use serde::{Serialize, Deserialize};
use rusqlite::params;
use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct UserProgress {
    pub xp: i32,
    pub level: i32,
    pub streak_days: i32,
    pub total_files_analyzed: i32,
    pub total_ai_actions: i32,
    pub title: String,
}

fn get_level_title(level: i32) -> String {
    match level {
        1..=3 => "Chrono-Neuling".to_string(),
        4..=7 => "Daten-Archivar".to_string(),
        8..=12 => "KI-Pionier".to_string(),
        13..=20 => "Vault-Meister".to_string(),
        21..=40 => "Ordnungs-Guru".to_string(),
        _ => "Digitaler Gott".to_string(),
    }
}

#[tauri::command]
pub async fn get_user_progress(state: tauri::State<'_, AppState>) -> Result<UserProgress, String> {
    let db = state.db.lock().await;
    let mut stmt = db.conn.prepare("SELECT xp, level, streak_days, total_files_analyzed, total_ai_actions FROM user_progress WHERE id = 1")
        .map_err(|e| e.to_string())?;
    
    let progress = stmt.query_row([], |row| {
        let level: i32 = row.get(1)?;
        Ok(UserProgress {
            xp: row.get(0)?,
            level,
            streak_days: row.get(2)?,
            total_files_analyzed: row.get(3)?,
            total_ai_actions: row.get(4)?,
            title: get_level_title(level),
        })
    }).map_err(|e| e.to_string())?;

    Ok(progress)
}

pub fn internal_add_xp(amount: i32, ai_action: bool, db: &rusqlite::Connection) -> Result<UserProgress, String> {
    let mut progress: UserProgress = db.query_row(
        "SELECT xp, level, streak_days, total_files_analyzed, total_ai_actions FROM user_progress WHERE id = 1",
        [],
        |row| {
            let level: i32 = row.get(1)?;
            Ok(UserProgress {
                xp: row.get(0)?,
                level,
                streak_days: row.get(2)?,
                total_files_analyzed: row.get(3)?,
                total_ai_actions: row.get(4)?,
                title: get_level_title(level),
            })
        }
    ).map_err(|e| e.to_string())?;

    progress.xp += amount;
    if ai_action {
        progress.total_ai_actions += 1;
    }
    
    let new_level = (progress.xp / 1000) + 1;
    
    db.execute(
        "UPDATE user_progress SET xp = ?, level = ?, total_ai_actions = ? WHERE id = 1",
        params![progress.xp, new_level, progress.total_ai_actions]
    ).map_err(|e| e.to_string())?;

    progress.level = new_level;
    progress.title = get_level_title(new_level);
    Ok(progress)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Achievement {
    pub id: String,
    pub name: String,
    pub description: String,
    pub xp_reward: i32,
    pub unlocked_at: Option<String>,
}

#[tauri::command]
pub async fn add_xp(amount: i32, state: tauri::State<'_, AppState>) -> Result<UserProgress, String> {
    let db = state.db.lock().await;
    internal_add_xp(amount, false, &db.conn)
}

#[tauri::command]
pub async fn get_achievements(state: tauri::State<'_, AppState>) -> Result<Vec<Achievement>, String> {
    let db = state.db.lock().await;
    let mut stmt = db.conn.prepare("SELECT id, name, description, xp_reward, unlocked_at FROM achievements")
        .map_err(|e| e.to_string())?;
    
    let rows = stmt.query_map([], |row| {
        Ok(Achievement {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            xp_reward: row.get(3)?,
            unlocked_at: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }
    Ok(results)
}
