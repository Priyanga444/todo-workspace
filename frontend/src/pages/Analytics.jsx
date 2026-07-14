import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { RiBarChart2Line, RiLoader4Line } from 'react-icons/ri';

const Analytics = () => {
  const { currentProject, darkMode } = useApp();
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartsData();
  }, [currentProject]);

  const fetchChartsData = async () => {
    setLoading(true);
    try {
      const data = await api.getCharts();
      setCharts(data);
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

  const COLORS = ['#d946ef', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const priorityPieData = charts?.priorityData.map(d => ({ name: d.priority, value: parseInt(d.count) })) || [];
  const statusPieData = charts?.statusData.map(d => ({ name: d.status, value: parseInt(d.count) })) || [];

  // Dynamic colors for dark vs light modes to avoid white-on-white text issues
  const axisStroke = darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(15, 23, 42, 0.5)';
  const gridStroke = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(15, 23, 42, 0.08)';
  const tooltipStyle = darkMode 
    ? { backgroundColor: '#1c1535', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' } 
    : { backgroundColor: '#ffffff', borderColor: 'rgba(217, 70, 239, 0.2)', borderRadius: '12px', color: '#0f0828' };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 overflow-y-auto">
      {/* Title */}
      <div className="flex items-center gap-2 pb-4 border-b border-pink-100 dark:border-pink-900/40">
        <RiBarChart2Line className="text-2xl text-pink-500" />
        <div>
          <h1 className="text-2xl font-bold text-gradient">Workspace Insights</h1>
          <p className="text-pink-600 dark:text-pink-400 text-xs mt-1">Analytics charts mapping project completions and status distributions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Completions */}
        <div className="glass-panel p-6 bg-white dark:bg-[#1c1535] border border-pink-100 dark:border-pink-900/40 h-[320px] flex flex-col">
          <h3 className="text-sm font-bold text-purple-950 dark:text-white mb-4">Tasks Completed Per Month</h3>
          <div className="flex-1 min-h-0 text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="month" stroke={axisStroke} />
                <YAxis stroke={axisStroke} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#d946ef" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Progress */}
        <div className="glass-panel p-6 bg-white dark:bg-[#1c1535] border border-pink-100 dark:border-pink-900/40 h-[320px] flex flex-col">
          <h3 className="text-sm font-bold text-purple-950 dark:text-white mb-4">Project Completion Progress</h3>
          <div className="flex-1 min-h-0 text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.projectProgress || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis type="number" domain={[0, 100]} stroke={axisStroke} />
                <YAxis dataKey="name" type="category" stroke={axisStroke} width={100} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="progress" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Pie */}
        <div className="glass-panel p-6 bg-white dark:bg-[#1c1535] border border-pink-100 dark:border-pink-900/40 h-[320px] flex flex-col items-center">
          <h3 className="text-sm font-bold text-purple-955 dark:text-white mb-4 self-start">Tasks by Priority</h3>
          <div className="flex-1 w-full min-h-0 text-[10px] flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {priorityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend formatter={(val) => <span className="text-purple-900 dark:text-slate-300 text-xs font-semibold">{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Pie */}
        <div className="glass-panel p-6 bg-white dark:bg-[#1c1535] border border-pink-100 dark:border-pink-900/40 h-[320px] flex flex-col items-center">
          <h3 className="text-sm font-bold text-purple-955 dark:text-white mb-4 self-start">Tasks by Status</h3>
          <div className="flex-1 w-full min-h-0 text-[10px] flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend formatter={(val) => <span className="text-purple-900 dark:text-slate-300 text-xs font-semibold">{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
