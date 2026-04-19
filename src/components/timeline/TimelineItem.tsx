// ChronoVault — Timeline Item
// Einzelne Datei-Karte in der Timeline mit Icon, Metadaten und Hover-Effekt (Scharfe Ecken).

import { useState } from 'react';
import { motion } from 'framer-motion';
import { confirm } from '@tauri-apps/plugin-dialog';
import {
  FileText, Image, Film, Music, Archive, Terminal,
  Code2, Table, Presentation, Folder, Link2, File,
  ExternalLink, Trash2, Edit2, FolderSearch, Check, X
} from 'lucide-react';
import type { FileCategory, FileEntry } from '../../lib/types';
import { formatFileSize, formatTime, getCategoryClass, getCategoryLabel } from '../../lib/utils';
import { openFile, deleteFile, renameFile, showInExplorer } from '../../lib/tauri';

interface TimelineItemProps {
  file: FileEntry;
  index: number;
}

/** Icon-Map für Datei-Kategorien */
const categoryIcons: Record<FileCategory, React.ReactNode> = {
  document: <FileText size={18} />,
  image: <Image size={18} />,
  video: <Film size={18} />,
  audio: <Music size={18} />,
  archive: <Archive size={18} />,
  executable: <Terminal size={18} />,
  code: <Code2 size={18} />,
  spreadsheet: <Table size={18} />,
  presentation: <Presentation size={18} />,
  folder: <Folder size={18} />,
  shortcut: <Link2 size={18} />,
  other: <File size={18} />,
};

export function TimelineItem({ file, index }: TimelineItemProps) {
  const catClass = getCategoryClass(file.category);
  const icon = categoryIcons[file.category] || categoryIcons.other;

  const [isDeleted, setIsDeleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(file.name);
  const [currentName, setCurrentName] = useState(file.name);

  // Verhindern vom Klicken auf die Item-Karte, wenn wir editieren
  const handleItemClick = () => {
    if (isEditing) return;
    openFile(file.path);
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    openFile(file.path);
  };

  const handleShowInExplorer = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await showInExplorer(file.path);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm(`Möchtest du "${currentName}" wirklich unwiderruflich löschen?`, {
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
    setEditName(currentName);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditName(currentName);
  };

  const handleSaveEdit = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!editName.trim() || editName === currentName) {
      setIsEditing(false);
      return;
    }

    try {
      // Konstruiere den neuen absoluten Pfad basierend auf dem alten Pfad
      const parentDir = file.path.substring(0, file.path.lastIndexOf('\\') + 1);
      const extStr = file.extension ? `.${file.extension}` : '';
      const newPath = `${parentDir}${editName}${extStr}`;
      
      await renameFile(file.path, newPath);
      setCurrentName(editName);
      file.path = newPath; // Lokales state update als fallback
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

  if (isDeleted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      whileHover={{ scale: isEditing ? 1 : 1.01, x: isEditing ? 0 : 4 }}
      onClick={handleItemClick}
      className={`
        group relative flex items-center gap-4 px-5 py-4
        glass border border-cv-border-subtle
        hover:border-cv-border-bright transition-all duration-300 cursor-pointer
        glow-hover ${catClass}
      `}
    >
      {/* ─── Datei-Icon ──────────────────────────────────── */}
      <div
        className="flex items-center justify-center w-11 h-11 flex-shrink-0 transition-all duration-300 group-hover:scale-110"
        style={{ 
          backgroundColor: 'var(--cat-color, #636e72)' + '25',
          color: 'var(--cat-color, #636e72)',
          boxShadow: '0 8px 16px -4px var(--cat-color, transparent)',
        }}
      >
        {icon}
      </div>

      {/* ─── Datei-Info ──────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex-1 flex items-center gap-2 bg-cv-bg-tertiary px-2 border-b-2 border-cv-accent">
              <input 
                autoFocus
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-transparent text-[15px] font-semibold text-white font-heading tracking-wide outline-none py-1"
              />
            </div>
          ) : (
            <span className="text-[15px] font-semibold text-cv-text truncate font-heading tracking-wide">
              {currentName}
            </span>
          )}
          
          {!isEditing && file.relevance !== undefined && file.relevance !== null && (
            <div className="flex-shrink-0 px-2 py-0.5 bg-cv-accent/20 border border-cv-accent/30 text-[9px] font-black text-cv-accent-light uppercase tracking-widest shadow-[0_0_10px_rgba(139,92,246,0.2)]">
               {Math.round(file.relevance * 100)}% Relevance
            </div>
          )}

          {!isEditing && file.extension && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-cv-bg-tertiary text-cv-text-muted flex-shrink-0">
              .{file.extension}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-cv-text-muted">
            {getCategoryLabel(file.category)}
          </span>
          <span className="text-xs text-cv-text-muted">
            {formatFileSize(file.size)}
          </span>
          <span className="text-xs text-cv-text-muted">
            {formatTime(file.modified_at)}
          </span>
        </div>
      </div>

      {/* ─── Hover-Aktionen ──────────────────────────────── */}
      <div className={`flex items-center gap-2 transition-opacity ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {isEditing ? (
          <>
            <button onClick={handleSaveEdit} className="p-2 bg-cv-success/20 text-cv-success hover:bg-cv-success/40 transition-colors" title="Speichern">
              <Check size={14} />
            </button>
            <button onClick={handleCancelEdit} className="p-2 bg-cv-danger/20 text-cv-danger hover:bg-cv-danger/40 transition-colors" title="Abbrechen">
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <button onClick={handleShowInExplorer} className="p-2 bg-cv-bg-secondary text-cv-text-secondary hover:text-white hover:bg-cv-surface-hover border border-cv-border-subtle transition-colors" title="Im Explorer öffnen">
              <FolderSearch size={14} />
            </button>
            <button onClick={handleStartEdit} className="p-2 bg-cv-bg-secondary text-cv-text-secondary hover:text-white hover:bg-cv-surface-hover border border-cv-border-subtle transition-colors" title="Umbenennen">
              <Edit2 size={14} />
            </button>
            <button onClick={handleOpen} className="p-2 bg-cv-accent/20 text-cv-accent-light hover:bg-cv-accent/40 border border-cv-accent/10 transition-colors" title="Datei öffnen">
              <ExternalLink size={14} />
            </button>
            <div className="w-px h-6 bg-cv-border-subtle mx-1" />
            <button onClick={handleDelete} className="p-2 bg-cv-danger/10 text-cv-danger hover:bg-cv-danger/30 hover:text-red-400 border border-cv-danger/20 transition-colors" title="Datei löschen">
              <Trash2 size={14} />
            </button>
          </>
        )}
        
        {!isEditing && (
          <div
            className="w-2 h-2 flex-shrink-0 ml-1"
            style={{ backgroundColor: 'var(--cat-color, #636e72)' }}
          />
        )}
      </div>
    </motion.div>
  );
}
