// ChronoVault — Tauri Invoke Wrapper
// Typsichere Wrapper um die Tauri IPC-Aufrufe.

import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { FileEntry, TimelineCluster, UserProgress, Achievement } from './types';

// ─── File Commands ───────────────────────────────────────────────────────────

/** Listet alle Dateien in einem Verzeichnis auf. */
export async function listDirectory(path: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>('list_directory', { path });
}

/** Gibt Timeline-Daten zurück (Dateien gruppiert nach Datum). */
export async function getTimelineData(): Promise<TimelineCluster[]> {
  return invoke<TimelineCluster[]>('get_timeline_data');
}

/** Gibt Metadaten einer einzelnen Datei zurück. */
export async function getFileMetadata(path: string): Promise<FileEntry> {
  return invoke<FileEntry>('get_file_metadata', { path });
}

/** Einfache Text-Suche über Dateinamen. */
export async function searchFiles(query: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>('search_files', { query });
}

/** Gibt die aktuell überwachten Verzeichnisse zurück. */
export async function getWatchedDirectories(): Promise<string[]> {
  return invoke<string[]>('get_watched_directories');
}

/** Fügt ein Verzeichnis zur Überwachung hinzu. */
export async function addWatchedDirectory(path: string): Promise<void> {
  return invoke('add_watched_directory', { path });
}

/** Entfernt ein Verzeichnis aus der Überwachung. */
export async function removeWatchedDirectory(path: string): Promise<void> {
  return invoke('remove_watched_directory', { path });
}

/** Öffnet einen nativen Ordner-Picker und fügt den gewählten Pfad hinzu. */
export async function pickAndAddDirectory(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Ordner zur Überwachung auswählen'
  });
  
  if (selected && typeof selected === 'string') {
    await addWatchedDirectory(selected);
    return selected;
  }
  return null;
}

// ─── AI Commands ───────────────────────────────────────────────────

/** Führt eine semantische Ähnlichkeitssuche mit Ollama und sqlite-vec durch. */
export async function semanticSearch(query: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>('semantic_search', { query });
}

/** Triggert die Generierung von Embeddings für alle noch nicht indexierten Dateien. */
export async function indexFiles(forceReindex: boolean = false): Promise<number> {
  return invoke<number>('index_files', { forceReindex });
}

/** Bricht eine laufende Indexierung ab. */
export async function cancelIndexing(): Promise<void> {
  return invoke('cancel_indexing');
}

/** Generiert eine KI-Zusammenfassung des Dateiinhalts. */
export async function summarizeFile(path: string): Promise<string> {
  return invoke<string>('summarize_file', { path });
}

// ─── File Actions ─────────────────────────────────────────

/** Öffnet eine Datei (Fallback/Native). */
export async function openFile(path: string): Promise<void> {
  return invoke('open_file_native', { path });
}

/** Löscht eine Datei permanent. */
export async function deleteFile(path: string): Promise<void> {
  return invoke('delete_file', { path });
}

/** Benennt eine Datei um. */
export async function renameFile(path: string, newPath: string): Promise<void> {
  return invoke('rename_file', { path, newPath });
}

/** Markiert die Datei im Windows Explorer. */
export async function showInExplorer(path: string): Promise<void> {
  return invoke('show_in_explorer', { path });
}

// ─── Gamification Commands ─────────────────────────────────────────

/** Gibt den aktuellen Fortschritt des Benutzers zurück. */
export async function getUserProgress(): Promise<UserProgress> {
  return invoke<UserProgress>('get_user_progress');
}

/** Fügt dem Benutzer XP hinzu und gibt den aktualisierten Fortschritt zurück. */
export async function addXP(amount: number): Promise<UserProgress> {
  return invoke<UserProgress>('add_xp', { amount });
}

/** Gibt alle Achievements und deren Status zurück. */
export async function getAchievements(): Promise<Achievement[]> {
  return invoke<Achievement[]>('get_achievements');
}

/** Findet semantische Beziehungen zwischen Dateien. */
export async function getFileRelationships(threshold: number = 0.2): Promise<any[]> {
  return invoke('get_file_relationships', { threshold });
}
