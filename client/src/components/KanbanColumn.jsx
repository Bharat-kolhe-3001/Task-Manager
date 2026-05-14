import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import TaskCard from './TaskCard';
import { SkeletonTaskCard } from './Skeleton';

const COL_STYLES = {
  TODO: {
    dot: 'bg-gray-400',
    header: 'border-b border-gray-700/50',
    accent: '#6b7280',
    label: 'Floating',
  },
  IN_PROGRESS: {
    dot: 'bg-orbit-blue',
    header: 'border-b border-orbit-blue/20',
    accent: '#3b82f6',
    label: 'In Motion',
  },
  IN_REVIEW: {
    dot: 'bg-orbit-amber',
    header: 'border-b border-amber-500/20',
    accent: '#f59e0b',
    label: 'Orbit Check',
  },
  DONE: {
    dot: 'bg-orbit-green',
    header: 'border-b border-orbit-green/20',
    accent: '#10b981',
    label: 'Landed',
  },
};

export default function KanbanColumn({ id, tasks, projectId, onTaskAdded, onTaskLand, onRefresh }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const inputRef = useRef(null);

  const style = COL_STYLES[id] || COL_STYLES.TODO;

  const handleAddTask = async (e) => {
    if (e.key === 'Enter' && newTaskTitle.trim()) {
      if (adding) return;
      setAdding(true);
      const title = newTaskTitle.trim();
      setNewTaskTitle('');
      setIsAdding(false);

      // Optimistic: notify parent immediately
      onTaskAdded?.({ id: `temp-${Date.now()}`, title, status: id, priority: 'MEDIUM', projectId });

      try {
        await api.post('/tasks', { title, projectId, status: id, priority: 'MEDIUM' });
        toast.success('Task created', { duration: 1500 });
        onRefresh?.();
      } catch {
        toast.error('Failed to create task');
        onRefresh?.();
      } finally {
        setAdding(false);
      }
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTaskTitle('');
    }
  };

  const startAdding = () => {
    setIsAdding(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div
      ref={setNodeRef}
      className={`kanban-col ${isOver ? 'drop-target' : ''}`}
      style={{
        borderTopColor: isOver ? style.accent : undefined,
        borderTopWidth: isOver ? '2px' : undefined,
      }}
    >
      {/* Column Header */}
      <div className={`p-3 flex items-center justify-between ${style.header}`}>
        <div className="flex items-center gap-2">
          <div className={`planet-dot ${style.dot}`} />
          <span className="text-sm font-heading font-semibold text-gray-200">{style.label}</span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: `${style.accent}20`, color: style.accent }}
          >
            {tasks.length}
          </span>
        </div>
        <button
          onClick={startAdding}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all"
          title="Add task"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 min-h-[120px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onLand={(taskId) => onTaskLand?.(taskId)}
              onUpdate={onRefresh}
            />
          ))}
        </SortableContext>

        {/* Quick add input */}
        {isAdding && (
          <div
            className="rounded-xl p-3 animate-scale-in"
            style={{
              background: 'rgba(17,24,39,0.9)',
              border: `1px solid ${style.accent}50`,
              boxShadow: `0 0 12px ${style.accent}20`,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Task title... (Enter to save)"
              className="w-full bg-transparent outline-none text-sm text-white placeholder-gray-500"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={handleAddTask}
              onBlur={() => {
                if (!newTaskTitle.trim()) setIsAdding(false);
              }}
            />
            <p className="text-[10px] text-gray-600 mt-1">Enter to save · Esc to cancel</p>
          </div>
        )}

        {/* Empty state */}
        {tasks.length === 0 && !isAdding && (
          <button
            onClick={startAdding}
            className="w-full py-6 rounded-xl flex flex-col items-center gap-2 text-gray-600 hover:text-gray-400 hover:bg-white/3 transition-all border border-dashed border-white/5 hover:border-white/10"
          >
            <Plus size={20} />
            <span className="text-xs">Add task</span>
          </button>
        )}
      </div>
    </div>
  );
}
