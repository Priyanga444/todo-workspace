import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  RiArrowLeftSLine, RiArrowRightSLine, RiCalendarTodoLine, 
  RiTimeLine, RiMapPin2Line, RiCheckDoubleLine, RiAddLine 
} from 'react-icons/ri';

const CalendarView = () => {
  const { currentProject } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [viewMode, setViewMode] = useState('month'); // month or day-timeline

  useEffect(() => {
    if (currentProject) {
      fetchTasks();
    }
  }, [currentProject]);

  const fetchTasks = async () => {
    try {
      const data = await api.getTasks(currentProject.id);
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  // Get tasks that fall on a specific day
  const getTasksForDate = (dateObj) => {
    return tasks.filter((task) => {
      if (!task.due_date) return false;
      const tDate = new Date(task.due_date);
      return (
        tDate.getDate() === dateObj.getDate() &&
        tDate.getMonth() === dateObj.getMonth() &&
        tDate.getFullYear() === dateObj.getFullYear()
      );
    });
  };

  const selectedDayTasks = getTasksForDate(selectedDate);

  // Time slots for the timeline planner
  const timeSlots = [
    { start: '08:00', end: '09:30', label: 'Morning Sync & Routine' },
    { start: '10:00', end: '11:30', label: 'Primary Tasks Focus' },
    { start: '12:00', end: '13:00', label: 'Lunch Break & Reset' },
    { start: '13:30', end: '15:00', label: 'Collaborative Work' },
    { start: '15:30', end: '17:00', label: 'Testing & Updates' },
    { start: '17:30', end: '18:30', label: 'End-of-Day Review' },
  ];

  // Helper to check if a task falls in a time slot
  const mapTasksToSlots = (slotIndex) => {
    // For prototype, we distribute tasks evenly across the day slots
    if (selectedDayTasks[slotIndex]) {
      return selectedDayTasks[slotIndex];
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 flex flex-col h-auto lg:h-[calc(100vh-4rem)] text-purple-955 dark:text-purple-100 lg:min-h-0 lg:overflow-hidden">
      
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pink-100 dark:border-pink-900/40 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Schedule Planner</h1>
          <p className="text-pink-600 dark:text-pink-400 text-xs mt-1">Interactive timeline, deadlines, and task manager.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Switch Mode */}
          <div className="flex bg-white/50 dark:bg-purple-950/40 p-1 rounded-2xl border border-pink-100 dark:border-pink-950/40">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'month' 
                  ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-md' 
                  : 'text-purple-800 dark:text-purple-300 hover:bg-purple-500/5'
              }`}
            >
              Month Grid
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'timeline' 
                  ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-md' 
                  : 'text-purple-800 dark:text-purple-300 hover:bg-purple-500/5'
              }`}
            >
              Daily Timeline
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevMonth}
              className="p-2.5 rounded-2xl bg-white dark:bg-purple-950/50 hover:bg-pink-50 border border-pink-100 dark:border-pink-950/40 text-purple-800 dark:text-purple-200 transition-colors"
            >
              <RiArrowLeftSLine className="text-lg" />
            </button>
            <span className="font-bold text-sm min-w-[120px] text-center bg-white dark:bg-purple-950/50 px-4 py-2.5 rounded-2xl border border-pink-100 dark:border-pink-950/40">
              {monthName} {year}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-2.5 rounded-2xl bg-white dark:bg-purple-950/50 hover:bg-pink-50 border border-pink-100 dark:border-pink-950/40 text-purple-800 dark:text-purple-200 transition-colors"
            >
              <RiArrowRightSLine className="text-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:min-h-0 lg:overflow-hidden">
        
        {/* Left Side: Monthly Planner Calendar */}
        <div className="lg:col-span-2 glass-panel p-4 sm:p-6 bg-white dark:bg-[#1c1535] border border-pink-100 dark:border-pink-900/40 flex flex-col lg:min-h-0">
          
          <div className="flex items-center justify-between mb-4 border-b border-pink-50 dark:border-purple-900/20 pb-2">
            <div className="flex items-center gap-2">
              <RiCalendarTodoLine className="text-pink-500 text-lg" />
              <h3 className="font-bold text-sm">Monthly Planner</h3>
            </div>
            <span className="text-[10px] uppercase font-bold text-pink-500 tracking-wider">Select day to view tasks</span>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {/* Week Labels */}
            <div className="grid grid-cols-7 gap-1 text-center py-2 text-pink-500 dark:text-pink-400 font-extrabold uppercase tracking-wider text-[10px]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>

            {/* Days Grid */}
            <div className="flex-1 grid grid-cols-7 gap-2 min-h-0 mt-1">
              {blanks.map((_, idx) => (
                <div key={`blank-${idx}`} className="bg-transparent border border-transparent" />
              ))}

              {days.map((day) => {
                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth();
                const isToday = 
                  day === new Date().getDate() && 
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();
                
                const dayTasks = getTasksForDate(dateObj);

                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => setSelectedDate(dateObj)}
                    className={`rounded-2xl border flex flex-col items-center justify-center p-2 relative transition-all duration-300 group min-h-[50px] ${
                      isSelected
                        ? 'bg-gradient-to-tr from-pink-500 to-violet-500 border-transparent text-white shadow-lg shadow-pink-500/10 scale-105'
                        : isToday
                        ? 'bg-pink-100/50 dark:bg-purple-900/30 border-pink-400 text-pink-600 dark:text-pink-300 font-bold'
                        : 'bg-[#faf8ff] dark:bg-[#120c24] border-pink-100/60 dark:border-pink-900/30 text-purple-950 dark:text-purple-200 hover:bg-pink-100/20'
                    }`}
                  >
                    <span className="text-xs font-bold">{day}</span>
                    
                    {/* Task Indicators */}
                    {dayTasks.length > 0 && (
                      <div className="flex gap-1 mt-1 justify-center">
                        {dayTasks.slice(0, 3).map((task, idx) => (
                          <span 
                            key={task.id}
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-white' : task.priority === 'High' ? 'bg-rose-500' : 'bg-pink-500'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Active Day Planner & Timeline */}
        <div className="glass-panel p-4 sm:p-6 bg-white dark:bg-[#1c1535] border border-pink-100 dark:border-pink-900/40 flex flex-col lg:min-h-0">
          
          {/* Selected Day Info */}
          <div className="border-b border-pink-50 dark:border-purple-900/20 pb-4 mb-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-pink-500 tracking-wider">Active Planner</span>
              <h3 className="font-bold text-base text-purple-950 dark:text-white mt-0.5">
                {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
            </div>
            <span className="bg-gradient-to-r from-pink-500 to-violet-500 text-white font-bold text-xs px-3 py-1 rounded-full shadow-md">
              {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'Task' : 'Tasks'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {viewMode === 'month' ? (
              // Month tasks summary view
              selectedDayTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                  <div className="p-4 bg-pink-100/30 rounded-full text-pink-500">
                    <RiCalendarTodoLine className="text-3xl" />
                  </div>
                  <p className="text-slate-500 text-xs italic">No items scheduled for this day.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-[#faf8ff] dark:bg-[#120c24] border border-pink-100 dark:border-pink-900/30 flex justify-between items-start group hover:border-pink-400 transition-colors duration-300"
                    >
                      <div className="min-w-0">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                          task.priority === 'High' 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
                            : 'bg-pink-500/10 border-pink-500/20 text-pink-600'
                        }`}>
                          {task.priority} Priority
                        </span>
                        <h4 className="font-bold text-xs text-purple-950 dark:text-white mt-2 truncate">{task.title}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{task.description || 'No description provided.'}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            ) : (
              // Daily Timeline Hour block schedule (Visual representation matching image style)
              <div className="space-y-4 relative before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-[2px] before:bg-pink-100 dark:before:bg-purple-900/30">
                {timeSlots.map((slot, idx) => {
                  const slotTask = mapTasksToSlots(idx);

                  return (
                    <div key={idx} className="flex gap-4 items-start relative pl-8">
                      {/* Timeline Dot Indicator */}
                      <div className={`absolute left-2.5 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 bg-white ${
                        slotTask ? 'border-pink-500' : 'border-slate-300'
                      }`} />

                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                          <RiTimeLine className="text-pink-500 text-xs" />
                          <span>{slot.start} - {slot.end}</span>
                        </div>

                        {slotTask ? (
                          <motion.div
                            initial={{ scale: 0.98, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="p-3.5 mt-2 rounded-2xl bg-gradient-to-r from-pink-500/5 to-purple-500/5 border border-pink-200 dark:border-pink-900/40 relative hover:border-pink-500 transition-colors"
                          >
                            <span className="text-[9px] uppercase font-extrabold text-pink-600 dark:text-pink-400">{slot.label}</span>
                            <h4 className="font-bold text-xs text-purple-950 dark:text-white mt-1">{slotTask.title}</h4>
                            <p className="text-[10px] text-slate-500 mt-1 truncate">{slotTask.description || 'Task scheduled.'}</p>
                          </motion.div>
                        ) : (
                          <div className="p-3 mt-2 rounded-2xl border border-dashed border-slate-200 dark:border-purple-950 text-[10px] text-slate-400 italic">
                            Free Block (No scheduled tasks)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default CalendarView;
