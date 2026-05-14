import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare, Filter, Calendar, Flag,
  CheckCircle2, Circle, ChevronDown, ChevronUp,
  X, ArrowUpDown,
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { SkeletonBlock } from '../components/Skeleton';
import { EmptyPlanet } from '../components/EmptyState';

const PRIORITY_MAP = {
  CRITICAL: { cls: 'badge-critical', label: 'Critical', order: 0 },
  HIGH: { cls: 'badge-high', label: 'High', order: 1 },
  MEDIUM: { cls: 'badge-medium', label: 'Medium', order: 2 },
  LOW: { cls: 'badge-low', label: 'Low', order: 3 },
};

const STATUS_LABELS = {
  TODO: 'Floating',
  IN_PROGRESS: 'In Motion',
  IN_REVIEW: 'Review',
  DONE: 'Landed',
};

const PLANET_COLORS = [
  '#3b82f6', '#7c3aed', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#8b5cf6',
];

function TaskRow({ task, projectColor, onComplete }) {
  const [completing, setCompleting] = useState(false);
  const isDone = task.status === 'DONE';
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isDone;
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate)) && !isDone;

  const prio = PRIORITY_MAP[task.priority] || PRIORITY_MAP.MEDIUM;

  const handleComplete = async (e) => {
    e.stopPropagation();
    if (isDone) return;
    setCompleting(true);
    onComplete(task.id); // optimistic
    try {
      await api.patch(`/tasks/${task.id}/status`, { status: 'DONE' });
      toast.success('✅ Task landed!', { duration: 1500 });
    } catch {
      toast.error('Failed to update task');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        isDone ? 'opacity-50' : 'hover:bg-white/3'
      } ${isOverdue ? 'bg-orbit-red/3' : ''}`}
    >
      {/* Checkbox */}
      <button
        onClick={handleComplete}
        disabled={completing || isDone}
        className="flex-shrink-0 transition-all duration-200"
        title={isDone ? 'Already landed' : 'Mark as done'}
      >
        {isDone ? (
          <CheckCircle2 size={18} className="text-orbit-green" />
        ) : (
          <Circle
            size={18}
            className={`${completing ? 'text-orbit-green animate-pulse' : 'text-gray-600 group-hover:text-gray-400'} transition-colors`}
          />
        )}
      </button>

      {/* Task title */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isDone ? 'line-through text-gray-500' : 'text-gray-200'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-gray-600 truncate mt-0.5">{task.description}</p>
        )}
      </div>

      {/* Project badge */}
      {task.project && (
        <Link
          to={`/projects/${task.project.id}`}
          className="flex-shrink-0 text-[11px] px-2 py-1 rounded-full font-medium truncate max-w-[100px] hover:opacity-80 transition-opacity"
          style={{
            background: `${projectColor}18`,
            color: projectColor,
            border: `1px solid ${projectColor}25`,
          }}
          title={task.project.name}
        >
          {task.project.name}
        </Link>
      )}

      {/* Priority */}
      <span className={`badge ${prio.cls} flex-shrink-0 hidden sm:flex`}>
        {prio.label}
      </span>

      {/* Due date */}
      <span
        className={`text-xs flex items-center gap-1 flex-shrink-0 hidden md:flex ${
          isOverdue ? 'text-orbit-red font-semibold' :
          isDueToday ? 'text-orbit-amber' :
          'text-gray-500'
        }`}
      >
        <Calendar size={12} />
        {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : '—'}
      </span>

      {/* Status */}
      <span className="text-[11px] text-gray-500 flex-shrink-0 hidden lg:block">
        {STATUS_LABELS[task.status] || task.status}
      </span>
    </div>
  );
}

function ProjectGroup({ project, tasks, idx, onComplete }) {
  const [collapsed, setCollapsed] = useState(false);
  const color = project.color || PLANET_COLORS[idx % PLANET_COLORS.length];
  const doneCt = tasks.filter(t => t.status === 'DONE').length;

  return (
    <div className="glass-card overflow-hidden">
      {/* Group header */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/2 transition-all"
      >
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
        />
        <Link
          to={`/projects/${project.id}`}
          className="font-heading font-semibold text-white hover:text-orbit-blue transition-colors flex-1 text-left"
          onClick={e => e.stopPropagation()}
        >
          {project.name}
        </Link>
        <span className="text-xs text-gray-500 flex-shrink-0">
          {doneCt}/{tasks.length} landed
        </span>
        {collapsed ? <ChevronDown size={15} className="text-gray-500 flex-shrink-0" /> : <ChevronUp size={15} className="text-gray-500 flex-shrink-0" />}
      </button>

      {/* Tasks */}
      {!collapsed && (
        <div className="border-t border-white/5 divide-y divide-white/3">
          {tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              projectColor={color}
              onComplete={onComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Tasks() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', due: '' });
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get('/projects');
      const projs = data.projects || [];
      setProjects(projs);
      const allTasks = projs.flatMap(p =>
        (p.tasks || []).map(t => ({
          ...t,
          project: { id: p.id, name: p.name, color: p.color }
        }))
      );
      setTasks(allTasks);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener('orbit:task-created', handler);
    return () => window.removeEventListener('orbit:task-created', handler);
  }, [fetchData]);

  const handleComplete = (taskId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'DONE' } : t));
  };

  // Filter tasks
  const filtered = tasks.filter(t => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.due === 'overdue' && !(t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'DONE')) return false;
    if (filters.due === 'today' && !isToday(new Date(t.dueDate || ''))) return false;
    return true;
  });

  // Group by project
  const groups = projects.map((p, idx) => ({
    project: p,
    idx,
    tasks: filtered.filter(t => t.project?.id === p.id),
  })).filter(g => g.tasks.length > 0);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gradient-space">My Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length} task{filtered.length !== 1 ? 's' : ''} · {filtered.filter(t => t.status === 'DONE').length} landed
          </p>
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`btn-ghost gap-2 relative ${activeFilterCount > 0 ? 'border-orbit-blue/40 text-orbit-blue' : ''}`}
        >
          <Filter size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orbit-blue text-white text-[9px] flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="glass-card p-4 mb-5 flex flex-wrap gap-3 items-center animate-slide-up">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <select
              className="orbit-input w-auto text-sm py-1.5"
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="TODO">Floating</option>
              <option value="IN_PROGRESS">In Motion</option>
              <option value="IN_REVIEW">Review</option>
              <option value="DONE">Landed</option>
            </select>

            <select
              className="orbit-input w-auto text-sm py-1.5"
              value={filters.priority}
              onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
            >
              <option value="">All Priority</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              className="orbit-input w-auto text-sm py-1.5"
              value={filters.due}
              onChange={e => setFilters(f => ({ ...f, due: e.target.value }))}
            >
              <option value="">All Dates</option>
              <option value="today">Due Today</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters({ status: '', priority: '', due: '' })}
              className="btn-ghost text-xs gap-1.5 text-orbit-red hover:text-red-400"
            >
              <X size={13} />
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Column headers */}
      <div className="hidden md:flex items-center gap-3 px-4 py-2 text-[11px] text-gray-600 uppercase tracking-wider mb-2">
        <div className="flex-shrink-0 w-4" />
        <div className="flex-1">Task</div>
        <div className="w-28 flex-shrink-0 text-center">Project</div>
        <div className="w-16 flex-shrink-0 text-center hidden sm:block">Priority</div>
        <div className="w-16 flex-shrink-0 text-center hidden md:block">Due</div>
        <div className="w-16 flex-shrink-0 text-center hidden lg:block">Status</div>
      </div>

      {/* Task Groups */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-4 space-y-3">
              <SkeletonBlock className="h-5 w-40" />
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyPlanet
          title="No tasks found"
          subtitle={activeFilterCount > 0 ? 'Try clearing your filters' : 'Launch tasks from any planet — press / anywhere!'}
        />
      ) : (
        <div className="space-y-4">
          {groups.map(({ project, tasks: groupTasks, idx }) => (
            <ProjectGroup
              key={project.id}
              project={project}
              tasks={groupTasks}
              idx={idx}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
