// ChronoVault — Graph View Placeholder
// Wird in Phase 2 durch React Flow (@xyflow/react) ersetzt.

import { motion } from 'framer-motion';
import { Network, Sparkles } from 'lucide-react';

export function GraphPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="relative mb-8"
      >
        {/* Animierte Netzwerk-Illustration */}
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-cv-gradient-alt-start to-cv-gradient-alt-end flex items-center justify-center">
          <Network size={48} className="text-white" />
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -inset-4 rounded-3xl border border-dashed border-cv-accent/20"
        />
      </motion.div>

      <h2 className="text-2xl font-bold text-cv-text mb-3">Graph View</h2>
      <p className="text-sm text-cv-text-muted max-w-md mb-6 leading-relaxed">
        Visualisiere die Zusammenhänge zwischen deinen Dateien als interaktives Netzwerk.
        Dateien werden zu Knoten, Verbindungen entstehen durch gemeinsame Themen, Tags und Zeiträume.
      </p>

      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cv-accent/10 border border-cv-accent/20">
        <Sparkles size={14} className="text-cv-accent-light" />
        <span className="text-sm font-medium text-cv-accent-light">
          Kommt in Phase 2 mit React Flow
        </span>
      </div>
    </div>
  );
}
