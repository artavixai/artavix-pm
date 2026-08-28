import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { weeklyPlanService, userService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import moment from 'jalali-moment';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { SERVER_URL } from '../config';

const getGradient = (color) => `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`;

const formatHour = (hour) => {
  if (hour === null || hour === undefined || Number.isNaN(Number(hour))) return '';
  const totalMinutes = Math.round(Number(hour) * 60);
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

const extractError = (err, fallback) => {
  const data = err?.response?.data;
  const msg = data?.message || data?.error || data?.title || (typeof data === 'string' ? data : null);
  return msg || fallback;
};

const safeDateKey = (plan) => {
  try {
    return moment.utc(plan.planDate).format('YYYY-MM-DD');
  } catch {
    return moment.utc().format('YYYY-MM-DD');
  }
};

const PlanCard = ({ plan, onEdit, onDelete, compact = false }) => {
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete plan "${plan.title}"?`)) {
      onDelete(plan.id);
    }
  };

  const handleDragStart = (e) => {
    e.stopPropagation();
    const sourceDate = safeDateKey(plan);

    const payload = {
      id: plan.id,
      sourceDate,
      isTask: !!plan.isTask
    };

    try {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/json', JSON.stringify(payload));
      e.dataTransfer.setData('text/plain', JSON.stringify(payload));
    } catch (err) {
      console.error(err);
    }
  };

  const showProject = plan.projectTitle && plan.projectTitle !== 'Manual Plan';
  const isDraggable = true;

  return (
    <motion.div
      layout
      draggable={isDraggable}
      onDragStart={handleDragStart}
      whileHover={{ scale: 1.02, transition: { duration: 0.1 } }}
      className={`relative group rounded-xl ${compact ? 'p-1.5' : 'p-2.5'} shadow-sm ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} border-l-4`}
      style={{ background: getGradient(plan.color), borderLeftColor: plan.color, color: '#fff' }}
      onClick={() => onEdit(plan)}
      dir="ltr"
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className={`${compact ? 'text-[11px]' : 'text-xs'} font-bold truncate`}>{plan.title}</p>
          <p className={`${compact ? 'text-[9px]' : 'text-[10px]'} opacity-90 font-mono mt-0.5`}>
            {formatHour(plan.startHour)} - {formatHour(plan.endHour)}
          </p>

          {showProject && (
            <p className={`${compact ? 'text-[9px]' : 'text-[10px]'} opacity-85 mt-1 truncate font-medium`}>
              📁 {plan.projectTitle}
            </p>
          )}

          {plan.taskTitle && <p className="text-[9px] opacity-75 mt-1 truncate">📋 {plan.taskTitle}</p>}

          {plan.isTask && (
            <span className="text-[9px] bg-black/20 px-1.5 py-0.5 rounded-full mt-1 inline-block font-bold">
              🔒 System Task
            </span>
          )}
        </div>

        {!plan.isTask && !compact && (
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-white/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </motion.div>
  );
};

const DayColumn = React.memo(({
  dateKey,
  plans,
  onAdd,
  onEdit,
  onDelete,
  onDrop,
  dailyCapacity = 8
}) => {
  const dateObj = moment.utc(dateKey, 'YYYY-MM-DD');
  const weekDayName = dateObj.format('dddd');
  const dayNumber = dateObj.format('DD MMM');
  const isToday = dateObj.isSame(moment.utc(), 'day');

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => Number(a.startHour) - Number(b.startHour)),
    [plans]
  );

  const totalUsedHours = useMemo(
    () => sortedPlans.reduce((sum, p) => sum + (Number(p.endHour) - Number(p.startHour)), 0),
    [sortedPlans]
  );

  const usagePercent = dailyCapacity > 0 ? (totalUsedHours / dailyCapacity) * 100 : 0;
  const progressColorClass =
    usagePercent < 70 ? 'bg-emerald-500' : usagePercent <= 90 ? 'bg-amber-500' : 'bg-red-500';

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
    if (!raw) return;

    let draggedPlan;
    try {
      draggedPlan = JSON.parse(raw);
    } catch {
      return;
    }

    if (!draggedPlan || draggedPlan.sourceDate === dateKey) return;
    onDrop(draggedPlan.id, dateKey);
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      dir="ltr"
    >
      <div className={`p-3 border-b ${isToday ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700'}`}>
        <div className="text-center">
          <div className="font-bold text-xs">{weekDayName}</div>
          <div className={`text-base font-black ${isToday ? 'text-white' : 'text-slate-800'}`}>{dayNumber}</div>
        </div>

        <div className="mt-2">
          <div className={`flex items-center justify-between text-[10px] font-bold ${isToday ? 'text-blue-100' : 'text-slate-500'}`}>
            <span>Capacity</span>
            <span>{Math.round(totalUsedHours)} / {dailyCapacity} hrs</span>
          </div>
          <div className={`mt-1 h-1.5 rounded-full overflow-hidden ${isToday ? 'bg-white/30' : 'bg-slate-200'}`}>
            <div className={`h-full ${progressColorClass}`} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
          </div>
          {usagePercent > 100 && (
            <div className={`text-[10px] mt-1 font-bold ${isToday ? 'text-amber-200' : 'text-red-600'}`}>
              ⚠️ Capacity Overflow
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] scrollbar-flat">
        {sortedPlans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onEdit={onEdit} onDelete={onDelete} />
        ))}

        <button
          onClick={() => onAdd(dateKey)}
          className="w-full mt-2 py-2 text-center text-xs font-bold text-blue-600 border border-dashed border-blue-300 rounded-xl hover:bg-blue-50 transition-colors"
        >
          + Add Plan
        </button>
      </div>
    </div>
  );
});

DayColumn.displayName = 'DayColumn';

const PlanModal = ({ isOpen, onClose, onSave, planToEdit, selectedDate, availableUsers, isAdmin }) => {
  const [formData, setFormData] = useState({
    userId: '',
    title: '',
    description: '',
    planDate: '',
    startHour: 9,
    endHour: 10,
    color: '#3b82f6'
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (planToEdit && !planToEdit.isTask) {
      setFormData({
        userId: planToEdit.userId?.toString?.() || '',
        title: planToEdit.title || '',
        description: planToEdit.description || '',
        planDate: moment.utc(planToEdit.planDate).format('YYYY/MM/DD'),
        startHour: Number(planToEdit.startHour),
        endHour: Number(planToEdit.endHour),
        color: planToEdit.color || '#3b82f6'
      });
    } else {
      const defaultDate = selectedDate
        ? moment.utc(selectedDate, 'YYYY-MM-DD').format('YYYY/MM/DD')
        : moment.utc().format('YYYY/MM/DD');

      setFormData({
        userId: isAdmin && availableUsers?.length ? String(availableUsers[0].id) : '',
        title: '',
        description: '',
        planDate: defaultDate,
        startHour: 9,
        endHour: 10,
        color: '#3b82f6'
      });
    }

    setIsSaving(false);
  }, [isOpen, planToEdit, selectedDate, availableUsers, isAdmin]);

  const convertToISO = (dateStr, hour = 12) => {
    return moment(dateStr, 'YYYY/MM/DD')
      .hour(Math.floor(hour))
      .minute(Math.round((hour % 1) * 60))
      .second(0)
      .millisecond(0)
      .toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter plan title.');
      return;
    }

    if (Number(formData.startHour) >= Number(formData.endHour)) {
      toast.error('End time must be after start time.');
      return;
    }

    if (isAdmin && !formData.userId) {
      toast.error('Please select a specialist.');
      return;
    }

    setIsSaving(true);
    try {
      const submitData = {
        userId: isAdmin ? Number(formData.userId) : undefined,
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        planDate: convertToISO(formData.planDate, 12),
        startHour: Number(formData.startHour),
        endHour: Number(formData.endHour),
        color: formData.color
      };

      await onSave(submitData, planToEdit?.id);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const hourOptions = [];
  for (let i = 0; i <= 23.5; i += 0.5) hourOptions.push(i);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose} dir="ltr">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-bold mb-4 text-slate-800">{planToEdit && !planToEdit.isTask ? 'Edit Plan' : 'New Plan'}</h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {isAdmin && (
              <div>
                <label className="block font-bold mb-1 text-slate-700">Specialist</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="flat-input w-full py-2 rounded-xl"
                  required
                >
                  <option value="">Select Specialist</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-bold mb-1 text-slate-700">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="flat-input w-full py-2 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block font-bold mb-1 text-slate-700">Description (Optional)</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="flat-input w-full py-2 rounded-xl resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1 text-slate-700">Date</label>
                <input type="text" value={formData.planDate} disabled className="flat-input w-full bg-slate-50 py-2 rounded-xl" />
              </div>
              <div>
                <label className="block font-bold mb-1 text-slate-700">Color</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-9 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1 text-slate-700">Start Hour</label>
                <select
                  value={formData.startHour}
                  onChange={(e) => setFormData({ ...formData, startHour: parseFloat(e.target.value) })}
                  className="flat-input w-full py-2 rounded-xl"
                >
                  {hourOptions.map((h) => (
                    <option key={`s-${h}`} value={h}>
                      {formatHour(h)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1 text-slate-700">End Hour</label>
                <select
                  value={formData.endHour}
                  onChange={(e) => setFormData({ ...formData, endHour: parseFloat(e.target.value) })}
                  className="flat-input w-full py-2 rounded-xl"
                >
                  {hourOptions.map((h) => (
                    <option key={`e-${h}`} value={h}>
                      {formatHour(h)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-blue-700 disabled:opacity-50 shadow-md">
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={onClose} className="flex-1 flat-button py-2.5 rounded-xl font-bold text-xs">
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const WeeklyPlanning = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('SuperAdmin') || user?.roles?.includes('ProjectManager');

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [teamSchedule, setTeamSchedule] = useState([]);

  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(() => moment.utc());

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const lastValidSchedule = useRef([]);

  useEffect(() => {
    userService
      .getAll()
      .then((res) => {
        const users = res.data || [];
        setAllUsers(users);
        if (users.length > 0 && selectedUserId === null) {
          setSelectedUserId(users[0].id);
        }
      })
      .catch(() => {});
  }, [selectedUserId]);

  const fetchSchedule = useCallback(async () => {
    if (selectedUserId === null) return;

    setLoading(true);
    try {
      let startDate, endDate;
      if (viewMode === 'week') {
        startDate = currentDate.clone().startOf('week').toISOString();
        endDate = currentDate.clone().endOf('week').toISOString();
      } else {
        startDate = currentDate.clone().startOf('month').toISOString();
        endDate = currentDate.clone().endOf('month').toISOString();
      }

      const response = await weeklyPlanService.getTeamSchedule(startDate, endDate, selectedUserId);
      const newSchedule = response.data || [];
      setTeamSchedule(newSchedule);
      lastValidSchedule.current = newSchedule;
    } catch (err) {
      toast.error('Error fetching schedule');
      if (lastValidSchedule.current.length > 0) {
        setTeamSchedule(lastValidSchedule.current);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, viewMode, currentDate]);

  useEffect(() => {
    if (selectedUserId !== null) fetchSchedule();
  }, [fetchSchedule, selectedUserId]);

  const handleUserChange = (e) => {
    const val = e.target.value;
    if (val === 'all') {
      setSelectedUserId(null);
      setTeamSchedule([]);
      lastValidSchedule.current = [];
    } else {
      setSelectedUserId(parseInt(val));
    }
  };

  const navigate = (direction) => {
    setCurrentDate((prev) => {
      const newDate = prev.clone();
      if (viewMode === 'week') {
        return direction === 'prev' ? newDate.subtract(1, 'week') : newDate.add(1, 'week');
      } else {
        return direction === 'prev' ? newDate.subtract(1, 'month') : newDate.add(1, 'month');
      }
    });
  };

  const goToday = () => setCurrentDate(moment.utc());

  const handleSavePlan = async (data, planId) => {
    try {
      let savedPlan = null;

      if (planId) {
        await weeklyPlanService.updatePlan(planId, data);
        toast.success('Plan updated.');
        savedPlan = { id: planId, ...data };
      } else {
        const response = await weeklyPlanService.createPlan(data);
        toast.success('New plan added.');
        const newId = response.data?.id;
        if (!newId) {
          await fetchSchedule();
          setModalOpen(false);
          setEditingPlan(null);
          return;
        }
        savedPlan = { id: newId, ...data };
      }

      if (selectedUserId !== null && savedPlan) {
        setTeamSchedule((prev) =>
          prev.map((userSchedule) => {
            if (userSchedule.userId === selectedUserId) {
              const existingIndex = userSchedule.plans?.findIndex((p) => p.id === savedPlan.id) ?? -1;
              if (existingIndex >= 0) {
                return {
                  ...userSchedule,
                  plans: userSchedule.plans.map((p, idx) =>
                    idx === existingIndex ? { ...p, ...savedPlan } : p
                  )
                };
              } else {
                return {
                  ...userSchedule,
                  plans: [...(userSchedule.plans || []), savedPlan]
                };
              }
            }
            return userSchedule;
          })
        );
      }

      setModalOpen(false);
      setEditingPlan(null);
    } catch (err) {
      toast.error(extractError(err, 'Error saving plan'));
    }
  };

  const handleDeletePlan = async (planId) => {
    try {
      await weeklyPlanService.deletePlan(planId);
      toast.success('Plan deleted.');
      if (selectedUserId !== null) await fetchSchedule();
    } catch (err) {
      toast.error(extractError(err, 'Error deleting plan'));
    }
  };

  const handleAddPlan = (dateKey) => {
    setSelectedDate(dateKey);
    setEditingPlan(null);
    setModalOpen(true);
  };

  const handleEditPlan = (plan) => {
    if (plan.isTask) {
      toast.info('System tasks cannot be edited directly.');
      return;
    }
    setEditingPlan(plan);
    setSelectedDate(null);
    setModalOpen(true);
  };

  const handleDrop = async (planId, targetDateKey) => {
    let planToMove = null;
    for (const userSchedule of teamSchedule) {
      const found = userSchedule.plans?.find((p) => p.id === planId);
      if (found) {
        planToMove = found;
        break;
      }
    }

    if (!planToMove) {
      toast.error('Plan not found.');
      return;
    }

    if (planToMove.isTask) {
      const newPlanDate = moment.utc(targetDateKey, 'YYYY-MM-DD').hour(12).minute(0).second(0).millisecond(0).toISOString();
      setTeamSchedule((prev) =>
        prev.map((userSchedule) => {
          if (userSchedule.userId === selectedUserId) {
            return {
              ...userSchedule,
              plans: userSchedule.plans.map((p) =>
                p.id === planId ? { ...p, planDate: newPlanDate } : p
              )
            };
          }
          return userSchedule;
        })
      );
      toast.success('System task moved locally.');
      return;
    }

    const updateData = {
      title: planToMove.title,
      description: planToMove.description || '',
      planDate: moment.utc(targetDateKey, 'YYYY-MM-DD').hour(12).minute(0).second(0).millisecond(0).toISOString(),
      startHour: Number(planToMove.startHour),
      endHour: Number(planToMove.endHour),
      color: planToMove.color,
      isCompleted: !!planToMove.isCompleted
    };

    try {
      await weeklyPlanService.updatePlan(planId, updateData);
      toast.success('Plan moved successfully.');
      setTeamSchedule((prev) =>
        prev.map((userSchedule) => {
          if (userSchedule.userId === selectedUserId) {
            return {
              ...userSchedule,
              plans: userSchedule.plans.map((p) =>
                p.id === planId ? { ...p, planDate: updateData.planDate } : p
              )
            };
          }
          return userSchedule;
        })
      );
    } catch (err) {
      toast.error(extractError(err, 'Error moving plan'));
    }
  };

  const selectedUserObj = useMemo(() => {
    if (selectedUserId === null) return null;
    return allUsers.find((u) => u.id === selectedUserId) || null;
  }, [allUsers, selectedUserId]);

  const avatarUrl = selectedUserObj?.avatarUrl ? `${SERVER_URL}/${selectedUserObj.avatarUrl}` : null;

  const weekDays = useMemo(() => {
    const startOfWeek = currentDate.clone().startOf('week');
    return Array.from({ length: 7 }, (_, i) => startOfWeek.clone().add(i, 'day'));
  }, [currentDate]);

  const monthDays = useMemo(() => {
    const startOfMonth = currentDate.clone().startOf('month');
    const endOfMonth = currentDate.clone().endOf('month');
    const days = [];
    let cursor = startOfMonth.clone();
    while (cursor.isSameOrBefore(endOfMonth, 'day')) {
      days.push(cursor.clone());
      cursor.add(1, 'day');
    }
    return days;
  }, [currentDate]);

  const selectedUserData = useMemo(
    () => teamSchedule.find((t) => t.userId === selectedUserId) || null,
    [teamSchedule, selectedUserId]
  );

  const plansMap = useMemo(() => {
    const map = new Map();
    (selectedUserData?.plans || []).forEach((plan) => {
      const key = safeDateKey(plan);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(plan);
    });
    return map;
  }, [selectedUserData]);

  const rangeLabel = useMemo(() => {
    if (viewMode === 'week') {
      const start = currentDate.clone().startOf('week');
      const end = currentDate.clone().endOf('week');
      return `Week of ${start.format('MMM DD')} - ${end.format('MMM DD, YYYY')}`;
    }
    return currentDate.format('MMMM YYYY');
  }, [currentDate, viewMode]);

  const renderWeekView = () => {
    if (!selectedUserData) return <div className="text-center py-10 text-slate-400 text-sm">Please select a specialist</div>;

    return (
      <div className="grid grid-cols-7 gap-4 h-full">
        {weekDays.map((day) => {
          const dateKey = day.format('YYYY-MM-DD');
          const dayPlans = plansMap.get(dateKey) || [];
          return (
            <DayColumn
              key={dateKey}
              dateKey={dateKey}
              plans={dayPlans}
              onAdd={handleAddPlan}
              onEdit={handleEditPlan}
              onDelete={handleDeletePlan}
              onDrop={handleDrop}
              dailyCapacity={selectedUserData.dailyCapacity || 8}
            />
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    if (!selectedUserData) return <div className="text-center py-10 text-slate-400 text-sm">Please select a specialist</div>;

    return (
      <div className="grid grid-cols-7 gap-2 auto-rows-min">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center font-bold text-slate-500 p-2 text-xs uppercase tracking-wider">{d}</div>
        ))}

        {monthDays.map((day, idx) => {
          const dateKey = day.format('YYYY-MM-DD');
          const dayPlans = (plansMap.get(dateKey) || []).sort((a, b) => Number(a.startHour) - Number(b.startHour));
          const isToday = day.isSame(moment.utc(), 'day');

          return (
            <div
              key={idx}
              className={`min-h-[120px] border rounded-xl p-2 ${isToday ? 'bg-blue-50/80 border-blue-300' : 'bg-white border-slate-200'}`}
            >
              <div className={`text-xs font-bold mb-1 ${isToday ? 'text-blue-600' : 'text-slate-600'}`}>
                {day.date()}
              </div>

              <div className="space-y-1">
                {dayPlans.slice(0, 2).map((plan) => (
                  <PlanCard key={plan.id} plan={plan} onEdit={handleEditPlan} onDelete={handleDeletePlan} compact />
                ))}
                {dayPlans.length > 2 && <div className="text-[9px] text-slate-400 font-bold">+{dayPlans.length - 2} more</div>}
              </div>

              <button
                onClick={() => handleAddPlan(dateKey)}
                className="mt-1 text-[10px] font-bold text-blue-600 w-full text-center hover:bg-blue-50 rounded py-0.5 transition-colors"
              >
                +
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden" dir="ltr">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Weekly Planning & Workload</h1>
          <p className="text-slate-500 text-sm font-medium">Visual workload and schedule management for specialists</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <select
              value={selectedUserId === null ? '' : selectedUserId}
              onChange={handleUserChange}
              className="flat-input px-4 py-2 rounded-xl text-xs font-bold"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>

            {selectedUserId !== null && (
              <div className="relative w-10 h-10">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md bg-slate-200">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 font-bold text-sm">
                      {selectedUserObj?.fullName?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex rounded-xl overflow-hidden border border-slate-200 p-0.5 bg-slate-100">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button onClick={() => navigate('prev')} className="p-2 flat-button rounded-lg text-xs">◀</button>
          <button onClick={goToday} className="px-4 py-2 flat-button rounded-lg font-bold text-xs">Today</button>
          <button onClick={() => navigate('next')} className="p-2 flat-button rounded-lg text-xs">▶</button>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 rounded-xl shadow-md">
          <span className="text-white font-bold text-xs">{rangeLabel}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6 scrollbar-flat">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-slate-400 text-sm">Loading schedule data...</div>
        ) : selectedUserId === null ? (
          <div className="flex justify-center items-center h-64 text-slate-400 text-sm font-medium">
            Please select a specialist from the dropdown
          </div>
        ) : viewMode === 'week' ? (
          renderWeekView()
        ) : (
          renderMonthView()
        )}
      </div>

      <PlanModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPlan(null);
        }}
        onSave={handleSavePlan}
        planToEdit={editingPlan}
        selectedDate={selectedDate}
        availableUsers={allUsers}
        isAdmin={isAdmin}
      />
    </div>
  );
};

export default WeeklyPlanning;