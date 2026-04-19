// ChronoVault — Gamification Hub
// Fortschrittsanzeige, Achievements und Statistiken mit Brutalist-UI (Scharfe Ecken).

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap, Brain, FileText, Activity } from 'lucide-react';
import { getUserProgress, getAchievements } from '../../lib/tauri';
import { UserProgress, Achievement } from '../../lib/types';

export function GamificationView() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [p, a] = await Promise.all([
          getUserProgress(),
          getAchievements()
        ]);
        setProgress(p);
        setAchievements(a);
      } catch (e) {
        console.error('Gamification Daten laden fehlgeschlagen:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cv-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  const xpProgress = progress ? (progress.xp % 1000) / 10 : 0;
  const currentLevelXP = progress ? progress.xp % 1000 : 0;

  return (
    <div className="flex-1 overflow-y-auto p-8 relative">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* ─── Hero Progress Section ────────────────────────── */}
        <section className="relative glass border-cv-border-bright overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cv-accent/20 blur-[120px] -mr-48 -mt-48 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cv-info/10 blur-[100px] -ml-32 -mb-32" />
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-12 relative z-10 p-10">
            <motion.div
              initial={{ rotate: -15, scale: 0.8, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex-shrink-0"
            >
              <div className="w-44 h-44 bg-cv-bg-tertiary flex items-center justify-center relative group border-2 border-cv-warning/30">
                <div className="absolute inset-0 bg-gradient-to-br from-cv-warning/20 to-cv-accent/20 opacity-40 group-hover:opacity-60 transition-opacity" />
                <Trophy size={84} className="text-cv-warning drop-shadow-[0_0_20px_rgba(245,158,11,0.5)] z-10" />
                <div className="absolute -bottom-3 -right-3 bg-cv-warning text-black px-5 py-2 font-black text-xl font-heading shadow-xl z-20">
                  {progress?.level}
                </div>
              </div>
            </motion.div>

            <div className="flex-1 space-y-8 text-center md:text-left">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-block px-4 py-1.5 bg-cv-accent/30 border border-cv-accent/40 text-[11px] font-black text-cv-accent-light uppercase tracking-[0.25em] mb-4"
                >
                  Identität: Verifiziert
                </motion.div>
                <h1 className="text-6xl font-black text-white font-heading tracking-tighter mb-2 uppercase italic leading-none">
                  {progress?.title || 'ANFÄNGER'}
                </h1>
                <p className="text-cv-text-secondary text-sm font-medium tracking-wide">
                  Level {progress?.level} • {progress?.xp} Gesamte XP gesammelt
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end px-1">
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-cv-text-muted">Nächster Meilenstein</span>
                    <span className="text-white font-black text-2xl font-mono tracking-tighter">
                      {1000 - currentLevelXP} <span className="text-xs text-cv-text-muted font-heading uppercase tracking-widest">XP bis Level {progress ? progress.level + 1 : '?'}</span>
                    </span>
                  </div>
                </div>
                
                <div className="h-4 w-full bg-cv-bg-secondary border border-cv-border-subtle relative shadow-inner overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full bg-cv-accent relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[xp-shimmer_2s_infinite]" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Stats Grid ───────────────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: 'KI ANALYSEN', val: progress?.total_ai_actions || 0, icon: Brain, col: 'text-cv-accent-light' },
            { label: 'DATEIEN ERFASST', val: progress?.total_files_analyzed || 0, icon: FileText, col: 'text-cv-info' },
            { label: 'AKTIVITÄT', val: `${progress?.streak_days || 0} TAGE`, icon: Activity, col: 'text-cv-success' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 border-cv-border-subtle hover:border-cv-border-bright transition-all"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className={`p-3 bg-cv-bg-tertiary ${stat.col} border border-cv-border-subtle group-hover:scale-110 transition-transform`}>
                  <stat.icon size={20} />
                </div>
                <div className="text-2xl font-black text-white font-heading">{stat.val}</div>
                <div className="text-[10px] font-bold text-cv-text-muted uppercase tracking-widest">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </section>

        {/* ─── Achievements ─────────────────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-white font-heading uppercase tracking-tight">Achievements</h2>
            <div className="text-[10px] font-bold text-cv-text-muted uppercase tracking-widest">
              {achievements.filter(a => a.unlocked_at).length} / {achievements.length} ENTRIEGELT
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievements.map((ach, i) => (
              <motion.div 
                key={ach.id} 
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`tilt-card glass p-6 border group transition-all duration-500 ${
                  ach.unlocked_at 
                    ? 'border-cv-warning/40 bg-cv-warning/5 grayscale-0' 
                    : 'border-cv-border-subtle opacity-40 grayscale pointer-events-none'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                    ach.unlocked_at 
                      ? 'bg-cv-warning/20 text-cv-warning rotate-12 group-hover:rotate-0 shadow-lg shadow-cv-warning/10' 
                      : 'bg-cv-bg-tertiary text-cv-text-muted'
                  }`}>
                    <Star size={32} className={ach.unlocked_at ? 'fill-cv-warning' : ''} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-black text-sm text-white uppercase tracking-wide truncate group-hover:text-cv-warning transition-colors">{ach.name}</h4>
                    <p className="text-[10px] text-cv-text-muted line-clamp-2 leading-relaxed font-medium">{ach.description}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <Zap size={10} className="text-cv-warning" />
                      <span className="text-[9px] font-black text-cv-warning uppercase tracking-widest">+{ach.xp_reward} XP</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
