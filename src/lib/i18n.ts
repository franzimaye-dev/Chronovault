import { useSettingsStore } from '../stores/settingsStore';

export const translations = {
  de: {
    // General
    search: 'Suchen...',
    vault: 'Archiv',
    settings: 'Einstellungen',
    explore: 'Explorer',
    graph: 'Wissenskarte',
    timeline: 'Chronik',
    gamification: 'Fortschritt',
    cancel: 'Abbrechen',
    save: 'Speichern',
    delete: 'Löschen',
    loading: 'Lade...',

    // TopBar
    vaultPulse: 'Vault Pulse',
    hotFiles: 'Hot',
    indexing: 'Indexiere',
    level: 'LVL',
    xp: 'XP',

    // Sidebar
    recent: 'Zuletzt',
    categories: 'Kategorien',
    documents: 'Dokumente',
    images: 'Bilder',
    videos: 'Videos',
    code: 'Code',
    other: 'Andere',

    // Timeline
    today: 'Heute',
    yesterday: 'Gestern',
    lastWeek: 'Letzte Woche',
    older: 'Älter',

    // Graph
    neuralLink: 'Neural Link Engine',
    brainstorm: 'Brainstorming',
    analyze: 'Scan starten',
    sensitivity: 'Sensitivität',
    liveFilter: 'Live-Filter',
    match: 'Match',
    analyzing: 'Analysiere...',
    linking: 'Verknüpfe...',
    finalizing: 'Finalisiere...',

    // Settings
    systemSettings: 'System-Einstellungen',
    appearance: 'Design & Sprache',
    watchedPaths: 'Überwachte Pfade',
    aiCenter: 'KI-Zentrum',
    databaseInfo: 'Datenbank & Speicher',
    fullReindex: 'Full System Re-Index',
    theme: 'Erscheinungsbild',
    language: 'Sprache',
    status: 'Status',
    online: 'Online',
    pathPlaceholder: 'Manueller Pfad...',
    add: 'Hinzufügen',
    browse: 'Durchsuchen',

    // Onboarding
    welcome: 'Willkommen bei ChronoVault',
    onboardingDesc: 'Dein Archiv. Deine Intelligenz. Alles lokal und sicher.',
    onboardingLanguage: 'Bitte wähle deine bevorzugte Systemsprache.',
    continue: 'Fortfahren',
  },
  en: {
    // General
    search: 'Search...',
    vault: 'Vault',
    settings: 'Settings',
    explore: 'Explorer',
    graph: 'Knowledge Map',
    timeline: 'Timeline',
    gamification: 'Progress',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    loading: 'Loading...',

    // TopBar
    vaultPulse: 'Vault Pulse',
    hotFiles: 'Hot',
    indexing: 'Indexing',
    level: 'LVL',
    xp: 'XP',

    // Sidebar
    recent: 'Recent',
    categories: 'Categories',
    documents: 'Documents',
    images: 'Images',
    videos: 'Videos',
    code: 'Code',
    other: 'Other',

    // Timeline
    today: 'Today',
    yesterday: 'Yesterday',
    lastWeek: 'Last Week',
    older: 'Older',

    // Graph
    neuralLink: 'Neural Link Engine',
    brainstorm: 'Brainstorming',
    analyze: 'Start Scan',
    sensitivity: 'Sensitivity',
    liveFilter: 'Live-Filter',
    match: 'Match',
    analyzing: 'Analyzing...',
    linking: 'Linking...',
    finalizing: 'Finalizing...',

    // Settings
    systemSettings: 'System Settings',
    appearance: 'Appearance & Language',
    watchedPaths: 'Watched Paths',
    aiCenter: 'AI Center',
    databaseInfo: 'Database & Storage',
    fullReindex: 'Full System Re-Index',
    theme: 'Appearance',
    language: 'Language',
    status: 'Status',
    online: 'Online',
    pathPlaceholder: 'Manual path...',
    add: 'Add',
    browse: 'Browse',

    // Onboarding
    welcome: 'Welcome to ChronoVault',
    onboardingDesc: 'Your archive. Your intelligence. All local and secure.',
    onboardingLanguage: 'Please select your preferred system language.',
    continue: 'Continue',
  }
};

export function useTranslation() {
  const { language } = useSettingsStore();
  const t = translations[language as keyof typeof translations];
  return { t, language };
}
