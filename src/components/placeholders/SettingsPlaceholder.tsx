// ChronoVault — Settings View
// Central configuration for themes, AI, and paths (Brutalist / Sharp Edges).

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, FolderOpen, Brain, Database, Sparkles, X, Plus } from 'lucide-react';
import { getWatchedDirectories, addWatchedDirectory, removeWatchedDirectory, pickAndAddDirectory } from '../../lib/tauri';
import { useFileStore } from '../../stores/fileStore';
import { useToastStore } from '../../stores/toastStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTranslation } from '../../lib/i18n';

export function SettingsView() {
  const { addToast } = useToastStore();
  const { t, language } = useTranslation();
  const { setLanguage } = useSettingsStore();
  const [watchedDirs, setWatchedDirs] = useState<string[]>([]);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingStatus, setIndexingStatus] = useState<string | null>(null);
  const [indexCount, setIndexCount] = useState<number | null>(null);
  const [newDir, setNewDir] = useState('');
  
  const { theme, setTheme } = useFileStore();

  useEffect(() => {
    let unlistenFn: (() => void) | null = null;
    
    console.log("SettingsView: Setting up indexing-progress listener...");
    
    /**
     * Set up an event listener for background indexing progress from the Rust backend.
     */
    const setupListener = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        const unlisten = await listen<string>('indexing-progress', (event) => {
          console.log("Progress Event received:", event.payload);
          setIndexingStatus(event.payload);
        });
        unlistenFn = unlisten;
      } catch (err) {
        console.error("Failed to setup event listener:", err);
      }
    };

    setupListener();
    return () => { 
        if (unlistenFn) {
            console.log("SettingsView: Cleaning up indexing-progress listener...");
            unlistenFn(); 
        }
    };
  }, []);

  /**
   * Loads the currently watched directories from the persistent store.
   */
  const loadDirs = () => {
    getWatchedDirectories()
      .then(setWatchedDirs)
      .catch(console.error);
  };

  useEffect(() => {
    loadDirs();
  }, []);

  /**
   * Manually adds a directory path to the watch list.
   */
  const handleAddDir = async () => {
    if (!newDir.trim()) return;
    try {
      await addWatchedDirectory(newDir.trim());
      setNewDir('');
      loadDirs();
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Opens a native folder picker to select and add a directory to the watch list.
   */
  const handlePickDir = async () => {
    try {
      const added = await pickAndAddDirectory();
      if (added) loadDirs();
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Removes a directory from the watch list.
   */
  const handleRemoveDir = async (path: string) => {
    try {
      await removeWatchedDirectory(path);
      loadDirs();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 relative">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-cv-border-subtle">
          <div className="w-12 h-12 bg-cv-surface border border-cv-border flex items-center justify-center">
            <Settings size={24} className="text-cv-accent-light" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white font-heading tracking-tight uppercase">{t.systemSettings}</h1>
            <p className="text-sm text-cv-text-muted">{language === 'de' ? 'Personalisiere deine ChronoVault Erfahrung' : 'Personalize your ChronoVault experience'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Design & Appearance & Language */}
          <section className="glass p-6 border-cv-border-subtle flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-cv-accent/10 flex items-center justify-center">
                <Sparkles size={16} className="text-cv-accent-light" />
              </div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest font-heading">{t.appearance}</h2>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-cv-text-muted uppercase tracking-widest">{t.theme}</span>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setTheme('default')}
                    className={`flex flex-col gap-3 p-4 border-2 transition-all duration-300 ${
                      theme === 'default' ? 'border-cv-accent bg-cv-bg-secondary/80' : 'border-cv-border-subtle bg-cv-bg-secondary/40 hover:border-cv-accent/30'
                    }`}
                  >
                    <div className="w-full h-12 bg-gradient-to-br from-cv-accent-dark to-cv-accent-light" />
                    <span className="text-[10px] font-black text-white uppercase tracking-wider text-center">Cyber Purple</span>
                  </button>

                  <button 
                    onClick={() => setTheme('monochrome')}
                    className={`flex flex-col gap-3 p-4 border-2 transition-all duration-300 ${
                      theme === 'monochrome' ? 'border-cv-accent bg-cv-bg-secondary/80' : 'border-cv-border-subtle bg-cv-bg-secondary/40 hover:border-cv-accent/30'
                    }`}
                  >
                    <div className="w-full h-12 bg-gradient-to-br from-[#111] to-[#eee]" />
                    <span className="text-[10px] font-black text-white uppercase tracking-wider text-center">Monochrome Noir</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-cv-border-subtle/30">
                <span className="text-[10px] font-bold text-cv-text-muted uppercase tracking-widest">{t.language}</span>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setLanguage('de')}
                    className={`flex-1 py-3 border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      language === 'de' ? 'border-cv-accent text-white bg-cv-accent/10' : 'border-cv-border-subtle text-cv-text-muted hover:border-cv-accent/30'
                    }`}
                  >
                    Deutsch (DE)
                  </button>
                  <button 
                    onClick={() => setLanguage('en')}
                    className={`flex-1 py-3 border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      language === 'en' ? 'border-cv-accent text-white bg-cv-accent/10' : 'border-cv-border-subtle text-cv-text-muted hover:border-cv-accent/30'
                    }`}
                  >
                    English (EN)
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Watched Directories */}
          <section className="glass p-6 border-cv-border-subtle flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <FolderOpen size={18} className="text-cv-accent-light" />
              <h2 className="text-sm font-black text-white uppercase tracking-widest font-heading">{t.watchedPaths}</h2>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newDir}
                onChange={e => setNewDir(e.target.value)}
                placeholder={t.pathPlaceholder}
                className="flex-1 bg-cv-bg-secondary/40 border border-cv-border-subtle p-3 text-sm text-cv-text placeholder-cv-text-muted focus:outline-none focus:border-cv-accent transition-all"
              />
              <button 
                onClick={handleAddDir}
                disabled={!newDir.trim()}
                className="bg-cv-bg-secondary border border-cv-border-subtle text-cv-text-secondary px-4 py-2 font-bold text-xs uppercase tracking-wider hover:bg-cv-surface-hover transition-colors disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
              <button 
                onClick={handlePickDir}
                className="bg-cv-accent/10 border border-cv-accent/30 text-cv-accent-light px-4 py-2 font-bold text-xs uppercase tracking-wider hover:bg-cv-accent/30 transition-colors"
                title={t.addFolder}
              >
                {t.addFolder}
              </button>
              <button 
                onClick={async () => {
                   const { pickAndAddFile } = await import('../../lib/tauri');
                   const added = await pickAndAddFile();
                   if (added) loadDirs();
                }}
                className="bg-cv-info/10 border border-cv-info/30 text-cv-info px-4 py-2 font-bold text-xs uppercase tracking-wider hover:bg-cv-info/30 transition-colors"
                title={t.addFile}
              >
                {t.addFile}
              </button>
            </div>

            <div className="space-y-3">
              {watchedDirs.map((dir) => (
                <div
                  key={dir}
                  className="flex items-center justify-between gap-3 px-4 py-3 bg-cv-bg-secondary/40 border border-cv-border-subtle group hover:border-cv-accent/30 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FolderOpen size={14} className="text-cv-text-muted flex-shrink-0" />
                    <span className="text-xs text-cv-text-secondary font-mono truncate">{dir}</span>
                  </div>
                  <button 
                    onClick={() => handleRemoveDir(dir)}
                    className="text-cv-text-muted hover:text-cv-danger transition-colors opacity-0 group-hover:opacity-100 p-1 flex-shrink-0"
                    title="Remove"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* AI Center */}
          <section className="glass p-6 border-cv-border-bright shadow-lg shadow-cv-accent/5 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Brain size={18} className="text-cv-accent-light" />
              <h2 className="text-sm font-black text-white uppercase tracking-widest font-heading">{t.aiCenter}</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-cv-bg-secondary/40 border border-cv-border-subtle">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-cv-text-muted uppercase">{t.status}</span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-cv-success uppercase">
                    <div className="w-1.5 h-1.5 bg-cv-success animate-pulse" /> {t.online}
                  </span>
                </div>
                <div className="text-[11px] text-cv-text-secondary font-mono leading-relaxed">
                  Host: http://localhost:11434<br/>
                  Model: llama3.2 (3B)<br/>
                  Embed: nomic-embed-text
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={async () => {
                    setIsIndexing(true);
                    setIndexCount(null);
                    setIndexingStatus(null);
                    try {
                      const imported = await import('../../lib/tauri');
                      const count = await imported.indexFiles(true);
                      setIndexCount(count);
                      addToast(language === 'de' ? `Indexierung abgeschlossen: ${count} Dateien erfasst.` : `Indexing complete: ${count} files captured.`, 'success');
                    } catch (e) {
                      console.error(e);
                      setIndexCount(-1);
                      addToast(language === 'de' ? 'Fehler bei der Indexierung.' : 'Indexing failed.', 'error');
                    } finally {
                      setIsIndexing(false);
                      setIndexingStatus(null);
                    }
                  }}
                  disabled={isIndexing}
                  className={`w-full py-4 text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                    isIndexing 
                      ? 'bg-cv-surface-hover text-cv-text-muted border border-cv-border-subtle cursor-not-allowed' 
                      : 'bg-cv-accent text-white glow-accent hover:bg-cv-accent-light shadow-lg shadow-cv-accent/20'
                  }`}
                >
                  {isIndexing ? (
                    <span className="flex items-center justify-center gap-2">
                       <div className="w-3 h-3 border-2 border-cv-text-muted border-t-transparent animate-spin" />
                       {t.indexing} {indexingStatus ? `(${indexingStatus})` : '...'}
                    </span>
                  ) : t.fullReindex}
                </button>

                {isIndexing && (
                  <button
                    onClick={async () => {
                      const imported = await import('../../lib/tauri');
                      await imported.cancelIndexing();
                    }}
                    className="w-full py-2 bg-cv-danger/10 border border-cv-danger/30 text-cv-danger text-[9px] font-black uppercase tracking-widest hover:bg-cv-danger hover:text-white transition-all duration-300"
                  >
                    {t.cancel}
                  </button>
                )}
              </div>

              {indexCount !== null && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-[10px] font-bold text-cv-accent-light uppercase animate-pulse"
                >
                  {indexCount >= 0 
                    ? (language === 'de' ? `${indexCount} Dateien erfolgreich neu erfasst.` : `${indexCount} files successfully re-indexed.`)
                    : (language === 'de' ? 'Fehler beim Indexieren.' : 'Error during indexing.')}
                </motion.p>
              )}
            </div>
          </section>
        </div>

        {/* System Info Section */}
        <section className="glass p-6 border-cv-border-subtle relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cv-info/5 rounded-full blur-2xl transition-all group-hover:bg-cv-info/10" />
          <div className="flex items-center gap-2 mb-4">
            <Database size={18} className="text-cv-info" />
            <h2 className="text-sm font-black text-white uppercase tracking-widest font-heading">{t.databaseInfo}</h2>
          </div>
          <p className="text-xs text-cv-text-muted leading-relaxed max-w-2xl">
            {language === 'de' 
              ? 'ChronoVault nutzt eine hochoptimierte SQLite Datenbank mit Vektor-Extensions für die semantische Suche. Deine Daten bleiben zu 100% lokal und verschlüsselt auf diesem Gerät.'
              : 'ChronoVault utilizes a highly optimized SQLite database with vector extensions for semantic search. Your data remains 100% local and encrypted on this device.'}
          </p>
        </section>
      </div>
    </div>
  );
}
