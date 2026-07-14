import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  RiDashboardLine, 
  RiKanbanView, 
  RiCalendarLine, 
  RiBarChartGroupedLine, 
  RiUserLine, 
  RiAddLine,
  RiLogoutBoxLine,
  RiTimeLine,
  RiCheckboxMultipleLine,
  RiBarChart2Line,
  RiCalendarEventLine,
  RiAlarmWarningLine,
  RiFileTextLine
} from 'react-icons/ri';

const Sidebar = ({ isOpen, onClose, onOpenAddProject }) => {
  const { projects, currentProject, selectProject, logout, workspaceMode } = useApp();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: RiDashboardLine },
    { name: 'Task Board', path: '/board', icon: RiCheckboxMultipleLine },
    { name: 'Analytics', path: '/analytics', icon: RiBarChart2Line },
    { name: 'Timeline', path: '/timeline', icon: RiCalendarEventLine },
    { name: 'Scheduled Reminders', path: '/reminders', icon: RiAlarmWarningLine },
    { name: 'My Notes', path: '/notes', icon: RiFileTextLine },
    { name: 'Profile Settings', path: '/profile', icon: RiUserLine }
  ];

  const handleProjectSelect = (proj) => {
    selectProject(proj);
    if (onClose) onClose(); // Auto-close drawer on mobile
  };

  return (
    <>
      {/* Mobile Drawer Overlay Background Mask */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-955/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Responsive Sidebar Panel Container */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 glass border-r border-pink-100 dark:border-pink-955/40 flex flex-col p-4 bg-[#fff9fc]/95 dark:bg-[#1f0b2a]/95 text-pink-955 dark:text-pink-200 transition-transform duration-300 md:static md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand Header */}
        <div className="flex flex-col gap-1.5 px-2 py-4 mb-4 border-b border-pink-100 dark:border-pink-955/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-pink-500/30">
              W
            </div>
            <span className="font-bold text-lg text-slate-800 dark:text-white tracking-wide">Workspace</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
              workspaceMode === 'team'
                ? 'bg-pink-500/10 text-pink-600 border border-pink-500/20'
                : 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20'
            }`}>
              {workspaceMode === 'team' ? 'Team Account' : 'Personal Account'}
            </span>
          </div>
        </div>

        {/* Primary Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose} // Auto-close drawer on mobile
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                  isActive
                    ? 'bg-pink-500/10 dark:bg-pink-900/30 border-l-4 border-pink-500 text-pink-600 dark:text-pink-100 shadow-pink-500/5'
                    : 'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white'
                }`
              }
            >
              <item.icon className="text-xl" />
              <span>{item.name}</span>
            </NavLink>
          ))}

          {/* Projects Segment */}
          <div className="mt-8">
            <div className="flex items-center justify-between px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span>Projects</span>
              <button 
                onClick={() => {
                  onOpenAddProject();
                  if (onClose) onClose();
                }}
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <RiAddLine className="text-sm" />
              </button>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {projects.length === 0 ? (
                <div className="px-2 py-3 text-xs text-slate-500 italic">No projects found.</div>
              ) : (
                projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => handleProjectSelect(proj)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
                      currentProject?.id === proj.id
                        ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white'
                        : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: proj.color || '#6366f1' }}
                    />
                    <span className="truncate">{proj.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </nav>

        {/* Footer Quick Controls */}
        <div className="border-t border-white/5 pt-4 mt-auto space-y-1">
          <button
            onClick={() => {
              logout();
              if (onClose) onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-455 hover:bg-rose-500/10 hover:text-rose-300 font-medium transition-all"
          >
            <RiLogoutBoxLine className="text-xl" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
