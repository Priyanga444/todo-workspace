import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  RiCloseLine, RiCheckboxLine, RiCheckboxBlankLine, RiDeleteBinLine, 
  RiMessage2Line, RiAttachment2, RiTimeLine, RiAddLine, RiFileCopyLine,
  RiCheckDoubleLine
} from 'react-icons/ri';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const TaskModal = ({ task, isOpen, onClose, onRefresh }) => {
  const { user, currentProject, workspaceMode } = useApp();
  const [activeTab, setActiveTab] = useState('details'); // details, checklist, comments, attachments
  const [checklists, setChecklists] = useState([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState({}); // { checklistId: text }
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [members, setMembers] = useState(currentProject?.members || []);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      title: task?.title,
      description: task?.description,
      priority: task?.priority || 'Medium',
      due_date: task?.due_date ? new Date(task?.due_date).toISOString().substr(0, 10) : '',
      estimated_time: task?.estimated_time || '',
      actual_time: task?.actual_time || '',
      assignee_id: task?.assignee_id || ''
    }
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority || 'Medium',
        due_date: task.due_date ? new Date(task.due_date).toISOString().substr(0, 10) : '',
        estimated_time: task.estimated_time || '',
        actual_time: task.actual_time || '',
        assignee_id: task.assignee_id || ''
      });
      fetchTaskData();
    }
  }, [task, currentProject]);

  const fetchTaskData = async () => {
    try {
      // Checklists
      const cl = await api.getChecklists(task.id);
      setChecklists(cl);
      // Comments
      const comm = await api.getComments(task.id);
      setComments(comm);
      // Attachments
      const att = await api.getAttachmentsByTask(task.id);
      setAttachments(att);

      // Fetch project members for assignment
      if (currentProject) {
        const proj = await api.getProject(currentProject.id);
        setMembers(proj.members || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onSubmit = async (data) => {
    try {
      await api.updateTask(task.id, {
        ...data,
        estimated_time: data.estimated_time ? parseInt(data.estimated_time) : null,
        actual_time: data.actual_time ? parseInt(data.actual_time) : null,
        assignee_id: data.assignee_id ? parseInt(data.assignee_id) : null
      });
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to update task');
    }
  };

  const handleDuplicate = async () => {
    try {
      await api.duplicateTask(task.id);
      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to duplicate task');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.deleteTask(task.id);
        onRefresh();
        onClose();
      } catch (err) {
        console.error(err);
        alert('Failed to delete task');
      }
    }
  };

  // Checklist Actions
  const handleAddChecklist = async () => {
    if (!newChecklistTitle) return;
    try {
      const cl = await api.createChecklist({ taskId: task.id, title: newChecklistTitle });
      setChecklists([...checklists, cl]);
      setNewChecklistTitle('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddChecklistItem = async (checklistId) => {
    const content = newChecklistItem[checklistId];
    if (!content) return;
    try {
      const item = await api.createChecklistItem({ checklistId, content });
      setChecklists(checklists.map(cl => {
        if (cl.id === checklistId) {
          return { ...cl, items: [...cl.items, item] };
        }
        return cl;
      }));
      setNewChecklistItem({ ...newChecklistItem, [checklistId]: '' });
      onRefresh(); // Refresh board count
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleChecklistItem = async (item) => {
    try {
      const updated = await api.toggleChecklistItem(item.id, !item.is_completed);
      setChecklists(checklists.map(cl => {
        if (cl.id === item.checklist_id) {
          return {
            ...cl,
            items: cl.items.map(i => i.id === item.id ? updated : i)
          };
        }
        return cl;
      }));
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Comments Actions
  const handleAddComment = async () => {
    if (!newComment) return;
    try {
      const comm = await api.createComment({ taskId: task.id, content: newComment });
      setComments([...comments, comm]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  // Attachments Actions
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', task.id);

    try {
      let uploadUrl = `http://${window.location.hostname}:5000/api/attachments`;
      if (window.location.hostname.includes('-5173')) {
        const backendHost = window.location.host.replace('-5173', '-5000');
        uploadUrl = `https://${backendHost}/api/attachments`;
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const att = await response.json();
      setAttachments([att, ...attachments]);
    } catch (err) {
      console.error(err);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-955/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel w-full max-w-3xl p-6 bg-white dark:bg-[#1c1535] border border-pink-100 dark:border-pink-900/40 text-purple-955 dark:text-purple-100 relative max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-pink-100 dark:border-pink-950/40">
          <div>
            <span className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wide">Task Editor</span>
            <h2 className="text-lg font-bold text-purple-955 dark:text-white mt-1">{task.title}</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleDuplicate}
              className="p-2.5 rounded-2xl bg-slate-500/5 dark:bg-white/5 hover:bg-pink-500/10 text-slate-500 dark:text-slate-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
              title="Duplicate Task"
            >
              <RiFileCopyLine className="text-lg" />
            </button>
            <button 
              onClick={handleDelete}
              className="p-2.5 rounded-2xl bg-slate-500/5 dark:bg-white/5 hover:bg-rose-500/10 text-slate-500 dark:text-slate-300 hover:text-rose-500 transition-colors"
              title="Delete Task"
            >
              <RiDeleteBinLine className="text-lg" />
            </button>
            <button 
              onClick={onClose} 
              className="p-2.5 rounded-2xl bg-slate-500/5 dark:bg-white/5 hover:bg-slate-500/10 dark:hover:bg-white/10 text-slate-500 dark:text-slate-450 hover:text-purple-950 dark:hover:text-white transition-colors"
            >
              <RiCloseLine className="text-lg" />
            </button>
          </div>
        </div>

        {/* Tab Nav */}
        <div className="flex gap-2 border-b border-pink-100 dark:border-pink-955/40 my-4">
          {['details', 'checklist', 'comments', 'attachments'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 text-sm font-semibold capitalize transition-all ${
                activeTab === tab 
                  ? 'border-pink-500 text-pink-600 dark:text-pink-400 font-bold' 
                  : 'border-transparent text-slate-400 dark:text-slate-450 hover:text-pink-600 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {activeTab === 'details' && (
            <form id="task-details-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-450 mb-1 uppercase">Title</label>
                  <input
                    type="text"
                    {...register('title')}
                    className="w-full focus:outline-none focus:ring-0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-450 mb-1 uppercase">Description</label>
                  <textarea
                    {...register('description')}
                    rows={6}
                    className="w-full focus:outline-none focus:ring-0 resize-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-450 mb-1 uppercase">Priority</label>
                    <select
                      {...register('priority')}
                      className="w-full focus:outline-none focus:ring-0"
                    >
                      <option className="bg-white dark:bg-[#1c1535]" value="High">High</option>
                      <option className="bg-white dark:bg-[#1c1535]" value="Medium">Medium</option>
                      <option className="bg-white dark:bg-[#1c1535]" value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-450 mb-1 uppercase">Due Date</label>
                    <input
                      type="date"
                      {...register('due_date')}
                      className="w-full focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-450 mb-1 uppercase">Est. Time (min)</label>
                    <input
                      type="number"
                      {...register('estimated_time')}
                      className="w-full focus:outline-none focus:ring-0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-450 mb-1 uppercase">Act. Time (min)</label>
                    <input
                      type="number"
                      {...register('actual_time')}
                      className="w-full focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>

                {workspaceMode === 'team' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-450 mb-1 uppercase">Assignee</label>
                    <select
                      {...register('assignee_id')}
                      className="w-full focus:outline-none focus:ring-0"
                    >
                      <option className="bg-white dark:bg-[#1c1535]" value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.id} className="bg-white dark:bg-[#1c1535]" value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </form>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-6">
              {/* Add checklist */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  placeholder="New Checklist Name..."
                  className="flex-1 focus:outline-none focus:ring-0"
                />
                <button 
                  onClick={handleAddChecklist}
                  className="btn-primary py-2 px-4 flex items-center gap-1 text-sm font-semibold"
                >
                  <RiAddLine /> Add Checklist
                </button>
              </div>

              {/* Lists */}
              <div className="space-y-4">
                {checklists.map((cl) => (
                  <div key={cl.id} className="p-4 rounded-xl bg-slate-500/5 dark:bg-white/5 border border-pink-100 dark:border-pink-955/40">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-sm text-pink-600 dark:text-pink-400">{cl.title}</h4>
                      <button 
                        onClick={async () => {
                          await api.deleteChecklist(cl.id);
                          setChecklists(checklists.filter(c => c.id !== cl.id));
                        }}
                        className="text-slate-500 hover:text-rose-400 text-xs"
                      >
                        Delete List
                      </button>
                    </div>

                    {/* Progress Bar */}
                    {cl.items.length > 0 && (
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-pink-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${(cl.items.filter(i => i.is_completed).length / cl.items.length) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-455 font-bold">
                          {Math.round((cl.items.filter(i => i.is_completed).length / cl.items.length) * 100)}%
                        </span>
                      </div>
                    )}

                    {/* Items */}
                    <div className="space-y-2 mb-3">
                      {cl.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm group">
                          <button
                            onClick={() => handleToggleChecklistItem(item)}
                            className="flex items-center gap-2 text-purple-950 dark:text-slate-300 hover:text-pink-650 dark:hover:text-white text-left flex-1"
                          >
                            {item.is_completed ? (
                              <RiCheckboxLine className="text-pink-500 text-lg flex-shrink-0" />
                            ) : (
                              <RiCheckboxBlankLine className="text-slate-400 dark:text-slate-500 text-lg flex-shrink-0" />
                            )}
                            <span className={item.is_completed ? 'line-through text-slate-450 dark:text-slate-500' : ''}>{item.content}</span>
                          </button>
                          <button
                            onClick={async () => {
                              await api.deleteChecklistItem(item.id);
                              setChecklists(checklists.map(c => c.id === cl.id ? { ...c, items: c.items.filter(i => i.id !== item.id) } : c));
                            }}
                            className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Item */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newChecklistItem[cl.id] || ''}
                        onChange={(e) => setNewChecklistItem({ ...newChecklistItem, [cl.id]: e.target.value })}
                        placeholder="Add checklist item..."
                        className="flex-1 focus:outline-none focus:ring-0 text-xs"
                      />
                      <button 
                        onClick={() => handleAddChecklistItem(cl.id)}
                        className="px-3.5 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-xl text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Comment form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type a comment..."
                  className="flex-1 focus:outline-none focus:ring-0"
                />
                <button 
                  onClick={handleAddComment}
                  className="btn-primary py-2 px-4 flex items-center gap-1 text-sm font-semibold"
                >
                  Post
                </button>
              </div>

              {/* Comments Feed */}
              <div className="space-y-4 mt-4">
                {comments.map((comm) => (
                  <div key={comm.id} className="flex gap-3 p-3 rounded-xl bg-slate-500/5 dark:bg-white/5 border border-pink-100 dark:border-pink-955/40 text-sm">
                    <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center font-bold text-white uppercase flex-shrink-0">
                      {comm.user_photo ? (
                        <img src={comm.user_photo} alt={comm.user_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        comm.user_name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-purple-955 dark:text-white text-xs">{comm.user_name}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(comm.created_at).toLocaleDateString()} {new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-purple-950 dark:text-slate-300 leading-relaxed text-xs break-words">{comm.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4">
              {/* Upload Input */}
              <div className="flex items-center justify-center border-2 border-dashed border-pink-200 dark:border-pink-900/30 rounded-2xl p-6 bg-slate-500/5 dark:bg-white/5 hover:bg-pink-500/5 transition-all cursor-pointer relative">
                <input 
                  type="file" 
                  onChange={handleFileUpload} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  disabled={uploading}
                />
                <div className="text-center">
                  <RiAttachment2 className="text-3xl text-pink-500 mx-auto mb-2" />
                  <span className="text-sm font-semibold text-purple-950 dark:text-slate-300">{uploading ? 'Uploading...' : 'Click to upload attachment'}</span>
                </div>
              </div>

              {/* Attachments list */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-500/5 dark:bg-white/5 border border-pink-100 dark:border-pink-955/40 group">
                    <div className="flex items-center gap-2 min-w-0">
                      <RiAttachment2 className="text-pink-500 text-lg flex-shrink-0" />
                      <a 
                        href={`http://localhost:5000${att.file_url}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-purple-955 dark:text-slate-300 hover:text-pink-500 truncate"
                      >
                        {att.file_name}
                      </a>
                    </div>
                    <button
                      onClick={async () => {
                        await api.deleteAttachment(att.id);
                        setAttachments(attachments.filter(a => a.id !== att.id));
                      }}
                      className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-pink-100 dark:border-pink-950/40 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-slate-500/5 dark:bg-white/5 hover:bg-slate-500/10 dark:hover:bg-white/10 transition-colors text-purple-955 dark:text-slate-300 text-xs font-bold"
          >
            Close
          </button>
          {activeTab === 'details' && (
            <button
              type="submit"
              form="task-details-form"
              className="btn-primary py-2 px-5 text-sm font-semibold"
            >
              Save Changes
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TaskModal;
