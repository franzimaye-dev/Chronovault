import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Sparkles, Zap, Database } from 'lucide-react';
import { useFileStore } from '../../stores/fileStore';
import { useUIStore } from '../../stores/uiStore';
import { getUserProgress } from '../../lib/tauri';
import { UserProgress } from '../../lib/types';

import { useTranslation } from '../../lib/i18n';

export function TopBar() {
  const { t } = useTranslation();
  const { search, aiSearch, clearSearch } = useFileStore();
  const { searchQuery, setSearchQuery, isAIMode, setAIMode } = useUIStore();
  const [inputValue, setInputValue] = useState(searchQuery);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [indexingStatus, setIndexingStatus] = useState<string | null>(null);
  const { clusters } = useFileStore();

  const hotFilesCount = useMemo(() => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    return clusters
      .flatMap(c => c.files)
      .filter(f => new Date(f.modified_at) > twoHoursAgo)
      .length;
  }, [clusters]);

  useEffect(() => {
    // Progress laden
    getUserProgress().then(setProgress).catch(console.error);
    
    // Indexierungs-Listener
    let unlisten: any;
    const setupListener = async () => {
      const { listen } = await import('@tauri-apps/api/event');
      unlisten = await listen<string>('indexing-progress', (event) => {
        setIndexingStatus(event.payload);
      });
    };
    setupListener();
    return () => { if (unlisten) unlisten(); };
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = inputValue.trim();
      setSearchQuery(q);
      if (q) {
        if (isAIMode) {
          aiSearch(q);
        } else {
          search(q);
        }
      }
    },
    [inputValue, search, aiSearch, isAIMode, setSearchQuery],
  );

  const handleClear = useCallback(() => {
    setInputValue('');
    setSearchQuery('');
    clearSearch();
  }, [clearSearch, setSearchQuery]);

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="glass-strong flex items-center gap-6 px-6 py-3 border-b border-cv-border-subtle z-50"
    >
      {/* ─── Vault Identity ────────────────────────────────────── */}
      <div className="hidden lg:flex items-center gap-4 border-r border-cv-border-subtle pr-6">
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-black text-cv-accent-light uppercase tracking-tighter leading-none">Level</span>
          <span className="text-xl font-black text-white leading-none font-heading">{progress?.level || 1}</span>
        </div>
        <div className="w-24 h-1.5 bg-cv-bg-secondary border border-cv-border-subtle relative overflow-hidden">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${(progress?.xp || 0) % 1000 / 10}%` }}
             className="absolute left-0 top-0 bottom-0 bg-cv-accent glow-accent"
           />
        </div>
      </div>

      {/* ─── Suchleiste ────────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="flex-1 relative group">
        <div className="relative flex items-center">
          <Search size={16} className={`absolute left-4 transition-colors duration-300 ${isAIMode ? 'text-cv-accent-light' : 'text-cv-text-muted group-focus-within:text-cv-accent'}`} />
          <input
            id="search-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isAIMode ? t.brainstorm : t.search}
            className={`
              w-full pl-12 pr-12 py-3
              bg-cv-bg-secondary/40 border transition-all duration-500
              text-cv-text text-sm placeholder-cv-text-muted/60 font-medium
              focus:outline-none focus:bg-cv-bg-secondary/80
              ${isAIMode 
                ? 'border-cv-accent/40 focus:border-cv-accent glow-accent shadow-2xl shadow-cv-accent/10'
                : 'border-cv-border focus:border-cv-accent/40 focus:ring-1 focus:ring-cv-accent/20'}
            `}
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 text-cv-text-muted hover:text-white transition-all duration-300 hover:rotate-90 hover:scale-110"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        <AnimatePresence>
          {indexingStatus && (
            <div className="flex flex-col items-end mr-6">
              <div className="flex items-center gap-1.5 grayscale opacity-50">
                 <Database size={12} className="text-cv-accent-light" />
                 <h4 className="text-[10px] font-black text-white uppercase tracking-widest">{t.vaultPulse}</h4>
              </div>
              {indexingStatus && (
                <div className="text-[11px] font-black text-cv-accent-light uppercase tracking-tighter truncate animate-pulse">
                  {t.indexing} {indexingStatus}
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </form>

      {/* ─── Status & Quick Actions ────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-cv-bg-secondary/20 border border-cv-border-subtle mr-2">
            <Zap size={12} className="text-cv-warning animate-pulse" />
            <span className="text-[10px] font-black text-cv-text-muted uppercase tracking-wider">{progress?.xp || 0} {t.xp}</span>
        </div>

        {hotFilesCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-cv-danger/10 border border-cv-danger/30 mr-2">
            <div className="w-1.5 h-1.5 bg-cv-danger rounded-full animate-ping" />
            <span className="text-[10px] font-black text-cv-danger uppercase tracking-widest">{hotFilesCount} {t.hotFiles}</span>
          </div>
        )}

        <button
          onClick={() => setAIMode(!isAIMode)}
          className={`
            flex items-center gap-2 px-4 py-2.5 text-xs font-bold font-heading
            transition-all duration-300 border uppercase tracking-wider
            ${isAIMode 
              ? 'bg-cv-accent/30 text-white border-cv-accent/50 glow-accent'
              : 'text-cv-text-secondary bg-cv-surface hover:bg-cv-surface-hover border-cv-border hover:border-cv-accent/30'}
          `}
          title="KI-Suche aktivieren/deaktivieren"
        >
          <Sparkles size={14} className={isAIMode ? 'animate-pulse text-cv-accent-light' : ''} />
          <span className="hidden sm:inline">KI-Suche</span>
        </button>
      </div>
    </motion.header>
  );
}
