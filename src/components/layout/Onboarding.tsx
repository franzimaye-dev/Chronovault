import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../../stores/settingsStore';
import { Shield, ArrowRight, Zap } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';

function LogoFallback() {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <Zap size={32} className="text-cv-accent-light" />;
  }

  return (
    <img 
      src="/branding/logo.svg" 
      alt="Logo" 
      className="w-16 h-16 object-contain"
      onError={() => setHasError(true)} 
    />
  );
}

export function Onboarding() {
  const { setLanguage, setOnboardingComplete } = useSettingsStore();
  const { t, language } = useTranslation();

  return (
    <div className="fixed inset-0 z-[100] bg-cv-bg overflow-hidden flex items-center justify-center p-6">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cv-accent blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cv-accent/50 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-strong p-12 max-w-2xl w-full border border-cv-border-bright shadow-2xl relative z-10 space-y-12"
      >
        <div className="space-y-4 text-center">
          <div className="flex justify-center mb-6">
            <LogoFallback />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cv-accent/20 border border-cv-accent/40 mb-2">
            <Shield size={12} className="text-cv-accent-light" />
            <span className="text-[9px] font-black text-cv-accent-light uppercase tracking-widest">Initialization Protocol 0.1</span>
          </div>
          <h1 className="text-5xl font-black text-white font-heading tracking-tighter uppercase leading-[0.8]">
             {t.welcome}
          </h1>
          <p className="text-cv-text-secondary text-sm max-w-md mx-auto leading-relaxed">
            {t.onboardingDesc}
            <br/>
            {t.onboardingLanguage}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <button 
            onClick={() => setLanguage('de')}
            className={`group p-8 border-2 transition-all duration-300 flex flex-col items-center gap-4 ${
              language === 'de' ? 'border-cv-accent bg-cv-accent/10' : 'border-cv-border-subtle bg-white/5 hover:border-cv-accent/40'
            }`}
          >
            <div className="w-12 h-12 bg-cv-bg-secondary border border-cv-border flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🇩🇪</div>
            <div className="text-center">
              <div className="text-xs font-black text-white uppercase tracking-widest">Deutsch</div>
              <div className="text-[10px] text-cv-text-muted uppercase">German</div>
            </div>
          </button>

          <button 
            onClick={() => setLanguage('en')}
            className={`group p-8 border-2 transition-all duration-300 flex flex-col items-center gap-4 ${
              language === 'en' ? 'border-cv-accent bg-cv-accent/10' : 'border-cv-border-subtle bg-white/5 hover:border-cv-accent/40'
            }`}
          >
            <div className="w-12 h-12 bg-cv-bg-secondary border border-cv-border flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🇺🇸</div>
            <div className="text-center">
              <div className="text-xs font-black text-white uppercase tracking-widest">English</div>
              <div className="text-[10px] text-cv-text-muted uppercase">Englisch</div>
            </div>
          </button>
        </div>

        <div className="pt-8 border-t border-cv-border-subtle/30 flex justify-center">
          <button 
            onClick={() => setOnboardingComplete(true)}
            className="px-12 py-4 bg-cv-accent text-white text-xs font-black uppercase tracking-[0.3em] glow-accent hover:bg-cv-accent-light transition-all flex items-center gap-3"
          >
            {t.continue} <ArrowRight size={16} />
          </button>
        </div>

        <div className="text-center">
           <p className="text-[9px] text-cv-text-muted/50 uppercase tracking-widest leading-none">
             Du kannst diese Auswahl jederzeit in den Einstellungen ändern.
           </p>
        </div>
      </motion.div>
    </div>
  );
}
