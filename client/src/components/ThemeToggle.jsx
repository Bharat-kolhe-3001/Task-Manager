import { Moon, Sun } from 'lucide-react';
import { useUIStore } from '../store/ui';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useUIStore();
  
  return (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="p-2.5 rounded-full btn-ghost border-0 flex-shrink-0"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
