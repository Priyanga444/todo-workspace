import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import { 
  RiAddLine, RiSearchLine, RiFilterLine, RiSortAsc, 
  RiLoader4Line, RiInboxLine
} from 'react-icons/ri';

const Board = () => {
  const { currentProject } = useApp();
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Filters & Sorting State
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterColumn, setFilterColumn] = useState('');
  const [sortBy, setSortBy] = useState('Newest');
  
  // Custom Create Task Modal States
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [targetColumnId, setTargetColumnId] = useState(null);
 
  useEffect(() => {
    if (currentProject) {
      setFilterColumn(''); // Reset status filter when active project changes
      fetchBoardData();
    }
  }, [currentProject]);

  const fetchBoardData = async () => {
    setLoading(true);
    try {
      const cols = await api.getColumns(currentProject.id);
      const t = await api.getTasks(currentProject.id);
      setColumns(cols);
      setTasks(t);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newColumnId) => {
    try {
      await api.updateTask(taskId, { column_id: newColumnId });
      // Update local task state immediately for smooth UI updates
      setTasks(prevTasks => 
        prevTasks.map(t => t.id === taskId ? { ...t, column_id: newColumnId } : t)
      );
    } catch (err) {
      console.error('Failed to change status:', err);
      fetchBoardData(); // Revert on failure
    }
  };

  const handleOpenCreateTask = () => {
    if (columns.length === 0) {
      alert('Error: Please create at least one project column/status first.');
      return;
    }
    setTargetColumnId(columns[0].id); // Defaults to first status (e.g. To Do / Backlog)
    setNewTaskTitle('');
    setIsCreateTaskOpen(true);
  };

  const handleConfirmCreateTask = async () => {
    if (!newTaskTitle) return;
    try {
      await api.createTask({
        column_id: targetColumnId,
        title: newTaskTitle,
        priority: 'Medium'
      });
      setIsCreateTaskOpen(false);
      fetchBoardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtering & Sorting execution
  const filteredTasks = tasks
    .filter(t => {
      const matchesSearch = 
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
        (t.assignee_name && t.assignee_name.toLowerCase().includes(search.toLowerCase()));
      
      const matchesPriority = filterPriority ? t.priority === filterPriority : true;
      const matchesColumn = filterColumn ? t.column_id === parseInt(filterColumn) : true;
 
      return matchesSearch && matchesPriority && matchesColumn;
    })
    .sort((a, b) => {
      if (sortBy === 'Newest') return b.id - a.id;
      if (sortBy === 'Oldest') return a.id - b.id;
      if (sortBy === 'Alphabetical') return a.title.localeCompare(b.title);
      if (sortBy === 'DueDate') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (sortBy === 'Priority') {
        const priorities = { High: 3, Medium: 2, Low: 1 };
        return (priorities[b.priority] || 0) - (priorities[a.priority] || 0);
      }
      return 0;
    });

  if (!currentProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center min-h-[60vh]">
        <RiInboxLine className="text-5xl text-pink-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-purple-955 dark:text-white mb-2">No Active Project Selected</h2>
        <p className="text-xs text-pink-700 dark:text-purple-300 max-w-sm">Please select a project from the sidebar or click "+" to create a project to start planning tasks.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] text-slate-400">
        <RiLoader4Line className="text-4xl animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col h-[calc(100vh-4rem)] text-purple-955 dark:text-purple-100">
      
      {/* Board toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-pink-100 dark:border-pink-900/40 pb-4 flex-shrink-0">
        
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400 text-sm" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border border-pink-200 dark:border-pink-900/30 rounded-xl pl-9 pr-4 py-2.5 text-xs text-purple-955 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 transition-all w-48 sm:w-64"
            />
          </div>

          <div className="flex items-center gap-1 bg-white/5 border border-pink-200 dark:border-pink-900/30 rounded-xl px-3 py-1.5 text-xs">
            <RiFilterLine className="text-pink-500" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-transparent border-none text-purple-955 dark:text-white focus:outline-none font-bold"
            >
              <option className="bg-[#1c1535]" value="">All Priorities</option>
              <option className="bg-[#1c1535]" value="High">High</option>
              <option className="bg-[#1c1535]" value="Medium">Medium</option>
              <option className="bg-[#1c1535]" value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-white/5 border border-pink-200 dark:border-pink-900/30 rounded-xl px-3 py-1.5 text-xs">
            <RiFilterLine className="text-pink-500" />
            <select
              value={filterColumn}
              onChange={(e) => setFilterColumn(e.target.value)}
              className="bg-transparent border-none text-purple-955 dark:text-white focus:outline-none font-bold"
            >
              <option className="bg-[#1c1535]" value="">All Statuses</option>
              {columns.map(col => (
                <option key={col.id} className="bg-[#1c1535]" value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort & Add Task */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/5 border border-pink-200 dark:border-pink-900/30 rounded-xl px-3 py-1.5 text-xs">
            <RiSortAsc className="text-pink-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-purple-955 dark:text-white focus:outline-none font-bold"
            >
              <option className="bg-[#1c1535]" value="Newest">Newest First</option>
              <option className="bg-[#1c1535]" value="Oldest">Oldest First</option>
              <option className="bg-[#1c1535]" value="DueDate">Due Date</option>
              <option className="bg-[#1c1535]" value="Priority">Priority</option>
              <option className="bg-[#1c1535]" value="Alphabetical">Alphabetical</option>
            </select>
          </div>

          <button
            onClick={handleOpenCreateTask}
            className="btn-primary py-2.5 px-5 text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-pink-500/10 hover:shadow-pink-500/20"
          >
            <RiAddLine className="text-sm" /> Add Task
          </button>
        </div>
      </div>

      {/* Main Single Box Console */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="glass-panel p-6 bg-white dark:bg-[#1c1535] border border-pink-100 dark:border-pink-900/40 flex-1 flex flex-col min-h-0">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4 border-b border-pink-50 dark:border-purple-900/20 pb-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-purple-955 dark:text-white">Workspace Task Console</span>
              <span className="bg-pink-500/10 text-pink-600 border border-pink-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {filteredTasks.length} Tasks Listed
              </span>
            </div>
          </div>

          {/* Scrollable Tasks list */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <RiInboxLine className="text-4xl text-pink-400 opacity-60" />
                <p className="text-slate-500 text-xs italic">No active tasks in this project. Click "+ Add Task" to begin planning.</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  columns={columns}
                  onStatusChange={handleStatusChange}
                  onClick={() => setSelectedTask(task)}
                />
              ))
            )}
          </div>

        </div>
      </div>

      {/* Task Modal Editor */}
      <TaskModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onRefresh={fetchBoardData}
      />

      {/* Custom Centered Create Task Modal */}
      <AnimatePresence>
        {isCreateTaskOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-md p-6 bg-white dark:bg-[#1c1535] border border-pink-100 dark:border-pink-900/40 text-purple-955 dark:text-purple-100 relative"
            >
              <h3 className="text-sm font-bold mb-4 text-purple-955 dark:text-white">Create New Task</h3>
              <input
                type="text"
                placeholder="Enter task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmCreateTask()}
                className="w-full mb-6 text-xs focus:outline-none transition-all"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsCreateTaskOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-500/5 hover:bg-slate-500/10 text-xs font-bold transition-all text-purple-900 dark:text-purple-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCreateTask}
                  className="btn-primary py-2.5 px-5 text-xs font-bold shadow-md shadow-pink-500/10 hover:shadow-pink-500/20 transition-all"
                >
                  Create Task
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Board;
