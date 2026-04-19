// ChronoVault — File Watcher Hook
// Lauscht auf "file-change" Events vom Rust-Backend und aktualisiert den State.

import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import type { FileChangeEvent } from '../lib/types';
import { useFileStore } from '../stores/fileStore';

/** Hook: Lauscht auf File-System-Änderungen und aktualisiert die Timeline. */
export function useFileWatcher() {
  const loadTimeline = useFileStore((s) => s.loadTimeline);

  useEffect(() => {
    // Auf File-Change Events vom Rust File Watcher lauschen
    const unlisten = listen<FileChangeEvent>('file-change', (event) => {
      console.log('[FileWatcher] Änderung erkannt:', event.payload);

      // Timeline neu laden bei Dateiänderungen
      // TODO: Optimierung — nur betroffene Cluster aktualisieren
      loadTimeline();
    });

    // Cleanup: Event Listener entfernen
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [loadTimeline]);
}
