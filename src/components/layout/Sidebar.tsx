// ChronoVault — Sidebar
// Glassmorphism-Navigation mit Icons und View-Switching (Scharfe Ecken).

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Network,
  Trophy,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  Folder
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import type { ViewType } from '../../lib/types';
import { useTranslation } from '../../lib/i18n';

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

function LogoFallback() {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <Zap size={18} className="text-white" />;
  }

  return (
    <img 
      src="/branding/logo.svg" 
      alt="Logo" 
      className="w-full h-full object-contain"
      onError={() => setHasError(true)} 
    />
  );
}

export function Sidebar() {
  const { t } = useTranslation();
  const { activeView, setActiveView, sidebarCollapsed, toggleSidebar } = useUIStore();

  const navItems: NavItem[] = [
    { id: 'explorer', label: t.explore, icon: <Folder size={20} /> },
    { id: 'timeline', label: t.timeline, icon: <Clock size={20} /> },
    { id: 'graph', label: t.graph, icon: <Network size={20} /> },
    { id: 'gamification', label: t.gamification, icon: <Trophy size={20} /> },
    { id: 'settings', label: t.settings, icon: <Settings size={20} /> },
  ];

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        glass-strong flex flex-col h-full
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-[68px]' : 'w-[220px]'}
      `}
    >
      {/* ─── Logo ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-cv-border-subtle">
        <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-cv-gradient-start to-cv-gradient-end flex-shrink-0 overflow-hidden">
          <LogoFallback />
        </div>
        {!sidebarCollapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-extrabold text-lg tracking-tight gradient-text font-heading"
          >
            ChronoVault
          </motion.span>
        )}
      </div>

      {/* ─── Navigation ────────────────────────────────────────── */}
      <nav className="flex-1 py-6 px-3 space-y-2">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.04)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveView(item.id)}
              className={`
                group relative w-full flex items-center gap-3 px-3 py-3
                transition-all duration-200 cursor-pointer
                ${isActive
                  ? 'bg-cv-accent/15 text-white shadow-[inset_0_0_15px_rgba(139,92,246,0.1)]'
                  : 'text-cv-text-secondary hover:text-white'
                }
              `}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 top-0 bottom-0 w-[3px] bg-cv-accent glow-accent"
                />
              )}
              <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-cv-accent-light' : 'group-hover:text-white'}`}>
                {item.icon}
              </span>
              {!sidebarCollapsed && (
                <>
                  <span className="text-sm font-semibold font-heading tracking-wide">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-[9px] font-bold px-2 py-0.5 bg-cv-accent/30 text-cv-accent-light uppercase tracking-tighter">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* ─── Collapse Toggle ───────────────────────────────────── */}
      <div className="px-2 py-3 border-t border-cv-border-subtle">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 text-cv-text-muted hover:text-cv-text hover:bg-cv-surface-hover transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  );
}
