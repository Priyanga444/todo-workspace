import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { 
  RiFileTextLine, 
  RiAddLine, 
  RiDeleteBinLine, 
  RiFileLine, 
  RiDownload2Line, 
  RiSearchLine, 
  RiEyeLine,
  RiArrowRightUpLine,
  RiFullscreenLine,
  RiFullscreenExitLine,
  RiCloseLine
} from 'react-icons/ri';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Note editing state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Full Screen toggle state
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const data = await api.getNotes();
      setNotes(data);
      if (data.length > 0 && !selectedNote) {
        selectNote(data[0]);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load notes');
    }
  };

  const selectNote = (note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content || '');
  };

  const handleCreateTextNote = async () => {
    try {
      const formData = new FormData();
      formData.append('title', 'New Text Note');
      formData.append('content', 'Start typing here...');
      
      const newNote = await api.createNote(formData);
      setNotes([newNote, ...notes]);
      selectNote(newNote);
      setSuccessMsg('Note created successfully');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to create note');
    }
  };

  const handlePdfImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrorMsg('Only PDF files can be imported');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace('.pdf', '') + ' (Imported PDF)');
      formData.append('content', 'PDF Document Imported.');

      const newNote = await api.createNote(formData);
      setNotes([newNote, ...notes]);
      selectNote(newNote);
      setSuccessMsg('PDF imported successfully');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to import PDF');
    } finally {
      setIsUploading(false);
      e.target.value = null; // Reset file input
    }
  };

  const handleUpdateNote = async () => {
    if (!selectedNote) return;
    try {
      const updated = await api.updateNote(selectedNote.id, {
        title: editTitle,
        content: editContent
      });
      setNotes(notes.map(n => n.id === selectedNote.id ? updated : n));
      setSelectedNote(updated);
      setSuccessMsg('Note saved');
      setTimeout(() => setSuccessMsg(''), 1500);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to save note');
    }
  };

  const handleDeleteNote = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await api.deleteNote(id);
      const filtered = notes.filter(n => n.id !== id);
      setNotes(filtered);
      
      // If we deleted the active note, fallback to the next one, or null
      if (selectedNote?.id === id) {
        if (filtered.length > 0) {
          selectNote(filtered[0]);
        } else {
          setSelectedNote(null);
          setEditTitle('');
          setEditContent('');
          setIsFullScreen(false);
        }
      }
      setSuccessMsg('Note deleted');
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to delete note');
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getBackendUrl = (path) => {
    const backendHost = window.location.hostname === 'localhost' 
      ? 'localhost:5000' 
      : window.location.host.replace('-5173', '-5000');
    
    const protocol = window.location.protocol;
    return `${protocol}//${backendHost}${path}`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 h-[calc(100vh-80px)] flex flex-col">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-pink-655 to-violet-655 bg-clip-text text-transparent">My Notes Console</h1>
          <p className="text-xs text-slate-500 font-medium">Draft text notes or import external PDF references</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateTextNote}
            className="btn-primary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-500/10 cursor-pointer"
          >
            <RiAddLine className="text-base" />
            New Text Note
          </button>
          
          <label className="btn-glass py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-pink-200 cursor-pointer hover:bg-pink-500/5 transition-all">
            <RiFileLine className="text-base text-pink-500" />
            Import PDF
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handlePdfImport} 
              className="hidden" 
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* Main split work console */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0 overflow-hidden relative">
        
        {/* Left Side: Notes list */}
        <div className="md:col-span-4 flex flex-col gap-4 min-h-0">
          <div className="relative flex-shrink-0">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm z-10" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-white/50 dark:bg-white/5 border border-pink-200 dark:border-pink-900/30 text-slate-800 placeholder-slate-400 rounded-xl"
              placeholder="Search note titles or contents..."
            />
          </div>

          {/* Notes list block */}
          <div className="flex-grow overflow-y-auto pr-1 space-y-2">
            {isUploading && (
              <div className="p-4 bg-white/40 border border-pink-100 rounded-2xl flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                <span className="text-xs font-bold text-pink-600">Uploading PDF document...</span>
              </div>
            )}

            {filteredNotes.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 italic bg-white/30 border border-dashed border-slate-200 rounded-2xl">
                No notes found. Create a text note or upload a PDF document.
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = selectedNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`p-4 border transition-all rounded-2xl cursor-pointer relative group flex flex-col gap-1.5 ${
                      isSelected 
                        ? 'bg-pink-500/10 border-pink-400/80 shadow-md shadow-pink-500/5' 
                        : 'bg-white/40 border-slate-200/50 hover:bg-white/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {note.file_url ? (
                          <RiFileLine className="text-pink-550 flex-shrink-0 text-base" />
                        ) : (
                          <RiFileTextLine className="text-violet-550 flex-shrink-0 text-base" />
                        )}
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{note.title}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      >
                        <RiDeleteBinLine className="text-xs" />
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-500 line-clamp-2 pr-4 leading-relaxed">
                      {note.content || 'Empty note.'}
                    </p>

                    <span className="text-[9px] text-slate-400 font-medium self-end">
                      {new Date(note.updated_at).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Desktop-Only Editor or PDF Panel */}
        <div className={isFullScreen 
          ? "fixed inset-0 z-50 bg-[#fff9fc] dark:bg-[#1a0b2e] p-6 sm:p-8 flex flex-col overflow-hidden"
          : "hidden md:flex md:col-span-8 flex-col min-h-0 bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-3xl overflow-hidden"
        }>
          {errorMsg && (
            <div className="p-3 m-4 bg-rose-500/10 border border-rose-500/20 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 m-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {successMsg}
            </div>
          )}

          {selectedNote ? (
            <div className="flex-1 flex flex-col min-h-0 relative">
              {/* Note Toolbar Header */}
              <div className="p-4 border-b border-slate-200/50 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
                <input 
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleUpdateNote}
                  className="bg-transparent border-none text-sm font-bold text-slate-800 dark:text-white focus:outline-none w-full max-w-sm"
                  placeholder="Note Title"
                />

                <div className="flex items-center gap-2">
                  {selectedNote.file_url && (
                    <a
                      href={getBackendUrl(selectedNote.file_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-glass py-1.5 px-3 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-pink-200 transition-all"
                    >
                      <RiArrowRightUpLine className="text-xs" />
                      Open Full PDF
                    </a>
                  )}

                  {/* Distraction-Free Fullscreen Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="btn-glass p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all flex items-center justify-center border border-slate-200 cursor-pointer"
                    title={isFullScreen ? "Exit Fullscreen" : "Fullscreen Mode"}
                  >
                    {isFullScreen ? <RiFullscreenExitLine className="text-sm text-pink-500" /> : <RiFullscreenLine className="text-sm" />}
                  </button>

                  {/* Dedicated Delete Button inside Note Editor Toolbar */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteNote(selectedNote.id, e)}
                    className="btn-glass py-1.5 px-3 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-rose-200 hover:bg-rose-500/10 text-rose-600 transition-all cursor-pointer"
                  >
                    <RiDeleteBinLine className="text-xs" />
                    Delete Note
                  </button>

                  <button
                    onClick={handleUpdateNote}
                    className="btn-primary py-1.5 px-4 rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    Save Note
                  </button>
                </div>
              </div>

              {/* Editor Workspace Split */}
              <div className="flex-grow flex flex-col lg:flex-row min-h-0">
                {/* Text Editor Panel */}
                <div className={`flex-1 flex flex-col p-6 min-h-0 ${selectedNote.file_url ? 'lg:border-r lg:border-slate-200/50 lg:w-1/2' : 'w-full'}`}>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleUpdateNote}
                    className="w-full flex-grow bg-transparent border-none focus:outline-none resize-none text-xs text-slate-700 dark:text-slate-300 leading-relaxed"
                    placeholder="Write your note markdown or content here..."
                  />
                  {selectedNote.file_url && (
                    <div className="mt-4 p-3 bg-pink-500/5 border border-pink-200/50 rounded-xl flex items-center justify-between gap-2 flex-shrink-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <RiFileLine className="text-pink-500 text-lg flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-700 truncate">{selectedNote.file_name}</p>
                          <p className="text-[8px] text-slate-400">Imported reference PDF</p>
                        </div>
                      </div>
                      <a 
                        href={getBackendUrl(selectedNote.file_url)} 
                        download
                        className="p-1.5 rounded-lg text-pink-550 hover:bg-pink-500/10 transition-all"
                      >
                        <RiDownload2Line className="text-xs" />
                      </a>
                    </div>
                  )}
                </div>

                {/* PDF Viewer Panel (Visible only if note has a PDF URL) */}
                {selectedNote.file_url && (
                  <div className="flex-1 lg:w-1/2 h-full min-h-[300px] lg:min-h-0 bg-slate-900 flex flex-col">
                    <div className="p-2.5 bg-slate-800 text-slate-300 text-[9px] font-bold uppercase tracking-wider flex items-center justify-between flex-shrink-0">
                      <span>Interactive PDF Document Viewer</span>
                      <RiEyeLine className="text-xs text-pink-500 animate-pulse" />
                    </div>
                    <iframe
                      src={getBackendUrl(selectedNote.file_url)}
                      className="w-full flex-grow border-none"
                      title="PDF Document"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
              <div className="p-5 rounded-full bg-pink-500/5 mb-3">
                <RiFileTextLine className="text-3xl text-pink-550 animate-bounce" />
              </div>
              <h3 className="font-bold text-sm text-slate-850 dark:text-slate-100">Select or Create a Note</h3>
              <p className="text-[11px] text-slate-400 mt-1.5 max-w-xs font-medium">
                Tap an existing card from the left panel, or spawn a new note workspace.
              </p>
              <button
                onClick={handleCreateTextNote}
                className="btn-primary mt-4 py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-lg shadow-pink-500/10"
              >
                <RiAddLine className="text-sm" />
                New Text Note
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Mobile Pop-up Dialog Modal Overlay (Centered Screen popup) */}
      {selectedNote && !isFullScreen && (
        <div className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in-50 duration-200">
          <div className="glass-card bg-[#fff9fc]/98 dark:bg-[#1a0b2e]/98 w-full max-w-sm p-5 rounded-3xl shadow-2xl relative flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Close trigger button */}
            <button
              onClick={() => {
                setSelectedNote(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/50 border border-slate-200 text-slate-655 hover:text-slate-900 cursor-pointer z-30"
              title="Close Note"
            >
              <RiCloseLine className="text-base font-bold" />
            </button>

            {/* Note title input inside Mobile Popup Modal */}
            <div className="pr-10 mb-4 flex-shrink-0">
              <input 
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleUpdateNote}
                className="w-full bg-transparent border-none text-sm font-bold text-slate-800 dark:text-white focus:outline-none"
                placeholder="Note Title"
              />
              <p className="text-[8px] text-pink-500 font-bold mt-0.5">Title edits auto-save</p>
            </div>

            {/* Note text editor inside Mobile Popup Modal */}
            <div className="flex-1 min-h-0 flex flex-col mb-4">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onBlur={handleUpdateNote}
                className="w-full flex-grow bg-transparent border border-pink-100 dark:border-white/5 p-3 rounded-2xl focus:outline-none resize-none text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed min-h-[160px]"
                placeholder="Type your notes content..."
              />
              {selectedNote.file_url && (
                <div className="mt-3 p-2.5 bg-pink-500/5 border border-pink-200/50 rounded-xl flex items-center justify-between gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <RiFileLine className="text-pink-500 text-base flex-shrink-0" />
                    <span className="text-[9px] font-bold text-slate-700 truncate">{selectedNote.file_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a 
                      href={getBackendUrl(selectedNote.file_url)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                    >
                      <RiEyeLine className="text-xs" />
                    </a>
                    <a 
                      href={getBackendUrl(selectedNote.file_url)} 
                      download 
                      className="p-1 rounded bg-white border border-slate-200 text-slate-655 hover:text-slate-900"
                    >
                      <RiDownload2Line className="text-xs" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons inside Mobile Popup Modal */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200/50 pt-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsFullScreen(true)}
                className="btn-glass p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center border border-slate-200 cursor-pointer"
                title="Fullscreen Mode"
              >
                <RiFullscreenLine className="text-xs" />
              </button>
              
              <button
                type="button"
                onClick={(e) => handleDeleteNote(selectedNote.id, e)}
                className="btn-glass py-2 px-3 rounded-xl text-[10px] font-bold flex items-center gap-1 border border-rose-200 hover:bg-rose-500/10 text-rose-600 cursor-pointer"
              >
                <RiDeleteBinLine className="text-xs" />
                Delete
              </button>

              <button
                type="button"
                onClick={() => {
                  handleUpdateNote();
                  setSelectedNote(null);
                }}
                className="btn-primary py-2 px-4 rounded-xl text-[10px] font-bold cursor-pointer"
              >
                Save & Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Notes;
