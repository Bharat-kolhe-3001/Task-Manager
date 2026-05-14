import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '../store/ui';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Zap, X } from 'lucide-react';

export default function QuickLaunch() {
  const { quickLaunchOpen, quickLaunchProjectId, closeQuickLaunch, openQuickLaunch } = useUIStore();
  const [value, setValue] = useState('');
  const [projects, setProjects] = useState([]);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef(null);
  const location = useLocation();

  // Get current project from URL if on project detail page
  const urlProjectId = location.pathname.match(/\/projects\/([^/]+)/)?.[1] || null;
  const effectiveProjectId = quickLaunchProjectId || urlProjectId;

  useEffect(() => {
    if (quickLaunchOpen) {
      setValue('');
      inputRef.current?.focus();
      // Load projects for @project picker
      api.get('/projects').then(r => setProjects(r.data.projects || [])).catch(() => {});
    }
  }, [quickLaunchOpen]);

  // Esc to close
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && quickLaunchOpen) closeQuickLaunch();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [quickLaunchOpen, closeQuickLaunch]);

  const parseInput = (text) => {
    // Support @ProjectName syntax
    const atMatch = text.match(/@([\w\s]+)/);
    let title = text.replace(/@[\w\s]+/, '').trim();
    let projectId = effectiveProjectId;

    if (atMatch) {
      const pName = atMatch[1].trim().toLowerCase();
      const found = projects.find(p => p.name.toLowerCase().includes(pName));
      if (found) projectId = found.id;
    }
    return { title, projectId };
  };

  const handleSubmit = async (e) => {
    if (e.type === 'keydown' && e.key !== 'Enter') return;
    const trimmed = value.trim();
    if (!trimmed) return;

    const { title, projectId } = parseInput(trimmed);
    if (!projectId) {
      toast.error('Pick a project: type @ProjectName or navigate to a project first');
      return;
    }

    setCreating(true);
    // Optimistic close
    closeQuickLaunch();
    setValue('');

    try {
      await api.post('/tasks', { title, projectId, status: 'TODO', priority: 'MEDIUM' });
      toast.success('🚀 Task launched!', { duration: 2000 });
      // Dispatch event so project detail can refresh
      window.dispatchEvent(new CustomEvent('orbit:task-created', { detail: { projectId } }));
    } catch (err) {
      toast.error('Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  if (!quickLaunchOpen) return null;

  const { projectId } = parseInput(value);
  const currentProject = projects.find(p => p.id === projectId);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
        onClick={closeQuickLaunch}
      />

      {/* Quick Launch Bar */}
      <div className="quick-launch animate-slide-up z-50">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: 'rgba(11,15,27,0.97)',
            border: '1px solid rgba(59,130,246,0.4)',
            boxShadow: '0 0 40px rgba(59,130,246,0.15), 0 20px 60px rgba(0,0,0,0.6)',
          }}
        >
          <Zap size={18} className="text-orbit-blue flex-shrink-0" />

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-transparent outline-none text-white placeholder-gray-500 text-base"
              placeholder={
                effectiveProjectId
                  ? `Task title... (Enter to launch)`
                  : `Task title... @ProjectName`
              }
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={handleSubmit}
              disabled={creating}
            />
          </div>

          {currentProject && (
            <span
              className="text-xs px-2 py-1 rounded-full flex-shrink-0"
              style={{ background: currentProject.color ? `${currentProject.color}20` : 'rgba(59,130,246,0.15)', color: currentProject.color || '#3b82f6', border: `1px solid ${currentProject.color || '#3b82f6'}30` }}
            >
              {currentProject.name}
            </span>
          )}

          <div className="flex items-center gap-1 flex-shrink-0">
            <kbd className="px-2 py-0.5 text-xs text-gray-500 bg-white/5 border border-white/10 rounded">
              Enter
            </kbd>
            <button onClick={closeQuickLaunch} className="text-gray-500 hover:text-white transition-colors ml-1">
              <X size={16} />
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-600 mt-2">
          Press <kbd className="px-1 bg-white/5 rounded text-gray-500">/</kbd> anywhere to open · <kbd className="px-1 bg-white/5 rounded text-gray-500">Esc</kbd> to close · Use <kbd className="px-1 bg-white/5 rounded text-gray-500">@ProjectName</kbd> to pick project
        </p>
      </div>
    </>
  );
}
