import { RiCalendarEventLine, RiCheckboxMultipleLine, RiAttachment2, RiChat3Line, RiSettings4Line } from 'react-icons/ri';
import { useApp } from '../context/AppContext';

const TaskCard = ({ task, columns, onStatusChange, onClick }) => {
  const { workspaceMode } = useApp();
  const getPriorityColor = (p) => {
    switch (p) {
      case 'High': return 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20';
      case 'Medium': return 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20';
      case 'Low': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-350 border-slate-500/20';
    }
  };

  const getStatusCardStyles = () => {
    const col = columns.find(c => c.id === task.column_id);
    const colName = col ? col.name.toLowerCase() : '';

    if (colName.includes('complete') || colName.includes('done')) {
      return 'bg-emerald-100/70 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-800/40 hover:border-emerald-500 dark:hover:border-emerald-400';
    } else if (colName.includes('progress') || colName.includes('active') || colName.includes('doing')) {
      return 'bg-blue-100/70 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800/40 hover:border-blue-500 dark:hover:border-blue-400';
    } else if (colName.includes('todo') || colName.includes('to do') || colName.includes('backlog')) {
      return 'bg-rose-100/70 dark:bg-rose-900/20 border-rose-300 dark:border-rose-800/40 hover:border-rose-500 dark:hover:border-rose-400';
    } else {
      return 'bg-purple-100/40 dark:bg-[#1a0f30]/60 border-pink-250 dark:border-pink-900/40 hover:border-pink-400 dark:hover:border-pink-500';
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.column_name !== 'Completed';

  return (
    <div
      onClick={onClick}
      className={`glass-panel p-4 cursor-pointer transition-all relative overflow-hidden group flex flex-col md:flex-row md:items-center justify-between gap-4 border ${getStatusCardStyles()}`}
    >
      {/* Colored accent line on the left */}
      <div className={`absolute top-0 left-0 w-1 h-full ${
        task.priority === 'High' ? 'bg-rose-500' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
      }`} />

      {/* Left side: Metadata & Title */}
      <div className="flex-1 min-w-0 pl-2">
        <h4 className="font-bold text-sm text-purple-955 dark:text-white leading-snug group-hover:text-pink-500 transition-colors truncate">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Labels & Due Dates */}
        <div className="flex flex-wrap items-center gap-2.5 mt-3">
          <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wide ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>

          {task.due_date && (
            <div className={`flex items-center gap-1 text-[10px] font-bold ${isOverdue ? 'text-rose-500' : 'text-slate-550 dark:text-slate-400'}`}>
              <RiCalendarEventLine className="text-pink-500" />
              <span>
                {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          )}

          {task.checklist_total > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-slate-550 dark:text-slate-400 font-bold">
              <RiCheckboxMultipleLine className="text-pink-500" />
              <span>
                {task.checklist_completed}/{task.checklist_total} Checklist
              </span>
            </div>
          )}

          {task.labels && task.labels.map(label => (
            <span 
              key={label.id}
              className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border"
              style={{ backgroundColor: `${label.color}15`, borderColor: `${label.color}35`, color: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      </div>

      {/* Right side: Inline Status Changer & Assignee */}
      <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-pink-50 dark:border-pink-900/10 pt-3 md:pt-0 flex-shrink-0">
        
        {/* Status Option Dropdown Selector */}
        <div 
          onClick={(e) => e.stopPropagation()} // Avoid triggering card details popup when changing dropdown
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-500/5 dark:bg-white/5 border border-pink-200 dark:border-pink-900/30 rounded-xl"
        >
          <RiSettings4Line className="text-pink-500 text-xs" />
          <select
            value={task.column_id}
            onChange={(e) => onStatusChange(task.id, parseInt(e.target.value))}
            className="bg-transparent border-none text-[10px] font-extrabold text-pink-600 dark:text-pink-400 focus:outline-none cursor-pointer uppercase tracking-wider"
          >
            {columns.map(col => (
              <option key={col.id} value={col.id} className="bg-[#1c1535] text-white text-xs">
                {col.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assignee Avatar */}
        {workspaceMode === 'team' && task.assignee_name && (
          <div 
            title={`Assigned to ${task.assignee_name}`}
            className="w-7 h-7 rounded-full bg-pink-600 flex items-center justify-center text-xs font-bold text-white uppercase border border-pink-100 dark:border-white/10"
          >
            {task.assignee_photo && task.assignee_photo !== 'null' && task.assignee_photo !== '' ? (
              <img src={task.assignee_photo} alt={task.assignee_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              task.assignee_name ? task.assignee_name.charAt(0) : 'U'
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default TaskCard;
