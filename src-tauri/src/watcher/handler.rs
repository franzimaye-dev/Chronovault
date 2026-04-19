// ChronoVault — File Watcher Event Handler
// Definiert die Event-Datentypen für die Kommunikation mit dem Frontend.

use serde::{Deserialize, Serialize};

/// Repräsentiert ein File-Change-Event, das an das Frontend emittiert wird.
/// Das Frontend empfängt dies über `listen("file-change", callback)`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileChangeEvent {
    /// Absoluter Pfad der geänderten Datei
    pub path: String,
    /// Art der Änderung (z.B. "Create", "Modify", "Remove")
    pub kind: String,
}

// TODO Phase 2: Handler für KI-basierte Kategorisierung bei neuen Dateien
// Wenn eine neue Datei erkannt wird:
// 1. Text extrahieren (PDF/DOCX/TXT)
// 2. Ollama API aufrufen für Zusammenfassung + Kategorisierung
// 3. Embedding generieren und in sqlite-vec speichern
// 4. "file-analyzed" Event an Frontend emittieren

// TODO Phase 3: Handler für Auto-Organisation Regel-Engine
// Wenn eine neue Datei erkannt wird:
// 1. Gegen alle aktiven Regeln prüfen
// 2. Passende Aktionen ausführen (verschieben, taggen, etc.)
// 3. "rule-triggered" Event an Frontend emittieren
