// ChronoVault — Timeline Cluster
// Gruppierung von Dateien nach Zeitraum (z.B. "Heute", "Gestern").

import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import type { TimelineCluster as TimelineClusterType } from '../../lib/types';
import { TimelineItem } from './TimelineItem';

interface TimelineClusterProps {
  cluster: TimelineClusterType;
  clusterIndex: number;
}

export function TimelineCluster({ cluster, clusterIndex }: TimelineClusterProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: clusterIndex * 0.1 }}
      className="relative z-10 pl-12 pb-8"
    >
      {/* ─── Cluster-Header ──────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6 sticky top-0 z-20 py-2">
        <h2 className="text-xl font-bold text-cv-text font-heading tracking-tight drop-shadow-sm">
          {cluster.label}
        </h2>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-cv-bg-tertiary/50 border border-cv-border-subtle text-[10px] font-bold text-cv-text-muted uppercase tracking-widest">
          <Calendar size={10} className="text-cv-accent-light" />
          <span>{cluster.files.length} Datei{cluster.files.length !== 1 ? 'en' : ''}</span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-cv-border-bright to-transparent opacity-30" />
      </div>

      {/* ─── Dateien ─────────────────────────────────────── */}
      <div className="space-y-2">
        {cluster.files.map((file, i) => (
          <TimelineItem key={file.path} file={file} index={i} />
        ))}
      </div>
    </motion.section>
  );
}
