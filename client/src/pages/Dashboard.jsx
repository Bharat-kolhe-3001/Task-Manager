import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Activity, Clock, CheckCircle2, FolderKanban,
  AlertTriangle, ChevronRight, Zap
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth';
import { SkeletonMetric } from '../components/Skeleton';
import ProgressRing from '../components/ProgressRing';
import { EmptyOrbit } from '../components/EmptyState';
import ThemeToggle from '../components/ThemeToggle';

const PROJECT_COLORS = [
  '#3b82f6', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899',
];

function MetricCard({ label, value, icon: Icon, color, desc, delay = 0, loading }) {
  if (loading) return <SkeletonMetric />;
  return (
    <div
      className="metric-card animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="text-4xl font-heading font-bold" style={{ color }}>
        {value}
      </div>
      {desc && <p className="text-xs text-gray-600">{desc}</p>}
    </div>
  );
}

function OverdueCard({ task, onLand }) {
  const [landing, setLanding] = useState(false);
  const handleLand = async () => {
    setLanding(true);
    onLand(task.id); // optimistic
    try {
      await api.patch(`/tasks/${task.id}/status`, { status: 'DONE' });
      toast.success('Task landed! ✅');
    } catch {
      toast.error('Failed to update');
    } finally {
      setLanding(false);
    }
  };

  return (
    <div className="overdue-card animate-fade-in">
      <div className="flex items-start gap-3 min-w-0">
        <AlertTriangle size={16} className="text-orbit-red flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{task.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {task.dueDate ? `Due ${format(new Date(task.dueDate), 'MMM d')}` : 'No due date'}
            {task.project && ` · ${task.project.name}`}
          </p>
        </div>
      </div>
      <button
        onClick={handleLand}
        disabled={landing}
        className="btn-red text-xs flex-shrink-0"
      >
        <CheckCircle2 size={13} />
        {landing ? 'Landing...' : 'Land It'}
      </button>
    </div>
  );
}

function ProjectCard({ project, idx }) {
  const color = project.color || PROJECT_COLORS[idx % PROJECT_COLORS.length];
  const tasks = project.tasks || [];
  const done = tasks.filter(t => t.status === 'DONE').length;
  const total = tasks.length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="glass-card p-4 flex items-center gap-4 group"
    >
      <div
        className="planet-dot flex-shrink-0 w-4 h-4"
        style={{ background: color, color, boxShadow: `0 0 10px ${color}60` }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-heading font-semibold text-sm text-white group-hover:text-orbit-blue transition-colors truncate">
          {project.name}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{total} tasks · {done} landed</p>
      </div>
      <div className="relative flex-shrink-0">
        <ProgressRing percent={percent} size={44} color={color} strokeWidth={3.5} />
        <span
          className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
          style={{ color }}
        >
          {percent}%
        </span>
      </div>
      <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
    </Link>
  );
}

function ActivityItem({ item }) {
  const statusColors = {
    TODO: '#6b7280',
    IN_PROGRESS: '#3b82f6',
    IN_REVIEW: '#f59e0b',
    DONE: '#10b981',
  };
  const statusLabels = {
    TODO: 'set to Floating',
    IN_PROGRESS: 'launched to In Motion',
    IN_REVIEW: 'moved to Review',
    DONE: 'landed! ✅',
  };

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/4 last:border-0">
      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
        style={{ background: statusColors[item.status] || '#6b7280' }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-300">
          <span className="font-medium text-white">{item.title}</span>{' '}
          <span className="text-gray-500">{statusLabels[item.status]}</span>
        </p>
        {item.project && (
          <p className="text-xs text-gray-600 mt-0.5">{item.project.name}</p>
        )}
      </div>
      <span className="text-[11px] text-gray-600 flex-shrink-0">
        {item.updatedAt ? format(new Date(item.updatedAt), 'MMM d, HH:mm') : ''}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState(null);
  const [projects, setProjects] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const [dashRes, projectsRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/projects'),
      ]);
      const dash = dashRes.data?.data ?? dashRes.data;
      setMetrics(dash);
      const projs = projectsRes.data.projects || [];
      setProjects(projs);

      // Collect overdue tasks from projects
      const allTasks = projs.flatMap(p =>
        (p.tasks || []).map(t => ({ ...t, project: { id: p.id, name: p.name } }))
      );
      const now = new Date();
      const overdue = allTasks.filter(t =>
        t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
      ).slice(0, 5);
      setOverdueTasks(overdue);

      // Recent activity — last updated tasks
      const activity = [...allTasks]
        .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
        .slice(0, 10);
      setRecentActivity(activity);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoadingMetrics(false);
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // Listen for task created via quick launch
  useEffect(() => {
    const handler = () => fetchDashboard();
    window.addEventListener('orbit:task-created', handler);
    return () => window.removeEventListener('orbit:task-created', handler);
  }, [fetchDashboard]);

  const handleLand = (taskId) => {
    setOverdueTasks(prev => prev.filter(t => t.id !== taskId));
    setMetrics(prev => prev ? { ...prev, overdueTasks: Math.max(0, prev.overdueTasks - 1) } : prev);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const metricItems = [
    {
      label: 'Total Tasks',
      value: metrics?.totalTasks ?? '—',
      icon: Activity,
      color: '#3b82f6',
      desc: 'tasks in your orbit',
    },
    {
      label: 'In Motion',
      value: projects.flatMap(p => p.tasks || []).filter(t => t.status === 'IN_PROGRESS').length || (metrics?.totalTasks ? metrics.totalTasks - (metrics.overdueTasks || 0) - (metrics.completedTasks || 0) : '—'),
      icon: Zap,
      color: '#7c3aed',
      desc: 'actively in progress',
    },
    {
      label: 'Landed Today',
      value: metrics?.completedTasks ?? '—',
      icon: CheckCircle2,
      color: '#10b981',
      desc: 'completed this week',
    },
    {
      label: 'Overdue',
      value: overdueTasks.length || metrics?.overdueTasks || 0,
      icon: Clock,
      color: '#ef4444',
      desc: overdueTasks.length > 0 ? '⚠ needs attention' : 'all clear!',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gradient-space">
            {greeting()}, {user?.name?.split(' ')[0] || 'Commander'} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {format(new Date(), 'EEEE, MMMM d yyyy')} · Mission Control
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/projects" className="btn-primary gap-2">
            <FolderKanban size={15} />
            View Planets
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricItems.map((m, i) => (
          <MetricCard key={m.label} {...m} delay={i * 80} loading={loadingMetrics} />
        ))}
      </div>

      {/* Overdue Alert */}
      {overdueTasks.length > 0 && (
        <div className="animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-orbit-red" />
            <h2 className="font-heading font-semibold text-orbit-red text-sm uppercase tracking-wider">
              Overdue · {overdueTasks.length} task{overdueTasks.length > 1 ? 's' : ''} need landing
            </h2>
          </div>
          <div className="space-y-2">
            {overdueTasks.map(task => (
              <OverdueCard key={task.id} task={task} onLand={handleLand} />
            ))}
          </div>
        </div>
      )}

      {/* Projects + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects grid */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">Your Planets</h2>
            <Link to="/projects" className="text-xs text-orbit-blue hover:text-blue-400 transition-colors flex items-center gap-1">
              All planets <ChevronRight size={13} />
            </Link>
          </div>

          {loadingProjects ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : projects.length === 0 ? (
            <EmptyOrbit subtitle="Create your first planet to start orbiting." />
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map((p, i) => (
                <ProjectCard key={p.id} project={p} idx={i} />
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="glass-card p-5">
          <h2 className="font-heading font-bold text-base mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <Activity size={28} className="text-gray-700" />
              <p className="text-sm text-gray-500">No recent activity</p>
              <p className="text-xs text-gray-600">Start working on tasks to see updates</p>
            </div>
          ) : (
            <div>
              {recentActivity.map(item => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
