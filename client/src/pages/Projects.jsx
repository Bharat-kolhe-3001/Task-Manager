import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users, LayoutList, X, ChevronRight, Globe } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth';
import { useUIStore } from '../store/ui';
import { SkeletonCard } from '../components/Skeleton';
import { EmptyOrbit } from '../components/EmptyState';
import ProgressRing from '../components/ProgressRing';

const PLANET_COLORS = [
  '#3b82f6', '#7c3aed', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316',
];

const COLOR_OPTIONS = [
  '#3b82f6', '#7c3aed', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#8b5cf6',
];

function ProjectCard({ project, idx }) {
  const color = project.color || PLANET_COLORS[idx % PLANET_COLORS.length];
  const tasks = project.tasks || [];
  const taskCount = project._count?.tasks ?? tasks.length;
  const done = tasks.filter(t => t.status === 'DONE').length;
  const percent = taskCount > 0 && tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
  const memberCount = project.members?.length || 0;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="glass-card p-5 flex flex-col gap-4 group relative overflow-hidden"
    >
      {/* Color accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ background: color, boxShadow: `0 0 12px ${color}60` }}
      />

      <div className="pl-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-heading font-bold text-lg flex-shrink-0"
              style={{ background: `${color}20`, border: `1px solid ${color}30` }}
            >
              {project.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-heading font-semibold text-white group-hover:text-orbit-blue transition-colors leading-tight">
                {project.name}
              </h3>
              {project.dueDate && (
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Due {new Date(project.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className="relative flex-shrink-0">
            <ProgressRing percent={percent} size={48} color={color} strokeWidth={3.5} />
            <span
              className="absolute inset-0 flex items-center justify-center text-[11px] font-bold"
              style={{ color }}
            >
              {percent}%
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[2.5rem]">
          {project.description || 'No description provided.'}
        </p>

        {/* Footer stats */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <LayoutList size={13} />
              {taskCount} task{taskCount !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Users size={13} />
              {memberCount} member{memberCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex -space-x-2">
            {project.members?.slice(0, 3).map((m, mi) => (
              <div
                key={m.id || mi}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-space-800"
                style={{ background: PLANET_COLORS[(m.user?.name?.charCodeAt(0) || mi) % PLANET_COLORS.length] }}
                title={m.user?.name}
              >
                {m.user?.name?.charAt(0) || '?'}
              </div>
            ))}
            {(project.members?.length || 0) > 3 && (
              <div className="w-6 h-6 rounded-full bg-space-700 border-2 border-space-800 flex items-center justify-center text-[9px] text-gray-400">
                +{project.members.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function NewProjectPanel({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', color: COLOR_OPTIONS[0] });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Project name is required'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/projects', form);
      toast.success(`🌍 Planet "${form.name}" launched!`);
      onCreated(data.project);
      onClose();
    } catch {
      toast.error('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-30 bg-black/40" onClick={onClose} />

      {/* Slide Panel */}
      <div className="slide-panel z-40">
        <div className="flex items-center justify-between p-5 border-b border-white/06">
          <div>
            <h2 className="font-heading font-bold text-lg">New Planet</h2>
            <p className="text-xs text-gray-500 mt-0.5">Create a new project for your team</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Planet Name *</label>
            <input
              autoFocus
              type="text"
              className="orbit-input"
              placeholder="e.g. Alpha Mission, Q2 Launch..."
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Description</label>
            <textarea
              className="orbit-input resize-none"
              rows={3}
              placeholder="What is this project about?"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Planet Color</label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="w-8 h-8 rounded-full transition-all duration-150"
                  style={{
                    background: c,
                    boxShadow: form.color === c ? `0 0 0 3px rgba(255,255,255,0.3), 0 0 12px ${c}60` : 'none',
                    transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          {form.name && (
            <div
              className="rounded-xl p-4 animate-fade-in"
              style={{ background: `${form.color}08`, border: `1px solid ${form.color}25` }}
            >
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Preview</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-bold text-white"
                  style={{ background: `${form.color}25` }}
                >
                  {form.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-heading font-semibold text-white">{form.name}</p>
                  <p className="text-xs text-gray-500">{form.description || 'No description'}</p>
                </div>
              </div>
            </div>
          )}
        </form>

        <div className="p-5 border-t border-white/06 flex gap-3">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !form.name.trim()}
            className="btn-primary flex-1"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Launching...
              </span>
            ) : (
              <>🚀 Launch Planet</>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';

  const fetchProjects = useCallback(async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.projects || []);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // Refresh on task created via quick launch
  useEffect(() => {
    const handler = () => fetchProjects();
    window.addEventListener('orbit:task-created', handler);
    return () => window.removeEventListener('orbit:task-created', handler);
  }, [fetchProjects]);

  const handleCreated = (project) => {
    setProjects(prev => [project, ...prev]);
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gradient-space">Planets</h1>
          <p className="text-gray-500 text-sm mt-1">
            {projects.length} project{projects.length !== 1 ? 's' : ''} in orbit
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(isAdmin || true) && (
            <button
              id="new-project-btn"
              onClick={() => setShowPanel(true)}
              className="btn-primary gap-2"
            >
              <Plus size={16} />
              New Planet
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          className="orbit-input pl-10"
          placeholder="Search planets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} lines={2} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyOrbit
          title={search ? `No planets match "${search}"` : 'No planets yet'}
          subtitle={search ? 'Try a different search term' : 'Launch your first planet to get started!'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p, i) => (
            <ProjectCard key={p.id} project={p} idx={i} />
          ))}
        </div>
      )}

      {/* Slide Panel */}
      {showPanel && (
        <NewProjectPanel
          onClose={() => setShowPanel(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
