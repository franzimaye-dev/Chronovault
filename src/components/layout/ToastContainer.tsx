import { useToastStore, ToastType } from '../../stores/toastStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react';

const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case 'success': return <CheckCircle size={18} className="text-cv-success" />;
    case 'error': return <AlertCircle size={18} className="text-cv-danger" />;
    case 'warning': return <AlertTriangle size={18} className="text-cv-warning" />;
    default: return <Info size={18} className="text-cv-info" />;
  }
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-8 right-8 z-[999] flex flex-col gap-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`
              flex items-center gap-4 px-6 py-5 min-w-[320px] max-w-md
              bg-cv-bg-secondary border-2 border-cv-border-bright shadow-[0_20px_50px_rgba(0,0,0,0.5)]
              relative overflow-hidden pointer-events-auto
            `}
          >
            {/* Accent Bar */}
            <div className={`
              absolute left-0 top-0 bottom-0 w-1.5
              ${toast.type === 'success' ? 'bg-cv-success' : 
                toast.type === 'error' ? 'bg-cv-danger' : 
                toast.type === 'warning' ? 'bg-cv-warning' : 'bg-cv-info'}
            `} />

            <ToastIcon type={toast.type} />
            
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-white leading-tight">
                {toast.message}
              </p>
            </div>

            <button 
              onClick={() => removeToast(toast.id)}
              className="text-cv-text-muted hover:text-white transition-colors p-1"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
