import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ToastContainer } from './ToastContainer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cv-bg noise-bg">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 relative overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
