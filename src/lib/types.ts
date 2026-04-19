// ChronoVault — TypeScript Interfaces
// Zentrale Typdefinitionen für die Kommunikation zwischen Frontend und Backend.

// ─── Datei-Typen ─────────────────────────────────────────────────────────────

/** Metadaten einer einzelnen Datei (korrespondiert mit Rust FileEntry) */
export interface FileEntry {
  name: string;
  path: string;
  extension: string;
  size: number;
  is_dir: boolean;
  created_at: string;   // ISO 8601
  modified_at: string;  // ISO 8601
  category: FileCategory;
  relevance?: number;   // Ähnlichkeits-Score (0.0 - 1.0)
}

/** Datei-Kategorien (korrespondiert mit Rust categorize_by_extension) */
export type FileCategory =
  | 'document'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'executable'
  | 'code'
  | 'spreadsheet'
  | 'presentation'
  | 'folder'
  | 'shortcut'
  | 'other';

/** Timeline-Cluster (korrespondiert mit Rust TimelineCluster) */
export interface TimelineCluster {
  label: string;       // z.B. "Heute", "Gestern"
  date: string;        // ISO 8601
  files: FileEntry[];
}

// ─── Event-Typen ─────────────────────────────────────────────────────────────

/** File Watcher Event (korrespondiert mit Rust FileChangeEvent) */
export interface FileChangeEvent {
  path: string;
  kind: string;
}

// ─── UI-Typen ────────────────────────────────────────────────────────────────

/** Aktuell aktive Ansicht */
export type ViewType = 'timeline' | 'graph' | 'explorer' | 'gamification' | 'settings';

/** Sidebar-Navigations-Item */
export interface NavItem {
  id: ViewType;
  label: string;
  icon: string;
}

// ─── Gamification (Phase 3) ──────────────────────────────────────────────────

export interface UserProgress {
  xp: number;
  level: number;
  streak_days: number;
  total_files_analyzed: number;
  total_ai_actions: number;
  title: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  xp_reward: number;
  unlocked_at?: string;
}

// ─── Suche ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  files: FileEntry[];
  query: string;
  total: number;
  // TODO Phase 2:
  // semantic_score?: number;
}
