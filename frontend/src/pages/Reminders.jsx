import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { 
  RiAlarmWarningLine, RiTimeLine, RiAddLine, 
  RiMailSendLine, RiDeleteBin7Line, RiLoader4Line 
} from 'react-icons/ri';

const Reminders = () => {
  const { user } = useApp();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const data = await api.getReminders();
      setReminders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    setFeedback('');
    try {
      // Combines Date and Time properly
      const remindAt = new Date(`${data.date}T${data.time}`);
      
      if (remindAt <= new Date()) {
        setFeedback('Error: The reminder date/time must be in the future.');
        setSubmitting(false);
        return;
      }

      await api.createReminder({
        message: data.message,
        remind_at: remindAt.toISOString()
      });

      setFeedback('Success: Reminder scheduled successfully!');
      reset();
      fetchReminders();
    } catch (err) {
      console.error(err);
      setFeedback('Error: Failed to schedule reminder.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteReminder(id);
      setReminders(reminders.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-purple-955 dark:text-purple-100 h-[calc(100vh-4rem)] flex flex-col min-h-0">
      
      {/* Header */}
      <div className="border-b border-pink-100 dark:border-pink-900/40 pb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gradient">Scheduled Email Alerts</h1>
        <p className="text-pink-600 dark:text-pink-400 text-xs mt-1">
          Set custom messages to automatically send to your login email address (<strong>{user?.email}</strong>) on a specific date.
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex-shrink-0 ${
          feedback.includes('Success') 
            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
        }`}>
          {feedback}
        </div>
      )}

      {/* Grid Content */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Side: Create Form */}
        <div className="md:col-span-5 flex flex-col">
          <div className="glass-panel p-6 bg-white dark:bg-[#1c1535] border border-pink-100 dark:border-pink-900/40 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6 border-b border-pink-50 dark:border-purple-900/20 pb-2">
                <RiAlarmWarningLine className="text-pink-500 text-lg" />
                <h3 className="font-bold text-sm">Schedule Alert</h3>
              </div>

              <form id="reminder-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-purple-800 dark:text-purple-300 mb-1.5 uppercase tracking-wider">Date</label>
                    <input
                      type="date"
                      {...register('date', { required: 'Date is required' })}
                      className="w-full text-xs focus:outline-none focus:ring-0"
                    />
                    {errors.date && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.date.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-purple-800 dark:text-purple-300 mb-1.5 uppercase tracking-wider">Time</label>
                    <input
                      type="time"
                      {...register('time', { required: 'Time is required' })}
                      className="w-full text-xs focus:outline-none focus:ring-0"
                      style={{ padding: '10px 16px', borderRadius: '14px', border: '2px solid rgba(217, 70, 239, 0.4)' }}
                    />
                    {errors.time && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.time.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-purple-800 dark:text-purple-300 mb-1.5 uppercase tracking-wider">Reminder Message</label>
                  <textarea
                    {...register('message', { required: 'Message is required' })}
                    rows={4}
                    placeholder="Type reminder details here..."
                    className="w-full text-xs focus:outline-none focus:ring-0 resize-none"
                  />
                  {errors.message && <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.message.message}</p>}
                </div>
              </form>
            </div>

            <button
              type="submit"
              form="reminder-form"
              disabled={submitting}
              className="w-full btn-primary mt-6 py-3 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/10 hover:shadow-pink-500/20 transition-all"
            >
              {submitting ? (
                <RiLoader4Line className="text-sm animate-spin" />
              ) : (
                <RiAddLine className="text-sm" />
              )}
              Schedule Email Alert
            </button>
          </div>
        </div>

        {/* Right Side: Reminders List */}
        <div className="md:col-span-7 flex flex-col min-h-0">
          <div className="glass-panel p-6 bg-white dark:bg-[#1c1535] border border-pink-100 dark:border-pink-900/40 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4 border-b border-pink-50 dark:border-purple-900/20 pb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <RiMailSendLine className="text-pink-500 text-lg" />
                <h3 className="font-bold text-sm">Active Queued Alerts</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-pink-500 tracking-wider">
                {reminders.length} Scheduled
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <RiLoader4Line className="text-3xl text-pink-500 animate-spin" />
                  <p className="text-slate-500 text-xs mt-2 italic">Loading queued reminders...</p>
                </div>
              ) : reminders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                  <div className="p-4 bg-pink-100/30 rounded-full text-pink-500">
                    <RiTimeLine className="text-3xl" />
                  </div>
                  <p className="text-slate-500 text-xs italic">No scheduled reminders queued.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {reminders.map((reminder) => {
                    const remindTime = new Date(reminder.remind_at);
                    
                    return (
                      <motion.div
                        key={reminder.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 rounded-2xl bg-[#faf8ff] dark:bg-[#120c24] border border-pink-100 dark:border-pink-900/30 flex justify-between items-center group hover:border-pink-400 transition-colors duration-300"
                      >
                        <div className="min-w-0 pr-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              reminder.is_sent 
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                                : 'bg-pink-500/10 text-pink-600 border border-pink-500/20'
                            }`}>
                              {reminder.is_sent ? 'Sent' : 'Pending'}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                              <RiTimeLine className="text-pink-500" />
                              <span>{remindTime.toLocaleString()}</span>
                            </div>
                          </div>
                          <h4 className="font-semibold text-xs text-purple-955 dark:text-white mt-2 leading-relaxed break-words">{reminder.message}</h4>
                        </div>

                        <button
                          onClick={() => handleDelete(reminder.id)}
                          className="p-2 rounded-xl bg-slate-500/5 dark:bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Delete Reminder"
                        >
                          <RiDeleteBin7Line className="text-base" />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Reminders;
