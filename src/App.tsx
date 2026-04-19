// ChronoVault — Root Component
// View-Switching zwischen Timeline, Graph, Gamification, Settings.

import { useEffect } from 'react';
import { useUIStore } from './stores/uiStore';
import { useFileStore } from './stores/fileStore';
import { AppLayout } from './components/layout/AppLayout';
import { Timeline } from './components/timeline/Timeline';
import { GraphView } from './components/graph/GraphView';
import { GamificationView } from './components/placeholders/GamificationPlaceholder';
import { SettingsView } from './components/placeholders/SettingsPlaceholder';
import { ExplorerView } from './components/explorer/ExplorerView';

import { useSettingsStore } from './stores/settingsStore';
import { Onboarding } from './components/layout/Onboarding';

function App() {
  const activeView = useUIStore((s) => s.activeView);
  const theme = useFileStore((s) => s.theme);
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'monochrome') {
      root.classList.add('theme-monochrome');
    } else {
      root.classList.remove('theme-monochrome');
    }
  }, [theme]);

  const renderView = () => {
    switch (activeView) {
      case 'timeline':
        return <Timeline />;
      case 'graph':
        return <GraphView />;
      case 'explorer':
        return <ExplorerView />;
      case 'gamification':
        return <GamificationView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <Timeline />;
    }
  };

  return (
    <>
      {!onboardingComplete && <Onboarding />}
      <AppLayout>{renderView()}</AppLayout>
    </>
  );
}

export default App;
