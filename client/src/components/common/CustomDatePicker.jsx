import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getStartWeekdayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

const CalendarPanel = ({ value, onChange, close, positionStyle }) => {
  const today = useMemo(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }, []);

  const [viewDate, setViewDate] = useState(() => {
    if (value) return { year: value.year, month: value.month, day: value.day };
    return { year: today.year, month: today.month, day: today.day };
  });

  const handleDayClick = useCallback((day) => {
    onChange({ year: viewDate.year, month: viewDate.month, day });
    close();
  }, [viewDate, onChange, close]);

  const changeMonth = (offset) => {
    setViewDate(current => {
      let newMonth = current.month + offset;
      let newYear = current.year;
      if (newMonth > 11) { newMonth = 0; newYear++; }
      if (newMonth < 0) { newMonth = 11; newYear--; }
      return { year: newYear, month: newMonth, day: 1 };
    });
  };

  const handleTodayClick = () => {
    onChange(today);
    close();
  };

  const calendarGrid = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
    const startWeekday = getStartWeekdayOfMonth(viewDate.year, viewDate.month);
    const grid = [];

    for (let i = 0; i < startWeekday; i++) {
      grid.push({ day: null, isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = viewDate.year === today.year && viewDate.month === today.month && i === today.day;
      const isSelected = value ? (viewDate.year === value.year && viewDate.month === value.month && i === value.day) : false;
      grid.push({
        day: i,
        isCurrentMonth: true,
        isToday,
        isSelected
      });
    }

    while (grid.length < 42) {
      grid.push({ day: null, isCurrentMonth: false });
    }

    return grid;
  }, [viewDate, value, today]);

  const yearOptions = Array.from({ length: 40 }, (_, i) => today.year - 20 + i);

  return (
    <div 
      className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 flex flex-col gap-2.5 text-slate-800 z-[10000]"
      style={{ width: '290px', ...positionStyle }}
      dir="ltr"
    >
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-2.5 flex items-center justify-between">
        <button type="button" onClick={() => changeMonth(-1)} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex items-center gap-1.5 text-sm font-bold">
          <select 
            value={viewDate.month} 
            onChange={(e) => setViewDate(d => ({ ...d, month: parseInt(e.target.value, 10) }))} 
            className="bg-transparent border-0 text-white font-bold text-sm cursor-pointer focus:ring-0 appearance-none text-center"
          >
            {ENGLISH_MONTHS.map((name, index) => (
              <option key={name} value={index} className="text-slate-800">{name}</option>
            ))}
          </select>
          <select 
            value={viewDate.year} 
            onChange={(e) => setViewDate(d => ({ ...d, year: parseInt(e.target.value, 10) }))} 
            className="bg-transparent border-0 text-white font-bold text-sm cursor-pointer focus:ring-0 appearance-none text-center"
          >
            {yearOptions.map(year => (
              <option key={year} value={year} className="text-slate-800">{year}</option>
            ))}
          </select>
        </div>
        <button type="button" onClick={() => changeMonth(1)} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-slate-400 font-semibold text-xs">
        {WEEKDAYS_SHORT.map(day => (<div key={day}>{day}</div>))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarGrid.map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={() => item.isCurrentMonth && handleDayClick(item.day)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all text-xs font-semibold
              ${item.isCurrentMonth ? 'text-slate-700 hover:bg-slate-100' : 'text-transparent cursor-default'}
              ${item.isToday && !item.isSelected ? 'border border-blue-500 text-blue-600 font-bold' : ''}
              ${item.isSelected ? 'bg-blue-600 text-white font-bold shadow-md' : ''}
            `}
            disabled={!item.isCurrentMonth}
          >
            {item.day || ''}
          </button>
        ))}
      </div>

      <div className="border-t pt-2 mt-1">
        <button 
          type="button" 
          onClick={handleTodayClick} 
          className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-blue-600 font-bold rounded-lg transition-colors text-xs"
        >
          Today
        </button>
      </div>
    </div>
  );
};

const CustomDatePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerStyle, setPickerStyle] = useState({ top: 0, left: 0 });
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target) && !event.target.closest('.datepicker-portal')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updatePosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const pickerHeight = 340;
    const spaceBelow = window.innerHeight - rect.bottom;
    let top = spaceBelow < pickerHeight ? rect.top - pickerHeight - 5 : rect.bottom + 5;
    if (top < 10) top = rect.bottom + 5;

    setPickerStyle({
      top,
      left: rect.left + rect.width / 2,
    });
  }, []);

  const togglePicker = () => {
    if (!isOpen) updatePosition();
    setIsOpen(prev => !prev);
  };

  useEffect(() => {
    if (isOpen) {
      const handleScrollResize = () => updatePosition();
      window.addEventListener('scroll', handleScrollResize, true);
      window.addEventListener('resize', handleScrollResize);
      return () => {
        window.removeEventListener('scroll', handleScrollResize, true);
        window.removeEventListener('resize', handleScrollResize);
      };
    }
  }, [isOpen, updatePosition]);

  const dateObject = useMemo(() => {
    if (!value) return null;
    const parts = value.split(/[/-]/);
    if (parts.length !== 3) return null;
    const [year, month, day] = parts.map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return { year, month: month - 1, day };
  }, [value]);

  const handleDateChange = (dateObj) => {
    const monthStr = String(dateObj.month + 1).padStart(2, '0');
    const dayStr = String(dateObj.day).padStart(2, '0');
    const dateString = `${dateObj.year}/${monthStr}/${dayStr}`;
    onChange(dateString);
  };

  return (
    <div className="relative w-full" ref={wrapperRef} dir="ltr">
      <input
        ref={inputRef}
        readOnly
        type="text"
        value={value || ''}
        onClick={togglePicker}
        placeholder="Select Date..."
        className="flat-input w-full cursor-pointer text-center text-sm font-medium"
      />
      {isOpen && createPortal(
        <div 
          className="fixed z-[10000] datepicker-portal"
          style={{
            top: pickerStyle.top,
            left: pickerStyle.left,
            transform: 'translateX(-50%)',
          }}
        >
          <CalendarPanel
            value={dateObject}
            onChange={handleDateChange}
            close={() => setIsOpen(false)}
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export default CustomDatePicker;