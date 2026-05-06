import { create } from 'zustand';

export type DeviceTier = 'high' | 'medium' | 'low';

interface GlobalState {
  currentPage: string;
  sidebarExpanded: boolean;
  deviceTier: DeviceTier;
  is3DReady: boolean;
  sceneTransitioning: boolean;
  
  setCurrentPage: (page: string) => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setDeviceTier: (tier: DeviceTier) => void;
  setIs3DReady: (ready: boolean) => void;
  setSceneTransitioning: (transitioning: boolean) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  currentPage: 'dashboard',
  sidebarExpanded: false,
  deviceTier: 'high',
  is3DReady: false,
  sceneTransitioning: false,
  
  setCurrentPage: (page) => set({ currentPage: page }),
  toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
  setDeviceTier: (tier) => set({ deviceTier: tier }),
  setIs3DReady: (ready) => set({ is3DReady: ready }),
  setSceneTransitioning: (transitioning) => set({ sceneTransitioning: transitioning }),
}));
