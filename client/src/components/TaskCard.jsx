import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Flag, CheckCircle2, ChevronDown, ChevronUp, User } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const PRIORITY_MAP = {
  CRITICAL: { cls: 'badge-critical', label: 'Critical' },
  HIGH: { cls: 'badge-high', label: 'High' },
  MEDIUM: { cls: 'badge-medium', label: 'Medium' },
  LOW: { cls: 'badge-low', label: 'Low' },
};

const STATUS_MAP = {
  TODO: 'Floating',
  IN_PROGRESS: 'In Motion',
  IN_REVIEW: 'Review',
  DONE: 'Landed',
};

function Avatar({ name, size = 6 }) {
  if (!name) return null;
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['bg-orbit-blue', 'bg-orbit-purple', 'bg-orbit-green', 'bg-orbit-amber'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-${size} h-${size} rounded-full ${color} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function TaskCard({ task, isOverlay, onLand, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [landing, setLanding] = useState(false);

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE';
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  const handleLand = async (e) => {
    e.stopPropagation();
    if (task.status === 'DONE') return;
    setLanding(true);
    // Optimistic update
    onLand?.(task.id);
    try {
      await api.patch(`/tasks/${task.id}/status`, { status: 'DONE' });
      toast.success('✅ Task landed!', { duration: 2000 });
    } catch {
      toast.error('Failed to update');
      onUpdate?.();
    } finally {
      setLanding(false);
    }
  };

  const prio = PRIORITY_MAP[task.priority] || PRIORITY_MAP.MEDIUM;

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="task-card opacity-30 border-dashed border-orbit-blue/40 h-20"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${isOverlay ? 'dragging' : ''} ${isOverdue ? 'is-overdue' : ''}`}
    >
      {/* Drag handle area */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`badge ${prio.cls}`}>
            <Flag size={9} />
            {prio.label}
          </span>
          <div className="flex items-center gap-1.5">
            {task.assignee && <Avatar name={task.assignee.name} />}
          </div>
        </div>

        {/* Title */}
        <h4 className={`text-sm font-medium leading-snug ${task.status === 'DONE' ? 'line-through text-gray-500' : 'text-gray-100'}`}>
          {task.title}
        </h4>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2.5 gap-2">
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <span className={`flex items-center gap-1 text-[11px] ${
                isOverdue ? 'text-orbit-red font-semibold' :
                isDueToday ? 'text-orbit-amber' :
                'text-gray-500'
              }`}>
                <Calendar size={11} />
                {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
            {task.assignee && (
              <span className="text-[11px] text-gray-500 flex items-center gap-1">
                <User size={11} />
                {task.assignee.name.split(' ')[0]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions row (not draggable) */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
          className="text-[11px] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? 'Less' : 'Details'}
        </button>

        {task.status !== 'DONE' && (
          <button
            onClick={handleLand}
            disabled={landing}
            className="btn-green py-0.5 px-2 text-[11px] h-auto min-h-0"
            title="Mark as done"
          >
            <CheckCircle2 size={12} />
            Land It
          </button>
        )}
        {task.status === 'DONE' && (
          <span className="text-[11px] text-orbit-green flex items-center gap-1">
            <CheckCircle2 size={12} />
            Landed
          </span>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-white/5 space-y-1.5 animate-fade-in">
          {task.description && (
            <p className="text-xs text-gray-400 leading-relaxed">{task.description}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge badge-${task.status?.toLowerCase().replace('_', '-') || 'todo'}`}>
              {STATUS_MAP[task.status] || task.status}
            </span>
            {task.assignee && (
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Avatar name={task.assignee.name} size={4} />
                {task.assignee.name}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
