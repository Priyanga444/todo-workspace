import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { 
  RiNotification3Line, 
  RiSunLine, 
  RiMoonLine, 
  RiCheckDoubleLine,
  RiMenu2Line,
  RiUserAddLine,
  RiCloseLine,
  RiMailLine,
  RiSettings4Line
} from 'react-icons/ri';
import { api } from '../services/api';

const Navbar = ({ onOpenMenu }) => {
  const { user, currentProject, darkMode, setDarkMode, notifications, fetchNotifications, workspaceMode, selectProject } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);

  // Invite Modal States
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');
  const [addMemberSuccess, setAddMemberSuccess] = useState('');

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Pool every 30s
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };
  const handleDeleteNotification = async (id) => {
    try {
      await api.deleteNotification(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };
  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!memberEmail) return;
    setAddMemberLoading(true);
    setAddMemberError('');
    setAddMemberSuccess('');
    try {
      await api.addProjectMember(currentProject.id, { email: memberEmail, role: memberRole });
      setAddMemberSuccess('Teammate added successfully!');
      setMemberEmail('');
      // Refresh current project context data to display the new member avatars instantly
      await selectProject(currentProject);
    } catch (err) {
      console.error(err);
      setAddMemberError(err.message || 'Failed to add member. Make sure they have registered an account first.');
    } finally {
      setAddMemberLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="h-16 glass border-b border-pink-100 dark:border-pink-955/40 flex items-center justify-between px-3 sm:px-6 bg-[#fff9fc]/80 dark:bg-[#1f0b2a]/80 text-pink-955 dark:text-pink-100 relative z-20">
      {/* Hamburger + Active Project Title + Members */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMenu}
          className="p-2 -ml-2 rounded-xl bg-slate-500/5 dark:bg-white/5 hover:bg-slate-500/10 dark:hover:bg-white/10 md:hidden transition-colors flex-shrink-0"
          title="Open Menu"
        >
          <RiMenu2Line className="text-xl text-pink-600 dark:text-pink-400" />
        </button>

        {currentProject ? (
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <div 
                className="w-2.5 h-2.5 rounded-full animate-pulse" 
                style={{ backgroundColor: currentProject.color }}
              />
              <span className="font-bold text-sm sm:text-base md:text-lg tracking-tight truncate max-w-[80px] sm:max-w-[200px]">{currentProject.name}</span>
            </div>

            {/* Team Members List (Only in Team Mode) */}
            {workspaceMode === 'team' && (
              <div className="flex items-center gap-1 sm:gap-2 border-l border-pink-100 dark:border-pink-900/30 pl-2 sm:pl-4 flex-shrink-0">
                {currentProject.members && (
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {currentProject.members.slice(0, 4).map((member) => (
                      <div
                        key={member.id}
                        title={`${member.name} (${member.role})`}
                        className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#1a0f30] bg-pink-500 text-white flex items-center justify-center text-[10px] font-extrabold uppercase overflow-hidden"
                      >
                        {member.photo_url && member.photo_url !== 'null' && member.photo_url !== '' ? (
                          <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          member.name ? member.name.charAt(0) : 'U'
                        )}
                      </div>
                    ))}
                    {currentProject.members.length > 4 && (
                      <div 
                        title={`${currentProject.members.length - 4} more members`}
                        className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#1a0f30] bg-slate-655 text-white flex items-center justify-center text-[9px] font-extrabold"
                      >
                        +{currentProject.members.length - 4}
                      </div>
                    )}
                  </div>
                )}

                {/* Add Member button trigger */}
                <button
                  onClick={() => {
                    setAddMemberError('');
                    setAddMemberSuccess('');
                    setIsAddMemberOpen(true);
                  }}
                  className="p-1 rounded-lg bg-pink-500/10 text-pink-600 border border-pink-500/20 hover:bg-pink-500 hover:text-white transition-colors"
                  title="Add Teammate"
                >
                  <RiUserAddLine className="text-xs" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <span className="font-semibold text-sm sm:text-lg text-slate-400">Select or Create a Project</span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl bg-slate-500/5 dark:bg-white/5 hover:bg-slate-500/10 dark:hover:bg-white/10 transition-colors"
        >
          {darkMode ? <RiSunLine className="text-xl text-yellow-450" /> : <RiMoonLine className="text-xl text-indigo-400" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-slate-500/5 dark:bg-white/5 hover:bg-slate-500/10 dark:hover:bg-white/10 transition-colors relative"
          >
            <RiNotification3Line className="text-xl text-slate-500 hover:text-slate-900 dark:text-slate-350 dark:hover:text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 glass-panel bg-white dark:bg-[#1a0f30] border border-pink-100 dark:border-pink-900/40 p-4 z-50 max-h-96 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4 border-b border-pink-50 dark:border-pink-955/20 pb-2">
                  <span className="font-bold text-sm text-purple-955 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-xs text-pink-500 hover:text-pink-600 flex items-center gap-1 font-bold transition-colors"
                    >
                      <RiCheckDoubleLine className="text-sm" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500 italic">No notifications yet.</div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer relative group/notif ${
                          notif.is_read 
                            ? 'bg-transparent border-transparent opacity-60' 
                            : 'bg-slate-500/5 border-slate-200 dark:bg-white/5 dark:border-white/5 hover:bg-slate-500/10 dark:hover:bg-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start pr-6">
                          <div>
                            <h4 className="text-xs font-bold text-purple-955 dark:text-slate-200 leading-snug">{notif.title}</h4>
                            <p className="text-[11px] text-pink-700 dark:text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notif.id);
                          }}
                          className="absolute top-2 right-2 p-1 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors focus:opacity-100 opacity-80 sm:opacity-0 sm:group-hover/notif:opacity-100"
                          title="Delete Notification"
                        >
                          <RiCloseLine className="text-sm" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 bg-slate-500/5 border border-pink-100 dark:bg-white/5 dark:border-white/10 rounded-2xl px-3 py-1.5 hover:bg-slate-500/10 dark:hover:bg-white/10 transition-colors">
            {user.photo_url ? (
              <img 
                src={user.photo_url} 
                alt={user.name} 
                className="w-7 h-7 rounded-full object-cover border border-pink-400"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-pink-600 flex items-center justify-center text-xs font-bold text-white uppercase border border-pink-100 dark:border-white/10">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-purple-955 dark:text-white truncate max-w-[80px]">{user.name}</p>
              <p className="text-[10px] text-pink-600 dark:text-pink-400 font-bold truncate max-w-[80px] capitalize">{user.workspace_mode || 'Team'} User</p>
            </div>
          </div>
        )}
      </div>

      {/* invite Teammate Popup Modal */}
      <AnimatePresence>
        {isAddMemberOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-md p-6 bg-white dark:bg-[#1c1535] border border-pink-100 dark:border-pink-900/40 text-purple-955 dark:text-purple-100 relative"
            >
              <button 
                onClick={() => setIsAddMemberOpen(false)} 
                className="absolute top-4 right-4 p-2 rounded-2xl bg-slate-500/5 dark:bg-white/5 hover:bg-slate-500/10 dark:hover:bg-white/10 text-slate-500 hover:text-purple-955 dark:hover:text-white transition-colors"
              >
                <RiCloseLine className="text-xl" />
              </button>

              <h2 className="text-lg font-bold mb-4 text-purple-955 dark:text-white flex items-center gap-2">
                <RiUserAddLine className="text-pink-500" />
                Invite Team Member
              </h2>
              <p className="text-xs text-pink-700 dark:text-purple-300 mb-6 leading-relaxed">
                Add an existing user to <strong>{currentProject?.name}</strong> by entering their registered email address.
              </p>

              {addMemberError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-350 rounded-2xl text-xs font-bold mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  {addMemberError}
                </div>
              )}

              {addMemberSuccess && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-350 rounded-2xl text-xs font-bold mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {addMemberSuccess}
                </div>
              )}

              <form onSubmit={handleAddMemberSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-purple-800 dark:text-purple-300 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400 text-sm" />
                    <input 
                      type="email" 
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      required
                      style={{ paddingLeft: '34px' }}
                      className="w-full pl-9 pr-4 py-2.5 text-xs focus:outline-none transition-all" 
                      placeholder="member@workspace.com" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-purple-800 dark:text-purple-300 mb-1.5 uppercase tracking-wider">Access Role</label>
                  <div className="relative">
                    <RiSettings4Line className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400 text-sm" />
                    <select
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value)}
                      style={{ paddingLeft: '34px' }}
                      className="w-full pl-9 pr-4 py-2.5 text-xs focus:outline-none transition-all"
                    >
                      <option className="bg-[#1c1535]" value="member">Project Member</option>
                      <option className="bg-[#1c1535]" value="admin">Project Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-pink-100 dark:border-pink-950/40 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddMemberOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-500/5 dark:bg-white/5 hover:bg-slate-500/10 dark:hover:bg-white/10 transition-colors text-purple-955 dark:text-slate-300 text-xs font-bold"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={addMemberLoading || !memberEmail}
                    className="btn-primary py-2.5 px-5 text-xs font-bold flex items-center justify-center shadow-md shadow-pink-500/10 hover:shadow-pink-500/20 transition-all"
                  >
                    {addMemberLoading ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;
