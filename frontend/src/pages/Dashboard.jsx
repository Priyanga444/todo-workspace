import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  RiFolderLine, RiCheckboxCircleLine, RiPlayLine, 
  RiLoader4Line, RiTimeLine, RiPercentLine, RiHistoryLine
} from 'react-icons/ri';

const Dashboard = () => {
  const { currentProject } = useApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [currentProject]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const dashboardStats = await api.getStats();
      setStats(dashboardStats);
      
      const chartsData = await api.getCharts();
      setActivity(chartsData.recentActivity || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] text-slate-400">
        <RiLoader4Line className="text-4xl animate-spin text-pink-500" />
      </div>
    );
  }

  const statCards = [
    { title: 'Total Projects', value: stats?.totalProjects || 0, icon: RiFolderLine, color: 'from-blue-500 to-indigo-500' },
    { title: 'Total Tasks', value: stats?.totalTasks || 0, icon: RiPlayLine, color: 'from-purple-500 to-pink-500' },
    { title: 'Completed Tasks', value: stats?.completedTasks || 0, icon: RiCheckboxCircleLine, color: 'from-emerald-400 to-teal-500' },
    { title: 'In Progress Tasks', value: stats?.inProgressTasks || 0, icon: RiPlayLine, color: 'from-orange-400 to-amber-500' },
    { title: 'Pending Tasks', value: stats?.pendingTasks || 0, icon: RiTimeLine, color: 'from-slate-400 to-slate-500' },
    { title: 'Overdue Tasks', value: stats?.overdueTasks || 0, icon: RiTimeLine, color: 'from-rose-500 to-red-600' },
    { title: 'Productivity Rate', value: `${stats?.productivityPercentage || 0}%`, icon: RiPercentLine, color: 'from-violet-500 to-fuchsia-500' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-purple-955 dark:text-purple-100">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-gradient">Workspace Insights</h1>
        <p className="text-pink-600 dark:text-pink-400 text-sm mt-1">Real-time statistics & team progress overview.</p>
      </div>

      {/* Grid of animated cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ y: -5 }}
            className="glass-panel p-6 bg-white dark:bg-[#1c1535] relative overflow-hidden group border border-pink-100 dark:border-pink-900/40 shadow-sm"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
            
            <div className="flex justify-between items-start mb-4">
              <span className="text-pink-600 dark:text-pink-400 text-xs font-semibold uppercase tracking-wider">{card.title}</span>
              <div className="p-2.5 rounded-xl bg-slate-500/5 dark:bg-white/5 border border-pink-100 dark:border-white/10 text-pink-600 dark:text-slate-350 group-hover:text-pink-500 transition-colors">
                <card.icon className="text-lg" />
              </div>
            </div>
            
            <p className="text-3xl font-bold text-purple-955 dark:text-white tracking-tight relative z-10">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Side-by-side components */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <div className="lg:col-span-2 glass-panel p-6 bg-white dark:bg-[#1c1535] border border-pink-100 dark:border-pink-900/40 flex flex-col max-h-[450px]">
          <div className="flex items-center gap-2 mb-4 border-b border-pink-100 dark:border-pink-900/30 pb-3">
            <RiHistoryLine className="text-pink-500 text-xl" />
            <h3 className="font-bold text-purple-955 dark:text-white text-base">Recent Work Activity</h3>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {activity.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs italic">No activity registered yet.</div>
            ) : (
              activity.map((act) => (
                <div key={act.id} className="flex gap-3 text-xs leading-relaxed items-start">
                  <div className="w-7 h-7 rounded-full bg-pink-600 flex items-center justify-center font-bold text-white uppercase flex-shrink-0">
                    {act.user_photo ? (
                      <img src={act.user_photo} alt={act.user_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      act.user_name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div>
                    <p className="text-purple-900 dark:text-slate-200">
                      <span className="font-bold text-purple-955 dark:text-white">{act.user_name}</span> {act.details}
                    </p>
                    <span className="text-[10px] text-pink-500 dark:text-pink-400 mt-0.5 block">
                      {new Date(act.created_at).toLocaleDateString()} at {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Productivity Circle Info */}
        <div className="glass-panel p-6 bg-white dark:bg-[#1c1535] border border-pink-100 dark:border-pink-900/40 flex flex-col items-center justify-center text-center">
          <h3 className="font-bold text-purple-955 dark:text-white text-base mb-6">Current Completion</h3>
          
          <div className="relative w-36 h-36 flex items-center justify-center mb-6">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-pink-100 dark:stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-pink-500"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 64}
                strokeDashoffset={2 * Math.PI * 64 * (1 - (stats?.productivityPercentage || 0) / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-purple-955 dark:text-white">{stats?.productivityPercentage || 0}%</span>
              <span className="text-[10px] text-pink-600 dark:text-pink-400 uppercase font-semibold mt-1">Completed</span>
            </div>
          </div>

          <p className="text-pink-700 dark:text-purple-300 text-xs leading-relaxed max-w-[200px]">
            Keep tackling your backlogs to bump up this workspace’s performance score!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
