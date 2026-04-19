// ChronoVault — Timeline (Hauptansicht)
// Vertikale, chronologische Timeline mit Clustering nach Datum.

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, FolderOpen, RefreshCw } from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';
import { useFileWatcher } from '../../hooks/useFileWatcher';
import { TimelineCluster } from './TimelineCluster';

export function Timeline() {
  const { clusters, isLoading, error, searchResults, searchQuery, loadTimeline } = useFileStore();

  // File Watcher aktivieren — lauscht auf Dateiänderungen
  useFileWatcher();

  // Timeline beim ersten Laden abrufen
  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  // ─── Suchergebnisse anzeigen ────────────────────────────────────────────
  if (searchQuery && searchResults.length > 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6 relative">
        <div className="timeline-line" />
        <div className="pl-12 mb-6">
          <h2 className="text-lg font-bold text-cv-text">
            Suchergebnisse für "{searchQuery}"
          </h2>
          <p className="text-sm text-cv-text-muted mt-1">
            {searchResults.length} Datei{searchResults.length !== 1 ? 'en' : ''} gefunden
          </p>
        </div>
        <TimelineCluster
          cluster={{
            label: `Ergebnisse`,
            date: new Date().toISOString(),
            files: searchResults,
          }}
          clusterIndex={0}
        />
      </div>
    );
  }

  // ─── Leere Suche ────────────────────────────────────────────────────────
  if (searchQuery && searchResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-cv-surface flex items-center justify-center mb-4">
          <FolderOpen size={28} className="text-cv-text-muted" />
        </div>
        <h2 className="text-lg font-semibold text-cv-text mb-2">Keine Ergebnisse</h2>
        <p className="text-sm text-cv-text-muted max-w-sm">
          Keine Dateien gefunden für "{searchQuery}".
          <br />
          Nutze die KI-Suche oben für intelligente Dateianalysen.
        </p>
      </div>
    );
  }

  // ─── Ladezustand ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="pl-12">
          <div className="skeleton h-6 w-32 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-16 w-full mb-3 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Fehler ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-cv-danger/10 flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-lg font-semibold text-cv-text mb-2">Fehler beim Laden</h2>
        <p className="text-sm text-cv-text-muted max-w-sm mb-4">{error}</p>
        <button
          onClick={loadTimeline}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cv-accent text-white text-sm font-medium hover:bg-cv-accent/80 transition-colors"
        >
          <RefreshCw size={14} />
          Erneut versuchen
        </button>
      </div>
    );
  }

  // ─── Leere Timeline ────────────────────────────────────────────────────
  if (clusters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cv-gradient-start to-cv-gradient-end flex items-center justify-center mb-6"
        >
          <Clock size={36} className="text-white" />
        </motion.div>
        <h2 className="text-xl font-bold text-cv-text mb-2">Deine Timeline ist leer</h2>
        <p className="text-sm text-cv-text-muted max-w-md">
          ChronoVault überwacht deine Desktop- und Bilder-Ordner.
          Erstelle oder bearbeite eine Datei, um sie hier zu sehen.
        </p>
      </div>
    );
  }

  // ─── Timeline ──────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto p-6 relative">
      {/* Vertikale Timeline-Linie */}
      <div className="timeline-line" />

      {/* Timeline Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pl-12 mb-8 flex items-center justify-between relative z-10"
      >
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text font-heading">Deine Timeline</h1>
          <p className="text-sm text-cv-text-muted mt-1">
            Chronologischer Überblick über deine Dateien
          </p>
        </div>
        <button
          onClick={loadTimeline}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
                     text-cv-text-secondary hover:text-cv-text bg-cv-surface hover:bg-cv-surface-hover
                     border border-cv-border transition-all duration-200"
        >
          <RefreshCw size={12} />
          Aktualisieren
        </button>
      </motion.div>

      {/* Timeline Clusters */}
      {clusters.map((cluster, i) => (
        <TimelineCluster key={`${cluster.label}-${i}`} cluster={cluster} clusterIndex={i} />
      ))}
    </div>
  );
}
