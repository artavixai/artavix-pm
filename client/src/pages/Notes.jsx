import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { noteService } from '../services/apiService';
import toast from 'react-hot-toast';
import moment from 'jalali-moment';
import CustomDatePicker from '../components/common/CustomDatePicker';
import CustomTextEditor from '../components/common/CustomTextEditor';

const BellIcon = ({ className = "w-4 h-4 mr-1 text-slate-400" }) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path></svg>;
const PlusIcon = () => <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"></path></svg>;

const NoteModal = ({ note, isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Personal');
  const [reminderDate, setReminderDate] = useState(''); 
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderOffset, setReminderOffset] = useState(0);

  useEffect(() => {
    if (isOpen) {
      if (note) {
        setTitle(note.title || '');
        setContent(note.content || '');
        setCategory(note.category || 'Personal');
        if (note.reminderDate) {
          const m = moment(note.reminderDate);
          setReminderDate(m.isValid() ? m.format('YYYY/MM/DD') : '');
          setReminderTime(m.isValid() ? m.format('HH:mm') : '09:00');
          setReminderOffset(note.reminderOffsetMinutes ?? 0); 
        } else {
          setReminderDate('');
          setReminderTime('09:00');
          setReminderOffset(0);
        }
      } else { 
        setTitle(''); 
        setContent(''); 
        setCategory('Personal');
        setReminderDate(''); 
        setReminderTime('09:00'); 
        setReminderOffset(0);
      }
    }
  }, [note, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Note title cannot be empty."); return; }
    let finalReminderDate = null;
    if (reminderDate) {
      const [hour, minute] = reminderTime.split(':').map(Number);
      const m = moment(reminderDate, 'YYYY/MM/DD').hour(hour || 0).minute(minute || 0).second(0).millisecond(0);
      finalReminderDate = m.toISOString();
    }
    onSave({ id: note?.id, title, content, category, reminderDate: finalReminderDate, reminderOffsetMinutes: reminderOffset });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" dir="ltr">
      <div className="flat-card rounded-2xl p-8 max-w-3xl w-full bg-white shadow-2xl">
        <h3 className="text-xl font-bold text-slate-800 mb-6">{note ? 'Edit Note' : 'New Note'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-bold text-slate-700 mb-2">Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="flat-input w-full text-xs py-2" /></div>
            <div><label className="block text-xs font-bold text-slate-700 mb-2">Category</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="flat-input w-full text-xs py-2"><option value="Personal">Personal</option><option value="Work">Work</option><option value="Idea">Idea</option><option value="Meeting">Meeting</option></select></div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Content</label>
            <CustomTextEditor value={content} onChange={setContent} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-2">Reminder Date</label>
              <CustomDatePicker value={reminderDate} onChange={setReminderDate} />
            </div>
            <div><label className="block text-xs font-bold text-slate-700 mb-2">Reminder Time</label><input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="flat-input w-full text-xs py-2" /></div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Alert Offset</label>
              <select value={reminderOffset} onChange={(e) => setReminderOffset(Number(e.target.value))} className="flat-input w-full text-xs py-2">
                <option value={0}>At time of event</option>
                <option value={5}>5 minutes before</option>
                <option value={15}>15 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
              </select>
            </div>
          </div>
          <div className="flex space-x-3 pt-4"><button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md">Save</button><button type="button" onClick={onClose} className="flex-1 flat-button px-6 py-3 rounded-xl font-bold text-xs">Cancel</button></div>
        </form>
      </div>
    </div>
  );
};

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const categoryStyles = {
    'Personal': { bg: 'bg-purple-50', border: 'border-purple-300', iconBg: 'bg-purple-100', iconText: 'text-purple-600' },
    'Work': { bg: 'bg-blue-50', border: 'border-blue-300', iconBg: 'bg-blue-100', iconText: 'text-blue-600' },
    'Idea': { bg: 'bg-amber-50', border: 'border-amber-300', iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
    'Meeting': { bg: 'bg-emerald-50', border: 'border-emerald-300', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
    'default': { bg: 'bg-slate-50', border: 'border-slate-300', iconBg: 'bg-slate-100', iconText: 'text-slate-600' },
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await noteService.getAll();
      setNotes(response.data);
      return response.data;
    } catch (error) { 
      console.error("Failed to fetch notes:", error); 
      return [];
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchNotes().then(fetchedNotes => {
      const noteIdToOpen = location.state?.openNoteId;
      if (noteIdToOpen && fetchedNotes.length > 0) {
        const noteToOpen = fetchedNotes.find(n => n.id === noteIdToOpen);
        if (noteToOpen) {
          handleOpenModal(noteToOpen);
          navigate(location.pathname, { replace: true, state: {} });
        }
      }
    });
  }, [location.state]);

  const handleOpenModal = (note = null) => {
    setCurrentNote(note);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentNote(null);
  };

  const handleSaveNote = async (noteData) => {
    try {
      if (noteData.id) { 
        await noteService.update(noteData.id, noteData); 
        toast.success('Note updated successfully.'); 
      } else { 
        await noteService.create(noteData); 
        toast.success('New note created.'); 
      }
      handleCloseModal();
      fetchNotes();
    } catch (error) {
      console.error("Failed to save note:", error);
      toast.error("Error saving note.");
    }
  };

  const handleDeleteNote = async (e, noteId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await noteService.delete(noteId);
        toast.success('Note deleted.');
        fetchNotes();
      } catch (error) {
        console.error("Failed to delete note:", error);
        toast.error("Error deleting note.");
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 text-sm font-medium" dir="ltr">Loading notes...</div>;

  return (
    <div dir="ltr">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-2xl font-black text-slate-800">My Notes</h1><p className="mt-1 text-slate-500 text-xs font-medium">Manage personal notes and ideas</p></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div onClick={() => handleOpenModal()} className="border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center p-6 h-56 cursor-pointer hover:bg-slate-50 hover:border-blue-500 transition-all">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 mb-3"><PlusIcon /></div>
            <h3 className="font-bold text-slate-700 text-sm">New Note</h3>
            <p className="text-xs text-slate-400 mt-1">Click to create</p>
          </div>
          {notes.map(note => {
            const style = categoryStyles[note.category] || categoryStyles.default;
            let displayDate;
            if (note.reminderDate) {
              const reminderMoment = moment(note.reminderDate);
              displayDate = reminderMoment.isValid() ? reminderMoment.format('YYYY/MM/DD - HH:mm') : 'Date Error';
            } else {
              displayDate = moment(note.updatedAt).format('YYYY/MM/DD');
            }
            return (
              <div 
                key={note.id} 
                onClick={() => handleOpenModal(note)}
                className={`relative group rounded-2xl p-5 flex flex-col justify-between h-56 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border cursor-pointer ${style.border} ${style.bg}`}
              >
                <button 
                  onClick={(e) => handleDeleteNote(e, note.id)}
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-white/80 rounded-full text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all z-10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-800 text-base">{note.title}</h3>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.iconBg} ${style.iconText} text-xs font-bold`}>{note.category === 'Idea' ? '💡' : '📄'}</div>
                  </div>
                  <div 
                    className="text-slate-600 mt-2 text-xs leading-relaxed line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: note.content }}
                  />
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center">
                    {note.reminderDate && <BellIcon />} 
                    {displayDate}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <NoteModal 
        isOpen={isModalOpen} 
        note={currentNote} 
        onClose={handleCloseModal} 
        onSave={handleSaveNote} 
      />
    </div>
  );
};

export default Notes;