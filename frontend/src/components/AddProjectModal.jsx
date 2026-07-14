import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { RiCloseLine } from 'react-icons/ri';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const AddProjectModal = ({ isOpen, onClose }) => {
  const { refreshProjects, selectProject } = useApp();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#6366f1');

  const colors = [
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#ef4444', // Red
  ];

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const newProj = await api.createProject({
        ...data,
        color: selectedColor
      });
      await refreshProjects();
      await selectProject(newProj);
      reset();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to create project: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel w-full max-w-md p-6 bg-white dark:bg-[#1c1535] border border-pink-100 dark:border-pink-900/40 text-purple-955 dark:text-purple-100 relative"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 rounded-2xl bg-slate-500/5 dark:bg-white/5 hover:bg-slate-500/10 dark:hover:bg-white/10 text-slate-500 hover:text-purple-955 dark:hover:text-white transition-colors"
        >
          <RiCloseLine className="text-xl" />
        </button>

        <h2 className="text-lg font-bold mb-6 text-purple-955 dark:text-white">Create New Project</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-purple-950 dark:text-slate-300 mb-1">Project Name</label>
            <input
              type="text"
              {...register('name', { required: 'Project name is required' })}
              className="w-full focus:outline-none focus:ring-0"
              placeholder="e.g. Website Redesign"
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-950 dark:text-slate-300 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full focus:outline-none focus:ring-0 resize-none"
              placeholder="Brief overview of the project..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-purple-950 dark:text-slate-300 mb-2">Project Color Badge</label>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    selectedColor === color ? 'border-purple-955 scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-pink-100 dark:border-pink-950/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-500/5 dark:bg-white/5 hover:bg-slate-500/10 dark:hover:bg-white/10 transition-colors text-purple-955 dark:text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary py-2.5 px-5 text-xs font-bold flex items-center justify-center shadow-md shadow-pink-500/10 hover:shadow-pink-500/20 transition-all"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddProjectModal;
