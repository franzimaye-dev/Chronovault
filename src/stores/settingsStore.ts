import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'de' | 'en';

interface SettingsState {
  language: Language;
  onboardingComplete: boolean;
  setLanguage: (lang: Language) => void;
  setOnboardingComplete: (complete: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'de',
      onboardingComplete: false,
      setLanguage: (language) => set({ language }),
      setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
    }),
    {
      name: 'chronovault-settings',
    }
  )
);
