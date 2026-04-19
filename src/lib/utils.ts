// ChronoVault — Hilfsfunktionen

import type { FileCategory } from './types';

/** Formatiert eine Dateigröße in menschenlesbare Form. */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

/** Formatiert ein ISO-Datum in relative Zeit (z.B. "vor 2 Stunden"). */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Gerade eben';
  if (diffMin < 60) return `Vor ${diffMin} Min.`;
  if (diffHours < 24) return `Vor ${diffHours} Std.`;
  if (diffDays < 7) return `Vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;

  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Formatiert ein ISO-Datum in Uhrzeit. */
export function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Gibt CSS-Klasse für eine Datei-Kategorie zurück. */
export function getCategoryClass(category: FileCategory): string {
  return `cat-${category}`;
}

/** Gibt ein Label für eine Datei-Kategorie zurück. */
export function getCategoryLabel(category: FileCategory): string {
  const labels: Record<FileCategory, string> = {
    document: 'Dokument',
    image: 'Bild',
    video: 'Video',
    audio: 'Audio',
    archive: 'Archiv',
    executable: 'Programm',
    code: 'Code',
    spreadsheet: 'Tabelle',
    presentation: 'Präsentation',
    folder: 'Ordner',
    shortcut: 'Verknüpfung',
    other: 'Sonstige',
  };
  return labels[category] || 'Sonstige';
}
