import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DndContext, closestCorners, DragOverlay,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  ArrowLeft, Users, Zap, X, ChevronRight,
  Mail, Shield, UserCheck, Trash2
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import KanbanColumn from '../components/KanbanColumn';
import TaskCard from '../components/TaskCard';
import { SkeletonKanban } from '../components/Skeleton';
import { useUIStore } from '../store/ui';
import { useAuthStore } from '../store/auth';
import ProgressRing from '../components/ProgressRing';

const COLUMNS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

const PLANET_COLORS = [
  '#3b82f6', '#7c3aed', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#8b5cf6',
];

function MembersSidebar({ project, onClose }) {
  const { user } = useAuthStore();
  const isOwner = project.ownerId === user?.id;

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/40" onClick={onClose} />
      <div className="slide-panel z-40">
        <div className="flex items-center justify-between p-5 border-b border-white/06">
          <div>
            <h2 className="font-heading font-bold text-lg">Team Members</h2>
            <p className="text-xs text-gray-500 mt-0.5">{project.members?.length || 0} in orbit</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {project.members?.map((m) => {
            const roleColor = m.role === 'ADMIN' ? '#7c3aed' : '#3b82f6';
            return (
              <div
                key={m.id || m.user?.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: `${roleColor}30`, border: `1px solid ${roleColor}40` }}
                >
                  {m.user?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{m.user?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-500 truncate">{m.user?.email}</p>
                </div>
                <span
                  className="badge text-[10px] flex-shrink-0"
                  style={{ background: `${roleColor}15`, color: roleColor, borderColor: `${roleColor}30` }}
                >
                  {m.role === 'ADMIN' ? <Shield size={9} /> : <UserCheck size={9} />}
                  {m.role?.toLowerCase()}
                </span>
              </div>
            );
          })}
        </div>

        {isOwner && (
          <div className="p-5 border-t border-white/06">
            <p className="text-xs text-gray-500 mb-2">Invite by email</p>
            <div className="flex gap-2">
              <input type="email" className="orbit-input flex-1" placeholder="colleague@company.com" />
              <button className="btn-primary gap-1.5 flex-shrink-0">
                <Mail size={14} />
                Invite
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const { openQuickLaunch } = useUIStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchProject = useCallback(async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data.project);
      setTasks(data.project.tasks || []);
    } catch {
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  // Listen for quick launch task creation
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.projectId === id) fetchProject();
    };
    window.addEventListener('orbit:task-created', handler);
    return () => window.removeEventListener('orbit:task-created', handler);
  }, [id, fetchProject]);

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    const overColumnId = over.data?.current?.sortable?.containerId || over.id;

    if (
      activeTask &&
      activeTask.status !== overColumnId &&
      COLUMNS.includes(overColumnId)
    ) {
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, status: overColumnId } : t));
      try {
        await api.patch(`/tasks/${activeTask.id}/status`, { status: overColumnId });
        if (overColumnId === 'DONE') toast.success('✅ Task landed!', { duration: 2000 });
      } catch {
        toast.error('Failed to update');
        fetchProject(); // revert
      }
    }
  };

  const handleTaskLand = (taskId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'DONE' } : t));
  };

  const handleOptimisticAdd = (newTask) => {
    setTasks(prev => [...prev, newTask]);
  };

  const color = project?.color || '#3b82f6';
  const done = tasks.filter(t => t.status === 'DONE').length;
  const total = tasks.length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const activeTask = tasks.find(t => t.id === activeId);

  if (loading) {
    return (
      <div className="h-full flex flex-col gap-6 animate-pulse">
        <div className="h-8 bg-white/5 rounded w-1/3" />
        <SkeletonKanban />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Link to="/projects" className="text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>

        <div
          className="planet-dot"
          style={{ background: color, color, boxShadow: `0 0 12px ${color}60`, width: '14px', height: '14px', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }}
        />

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-heading font-bold text-white truncate">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-gray-500 mt-0.5 truncate">{project.description}</p>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <ProgressRing percent={percent} size={40} color={color} strokeWidth={3} />
            <span
              className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
              style={{ color }}
            >
              {percent}%
            </span>
          </div>
          <span className="text-xs text-gray-500">{done}/{total} landed</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowMembers(true)}
            className="btn-ghost gap-2 text-sm"
          >
            <Users size={15} />
            <span className="hidden sm:inline">{project.members?.length || 0} Members</span>
          </button>

          <button
            onClick={() => openQuickLaunch(id)}
            id="quick-launch-fab"
            className="btn-primary gap-2"
            title="Quick Launch task (or press /)"
          >
            <Zap size={15} />
            <span className="hidden sm:inline">Quick Launch</span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full items-start min-h-[600px]" style={{ minWidth: `${COLUMNS.length * 316}px` }}>
            {COLUMNS.map(colId => (
              <KanbanColumn
                key={colId}
                id={colId}
                tasks={tasks.filter(t => t.status === colId)}
                projectId={id}
                onTaskAdded={handleOptimisticAdd}
                onTaskLand={handleTaskLand}
                onRefresh={fetchProject}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <TaskCard task={activeTask} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Members Sidebar */}
      {showMembers && (
        <MembersSidebar project={project} onClose={() => setShowMembers(false)} />
      )}
    </div>
  );
}
