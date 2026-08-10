import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Icons } from '../icons';
import CustomDatePicker from '../common/CustomDatePicker';
import CustomTextEditor from '../common/CustomTextEditor';
import moment from 'moment';
import { userService } from '../../services/apiService';
import toast from 'react-hot-toast';

const MeetingModal = ({
  isOpen = false,
  onClose = () => {},
  onSave = () => {},
  onDelete = () => {},
  selectedMeeting = null,
  initialDate = null,
  projectId = null
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [participants, setParticipants] = useState([]);
  const [agenda, setAgenda] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoadingUsers(true);
      userService.getAll().then(res => {
        setAvailableUsers(res.data || []);
      }).catch(err => {
        console.error("Error fetching users:", err);
        toast.error("Error fetching users list");
      }).finally(() => setLoadingUsers(false));

      if (selectedMeeting) {
        setTitle(selectedMeeting.title || '');
        const startMoment = moment(selectedMeeting.startTime);
        setDate(startMoment.isValid() ? startMoment.format('YYYY/MM/DD') : moment().format('YYYY/MM/DD'));
        setStartTime(startMoment.isValid() ? startMoment.format('HH:mm') : '09:00');
        setEndTime(moment(selectedMeeting.endTime).isValid() ? moment(selectedMeeting.endTime).format('HH:mm') : '10:00');
        setParticipants(selectedMeeting.participants || []);
        setAgenda(selectedMeeting.agenda || '');
      } else {
        setTitle('');
        const initialMoment = initialDate ? moment(initialDate) : moment();
        setDate(initialMoment.format('YYYY/MM/DD'));
        setStartTime('09:00');
        setEndTime('10:00');
        setParticipants([]);
        setAgenda('');
      }
    }
  }, [isOpen, selectedMeeting, initialDate]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title || !date) {
      toast.error('Please specify meeting title and date.');
      return;
    }
    const startMoment = moment(date, 'YYYY/MM/DD')
      .hour(parseInt(startTime.split(':')[0], 10) || 9)
      .minute(parseInt(startTime.split(':')[1], 10) || 0);
    const endMoment = moment(date, 'YYYY/MM/DD')
      .hour(parseInt(endTime.split(':')[0], 10) || 10)
      .minute(parseInt(endTime.split(':')[1], 10) || 0);

    const newMeeting = {
      id: selectedMeeting?.id,
      title,
      startTime: startMoment.toISOString(),
      endTime: endMoment.toISOString(),
      participants,
      agenda,
      color: selectedMeeting?.color || '#3b82f6',
      projectId: projectId || null
    };
    onSave(newMeeting);
  };

  const handleAddParticipant = (participant) => {
    if (!participant) return;
    const participantName = participant.fullName || participant.name || 'User';
    if (!participants.some(p => p.id === participant.id)) {
      setParticipants(prev => [...prev, { id: participant.id, name: participantName, email: participant.email || '' }]);
    }
  };

  const handleRemoveParticipant = (participantId) => {
    setParticipants(prev => prev.filter(p => p.id !== participantId));
  };

  const getFirstLetter = (name) => {
    if (!name || typeof name !== 'string') return 'M';
    const trimmed = name.trim();
    return trimmed.length > 0 ? trimmed.charAt(0).toUpperCase() : 'M';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity animate-fade-in"
          onClick={onClose}
          dir="ltr"
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">
                {selectedMeeting ? 'Edit Meeting' : 'Create New Meeting'}
              </h2>
              <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-200 transition-colors">
                <Icons.Close className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-flat">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Meeting Title..."
                className="w-full text-2xl font-bold border-b-2 border-slate-200 focus:border-blue-500 py-2 outline-none transition-colors"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">Date</label>
                  <CustomDatePicker value={date} onChange={setDate} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">Start Time</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="flat-input w-full text-xs py-2 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">End Time</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="flat-input w-full text-xs py-2 rounded-xl" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">Participants</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {(participants || []).map(p => (
                    <div key={p.id} className="flex items-center gap-2 bg-slate-100 rounded-full pl-3 pr-1 py-1 text-xs font-semibold text-slate-700">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                        {getFirstLetter(p.name || p.fullName)}
                      </div>
                      <span>{p.name || p.fullName || 'Participant'}</span>
                      <button onClick={() => handleRemoveParticipant(p.id)} className="text-slate-400 hover:text-red-500">
                        <Icons.Close className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  ))}
                  <div className="relative group">
                    <button className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-600 rounded-full hover:bg-blue-600 hover:text-white transition-colors shadow-sm">
                      <Icons.Plus className="w-4 h-4"/>
                    </button>
                    <div className="absolute hidden group-hover:block z-10 left-0 mt-1 bg-white shadow-xl border border-slate-100 rounded-2xl w-56 text-xs max-h-60 overflow-y-auto p-1 scrollbar-flat">
                      {loadingUsers ? (
                        <div className="p-2 text-center text-slate-400">Loading users...</div>
                      ) : (
                        (availableUsers || []).map(user => (
                          <button 
                            key={user.id} 
                            onClick={() => handleAddParticipant(user)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl font-semibold text-slate-700 transition-colors"
                          >
                            {user.fullName || user.username}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">Agenda / Notes</label>
                <CustomTextEditor value={agenda} onChange={setAgenda} />
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t bg-slate-50">
              <div>
                {selectedMeeting && (
                  <button onClick={() => onDelete(selectedMeeting.id)} className="px-4 py-2.5 text-red-600 font-bold text-xs rounded-xl hover:bg-red-50 flex items-center gap-2 transition-colors">
                    <Icons.Trash className="w-4 h-4" />
                    Delete Meeting
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="px-6 py-2.5 flat-button font-bold text-xs rounded-xl">Cancel</button>
                <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MeetingModal;