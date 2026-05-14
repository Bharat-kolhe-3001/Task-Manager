import { Outlet } from 'react-router-dom';
import { useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import QuickLaunch from './QuickLaunch';
import { useUIStore } from '../store/ui';
import { Moon, Sun } from 'lucide-react';

export default function Layout() {
  const { openQuickLaunch, quickLaunchOpen, theme, toggleTheme } = useUIStore();

  const handleKeyDown = useCallback((e) => {
    // Press "/" to open quick launch (not when typing in inputs)
    if (
      e.key === '/' &&
      !quickLaunchOpen &&
      !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)
    ) {
      e.preventDefault();
      openQuickLaunch();
    }
  }, [openQuickLaunch, quickLaunchOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex h-screen overflow-hidden bg-space-900">
      <Sidebar />

      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className="min-h-full p-6">
          <Outlet />
        </div>
      </main>

      <QuickLaunch />
    </div>
  );
}
