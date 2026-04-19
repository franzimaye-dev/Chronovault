// ChronoVault — Explorer View
// Klassische Ordnerstruktur (Windows Explorer Stil) mit Brutalist-Elementen.

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder, File as FileIcon, ArrowUpLeft,
  FileText, Image, Film, Music, Archive, Terminal,
  Code2, Table, Presentation, Link2, Trash2, Edit2, FolderSearch, Check, X
} from 'lucide-react';
import { confirm } from '@tauri-apps/plugin-dialog';
import { listDirectory, getWatchedDirectories, openFile, deleteFile, renameFile, showInExplorer } from '../../lib/tauri';
import { FileEntry, FileCategory } from '../../lib/types';
import { formatFileSize, formatTime } from '../../lib/utils';
import { useFileStore } from '../../stores/fileStore';
import { useUIStore } from '../../stores/uiStore';
import { useToastStore } from '../../stores/toastStore';

const categoryIcons: Record<FileCategory, React.ReactNode> = {
  document: <FileText size={16} />,
  image: <Image size={16} />,
  video: <Film size={16} />,
  audio: <Music size={16} />,
  archive: <Archive size={16} />,
  executable: <Terminal size={16} />,
  code: <Code2 size={16} />,
  spreadsheet: <Table size={16} />,
  presentation: <Presentation size={16} />,
  folder: <Folder size={16} />,
  shortcut: <Link2 size={16} />,
  other: <FileIcon size={16} />,
};

export function ExplorerView() {
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { searchQuery } = useUIStore();
  const { addToast } = useToastStore();
  const { searchResults, isSearching } = useFileStore();

  const loadDirectory = useCallback(async (path: string | null) => {
    if (searchQuery) return; // Überspringe normales Laden wenn Suche aktiv
    setIsLoading(true);
    try {
      if (!path) {
        const dirs = await getWatchedDirectories();
        const rootEntries: FileEntry[] = dirs.map(dir => {
          const name = dir.split(/[/\\]/).pop() || dir;
          return {
            name: name,
            path: dir,
            extension: '',
            size: 0,
            is_dir: true,
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString(),
            category: 'folder',
            relevance: undefined
          };
        });
        setFiles(rootEntries);
      } else {
        const entries = await listDirectory(path);
        entries.sort((a, b) => {
          if (a.is_dir && !b.is_dir) return -1;
          if (!a.is_dir && b.is_dir) return 1;
          return a.name.localeCompare(b.name);
        });
        setFiles(entries);
      }
    } catch (e) {
      console.error("Fehler beim Laden des Verzeichnisses:", e);
      addToast("Ordner konnte nicht geladen werden.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, addToast]);

  useEffect(() => {
    if (searchQuery) {
        setFiles(searchResults);
        setIsLoading(isSearching);
    } else {
        loadDirectory(currentPath);
    }
  }, [currentPath, loadDirectory, searchQuery, searchResults, isSearching]);

  const handleItemClick = (file: FileEntry) => {
    if (file.is_dir) {
      setCurrentPath(file.path);
    } else {
      openFile(file.path);
    }
  };

  const handleNavigateUp = () => {
    if (!currentPath) return;
    const separator = currentPath.includes('\\') ? '\\' : '/';
    const parts = currentPath.split(separator).filter(Boolean);
    if (parts.length <= 1) {
      setCurrentPath(null);
    } else {
      parts.pop();
      let parentPath = parts.join(separator);
      if (parentPath.length === 2 && parentPath.endsWith(':')) {
        parentPath += separator;
      } else if (currentPath.startsWith('/')) {
        parentPath = '/' + parentPath;
      }
      setCurrentPath(parentPath);
    }
  };


  return (
    <div className="flex-1 flex flex-col h-full bg-cv-bg overflow-hidden relative">
      
      {/* ─── Address Bar ────────────────────────────────────────── */}
      <div className="glass-strong border-b border-cv-border flex items-center px-4 py-3 gap-2 flex-shrink-0 z-10">
        <button
          onClick={handleNavigateUp}
          disabled={!currentPath}
          className={`p-2 transition-colors ${currentPath ? 'hover:bg-cv-surface-hover text-cv-text' : 'text-cv-text-muted opacity-50 cursor-not-allowed'}`}
          title="Eine Ebene nach oben"
        >
          <ArrowUpLeft size={18} />
        </button>
        
        <div className="flex-1 flex items-center overflow-x-auto select-none no-scrollbar bg-cv-bg-secondary border border-cv-border-subtle p-1 px-3 shadow-inner">
          <div className="flex items-center text-xs font-mono whitespace-nowrap gap-1">
            <button 
              onClick={() => setCurrentPath(null)}
              className="px-1.5 py-1 text-cv-accent hover:bg-cv-accent/10 transition-colors font-bold uppercase tracking-wider"
            >
              CHRONOVAULT
            </button>
            <span className="text-cv-text-muted">/</span>
            
            {currentPath && currentPath.split(/[/\\]/).filter(Boolean).map((part, index, array) => {
              const separator = currentPath.includes('\\') ? '\\' : '/';
              // Rekonstruiere den Pfad bis zu diesem Breadcrumb
              let fullPathToThisPoint = array.slice(0, index + 1).join(separator);
              
              // Windows-Laufwerk Fix: C: -> C:\
              if (index === 0 && part.endsWith(':')) {
                fullPathToThisPoint += separator;
              } else if (currentPath.startsWith(separator) && !fullPathToThisPoint.startsWith(separator)) {
                // UNIX absolute path Fix
                fullPathToThisPoint = separator + fullPathToThisPoint;
              }
              
              return (
                <div key={index} className="flex items-center gap-1">
                  <button 
                    onClick={() => setCurrentPath(fullPathToThisPoint)}
                    className="px-1.5 py-1 text-cv-text opacity-70 hover:opacity-100 hover:bg-cv-surface-hover transition-all tracking-tight font-medium"
                  >
                    {part}
                  </button>
                  {index < array.length - 1 && <span className="text-cv-text-muted opacity-40">/</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── File List Header ───────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4 px-6 py-2 border-b border-cv-border-subtle bg-cv-surface text-xs font-bold text-cv-text-muted uppercase tracking-wider flex-shrink-0">
        <div className="col-span-6 pl-2">Name</div>
        <div className="col-span-3 text-right">Zuletzt geändert</div>
        <div className="col-span-3 text-right pr-2">Größe</div>
      </div>

      {/* ─── File List Content ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
             <div className="w-8 h-8 border-2 border-cv-accent border-r-transparent animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex justify-center items-center h-48 text-cv-text-muted tracking-widest uppercase font-bold text-sm">
             / Leeres Verzeichnis /
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            <AnimatePresence initial={false}>
              {files.map((file, idx) => (
                <ExplorerItem 
                  key={file.path} 
                  file={file} 
                  idx={idx} 
                  onOpen={() => handleItemClick(file)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
    </div>
  );
}

// ─── Hilfskomponente für "Datei-DNA" (Unique Visual Signature) ───────────

function FileDNA({ name, size }: { name: string, size: number }) {
  // Generiere ein deterministisches Muster basierend auf Name/Größe
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), size);
  // Wir nutzen 9 Bits für ein 3x3 Grid
  const blocks = Array.from({ length: 9 }).map((_, i) => (hash >> i) % 2 === 0);
  
  return (
    <div className="grid grid-cols-3 gap-0.5 w-[14px] h-[14px] flex-shrink-0 opacity-20 group-hover:opacity-100 transition-opacity">
      {blocks.map((active, i) => (
        <div 
          key={i} 
          className={`w-[4px] h-[4px] ${active ? 'bg-cv-accent' : 'bg-transparent border-[0.5px] border-cv-border-subtle'}`} 
        />
      ))}
    </div>
  );
}

// ─── Hilfskomponente für einzelnes Explorer-Item ────────────────────────────

function ExplorerItem({ file: initialFile, idx, onOpen }: { file: FileEntry, idx: number, onOpen: () => void }) {
  const [file, setFile] = useState(initialFile);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(file.name);

  // Aktualisiere das State-File, wenn Props sich ändern
  useEffect(() => { setFile(initialFile); setEditName(initialFile.name); }, [initialFile]);

  if (isDeleted) return null;

  const handleShowInExplorer = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await showInExplorer(file.path);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm(`Möchtest du "${file.name}" wirklich unwiderruflich löschen?`, {
      title: 'Datei Löschen',
      kind: 'warning',
    });
    
    if (confirmed) {
      try {
        await deleteFile(file.path);
        setIsDeleted(true);
      } catch (err) {
        console.error("Fehler beim Löschen:", err);
      }
    }
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(file.name);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditName(file.name);
  };

  const handleSaveEdit = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!editName.trim() || editName === file.name) {
      setIsEditing(false);
      return;
    }

    try {
      const parentDir = file.path.substring(0, file.path.lastIndexOf('\\') + 1);
      const extStr = (!file.is_dir && file.extension) ? `.${file.extension}` : '';
      const newPath = `${parentDir}${editName}${extStr}`;
      
      await renameFile(file.path, newPath);
      setFile({ ...file, name: editName, path: newPath });
      setIsEditing(false);
    } catch (err) {
      console.error("Fehler beim Umbenennen:", err);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') handleCancelEdit(e as unknown as React.MouseEvent);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15, delay: Math.min(idx * 0.01, 0.2) }}
      onClick={() => { if (!isEditing) onOpen(); }}
      className="group grid grid-cols-12 gap-4 items-center px-4 py-2.5 border border-transparent hover:border-cv-border-bright hover:bg-cv-surface transition-all cursor-pointer relative"
    >
      <div className="col-span-6 flex items-center gap-3 min-w-0">
        <div className={`w-6 h-6 flex items-center justify-center flex-shrink-0 ${file.is_dir ? 'text-cv-accent' : 'text-cv-text-secondary group-hover:text-cv-text'} transition-colors`}>
          {file.is_dir ? <Folder size={18} fill="currentColor" fillOpacity={0.2} /> : (categoryIcons[file.category] || categoryIcons.other)}
        </div>

        {!file.is_dir && <FileDNA name={file.name} size={file.size} />}
        
        {isEditing ? (
          <div className="flex-1 flex items-center bg-cv-bg-tertiary px-2 border-b-2 border-cv-accent">
            <input 
              autoFocus
              type="text" 
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-sm font-semibold text-white tracking-wide outline-none py-0.5"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <span className={`truncate text-sm font-medium ${file.is_dir ? 'text-cv-text font-bold tracking-tight' : 'text-cv-text-secondary group-hover:text-white'}`}>
              {file.name}
            </span>
            {file.relevance !== undefined && file.relevance !== null && (
              <div className="flex-shrink-0 px-1.5 py-0.5 bg-cv-accent/20 border border-cv-accent/30 text-[8px] font-black text-cv-accent-light uppercase tracking-tighter">
                {Math.round(file.relevance * 100)}% Match
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Date fields / Action buttons switcher */}
      <div className="col-span-6 flex justify-end items-center">
        {/* Normal state info (hidden on hover/edit) */}
        <div className={`flex items-center gap-4 transition-opacity ${isEditing ? 'hidden' : 'group-hover:hidden'}`}>
          <div className="text-right text-xs text-cv-text-muted w-24 truncate">
            {file.is_dir ? '--' : formatTime(file.modified_at)}
          </div>
          <div className="text-right text-xs text-cv-text-muted w-16 pr-2">
            {file.is_dir ? '' : formatFileSize(file.size)}
          </div>
        </div>

        {/* Hover / Edit actions */}
        <div className={`flex items-center gap-1 transition-opacity ${isEditing ? 'opacity-100 flex' : 'hidden group-hover:flex'}`}>
          {isEditing ? (
            <>
              <button onClick={handleSaveEdit} className="p-1.5 bg-cv-success/20 text-cv-success hover:bg-cv-success/40 transition-colors" title="Speichern">
                <Check size={14} />
              </button>
              <button onClick={handleCancelEdit} className="p-1.5 bg-cv-danger/20 text-cv-danger hover:bg-cv-danger/40 transition-colors" title="Abbrechen">
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button onClick={handleShowInExplorer} className="p-1.5 text-cv-text-muted hover:text-white hover:bg-cv-surface-hover border border-cv-border-subtle transition-colors" title="Im Explorer öffnen">
                <FolderSearch size={14} />
              </button>
              <button onClick={handleStartEdit} className="p-1.5 text-cv-text-muted hover:text-white hover:bg-cv-surface-hover border border-cv-border-subtle transition-colors" title="Umbenennen">
                <Edit2 size={14} />
              </button>
              {/* Löschen nur für Dateien (Sicherheitsmaßnahme für den Anfang) */}
              {!file.is_dir && (
                <button onClick={handleDelete} className="p-1.5 text-cv-text-muted hover:text-cv-danger hover:bg-cv-danger/10 border border-cv-danger/10 transition-colors ml-1" title="Datei löschen">
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
