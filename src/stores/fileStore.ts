// ChronoVault — File Store (Zustand)
// Zentraler State für Datei-Daten, Timeline und Suche.

import { create } from 'zustand';
import type { FileEntry, TimelineCluster } from '../lib/types';
import { getTimelineData, searchFiles } from '../lib/tauri';

interface FileState {
  // Timeline
  clusters: TimelineCluster[];
  isLoading: boolean;
  error: string | null;

  // Suche
  searchQuery: string;
  searchResults: FileEntry[];
  isSearching: boolean;

  // Ausgewählte Datei
  selectedFile: FileEntry | null;

  // Theme
  theme: 'default' | 'monochrome';
  setTheme: (theme: 'default' | 'monochrome') => void;

  // Aktionen
  loadTimeline: () => Promise<void>;
  search: (query: string) => Promise<void>;
  aiSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
  setSelectedFile: (file: FileEntry | null) => void;
  addFileToTimeline: (file: FileEntry) => void;
}

export const useFileStore = create<FileState>((set, get) => ({
  // ─── Initial State ─────────────────────────────────────────────────
  clusters: [],
  isLoading: false,
  error: null,

  searchQuery: '',
  searchResults: [],
  isSearching: false,

  selectedFile: null,
  theme: 'default',
  setTheme: (theme) => set({ theme }),

  // ─── Aktionen ──────────────────────────────────────────────────────
  loadTimeline: async () => {
    set({ isLoading: true, error: null });
    try {
      const clusters = await getTimelineData();
      set({ clusters, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
      console.error('Timeline laden fehlgeschlagen:', err);
    }
  },

  search: async (query: string) => {
    set({ searchQuery: query, isSearching: true });
    try {
      const searchResults = await searchFiles(query);
      set({ searchResults, isSearching: false });
    } catch (err) {
      set({ isSearching: false });
      console.error('Suche fehlgeschlagen:', err);
    }
  },

  aiSearch: async (query: string) => {
    set({ searchQuery: query, isSearching: true });
    try {
      const { semanticSearch } = await import('../lib/tauri');
      const searchResults = await semanticSearch(query);
      set({ searchResults, isSearching: false });
    } catch (err) {
      set({ isSearching: false });
      console.error('KI Suche fehlgeschlagen:', err);
    }
  },

  clearSearch: () => {
    set({ searchQuery: '', searchResults: [], isSearching: false });
  },

  setSelectedFile: (file) => {
    set({ selectedFile: file });
  },

  addFileToTimeline: (file) => {
    const { clusters } = get();
    // Neue Datei zum "Heute"-Cluster hinzufügen
    const todayCluster = clusters.find((c) => c.label === 'Heute');
    if (todayCluster) {
      todayCluster.files.unshift(file);
      set({ clusters: [...clusters] });
    } else {
      // Neuen "Heute"-Cluster erstellen
      set({
        clusters: [
          { label: 'Heute', date: new Date().toISOString(), files: [file] },
          ...clusters,
        ],
      });
    }
  },
}));
