// ChronoVault — UI Store (Zustand)
// State für UI-Zustand: aktive View, Sidebar, etc.

import { create } from 'zustand';
import type { ViewType } from '../lib/types';

interface UIState {
  activeView: ViewType;
  sidebarCollapsed: boolean;
  searchQuery: string;
  isAIMode: boolean;
  setActiveView: (view: ViewType) => void;
  toggleSidebar: () => void;
  setSearchQuery: (query: string) => void;
  setAIMode: (mode: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeView: 'explorer',
  sidebarCollapsed: false,
  searchQuery: '',
  isAIMode: false,

  setActiveView: (view) => set({ activeView: view }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setAIMode: (mode) => set({ isAIMode: mode }),
}));
