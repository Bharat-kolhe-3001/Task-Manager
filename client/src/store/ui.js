import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // Quick Launch bar (press "/" to open)
  quickLaunchOpen: false,
  quickLaunchProjectId: null,
  openQuickLaunch: (projectId = null) => set({ quickLaunchOpen: true, quickLaunchProjectId: projectId }),
  closeQuickLaunch: () => set({ quickLaunchOpen: false, quickLaunchProjectId: null }),

  // Slide-in panel (new project, members)
  slidePanel: null, // 'new-project' | 'members' | null
  slidePanelData: null,
  openSlidePanel: (panel, data = null) => set({ slidePanel: panel, slidePanelData: data }),
  closeSlidePanel: () => set({ slidePanel: null, slidePanelData: null }),

  // Active expanded task
  expandedTaskId: null,
  setExpandedTask: (id) => set({ expandedTaskId: id }),
  closeExpandedTask: () => set({ expandedTaskId: null }),
}));
