import React from 'react';
import moment from 'moment';
import { motion } from 'framer-motion';
import { WEEKDAYS_SHORT, getMonthDays, formatDigit } from './helpers';

const Motion = motion;

const Calendar = ({ currentDate, meetings, onDayClick, onMeetingClick }) => {
  const weeks = getMonthDays(currentDate);
  const today = moment();

  const safeMeetings = (meetings || []).filter(Boolean);

  return (
    <div className="flex flex-col flex-grow" dir="ltr">
      <div className="grid grid-cols-7 border-b border-t border-slate-200 bg-slate-50">
        {WEEKDAYS_SHORT.map((day, index) => (
          <div key={index} className="text-center py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-6 flex-grow bg-slate-50">
        {weeks.flat().map((day) => {
          const isCurrentMonth = day.month() === currentDate.month();
          const isToday = day.isSame(today, 'day');
          
          const dayMeetings = safeMeetings.filter(m => m.startTime && moment(m.startTime).isSame(day, 'day'));

          return (
            <Motion.div
              key={day.format('YYYY-MM-DD')}
              className={`relative p-2 border-b border-r border-slate-200 flex flex-col group ${
                isCurrentMonth ? 'bg-white' : 'bg-slate-50/60'
              }`}
              onClick={() => onDayClick(day)}
              whileHover={{ backgroundColor: isCurrentMonth ? '#f8fafc' : '#f1f5f9' }}
            >
              <div className="flex justify-between items-center mb-1">
                 <span
                  className={`text-xs font-bold ${
                    isToday
                      ? 'bg-blue-600 text-white rounded-full flex items-center justify-center w-6 h-6 shadow-sm'
                      : isCurrentMonth
                      ? 'text-slate-700'
                      : 'text-slate-300'
                  }`}
                >
                  {formatDigit(day.date())}
                </span>
                {day.date() === 1 && (
                     <span className="text-[10px] text-slate-400 font-bold uppercase">
                        {day.format('MMM')}
                     </span>
                )}
              </div>
              
              <div className="flex-grow overflow-y-auto space-y-1 pr-1 scrollbar-flat">
                {dayMeetings.map((meeting, meetingIndex) => (
                    <Motion.div
                        key={`${meeting.id || meetingIndex}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onMeetingClick(meeting);
                        }}
                        className="p-1.5 rounded-lg text-white text-[11px] font-bold cursor-pointer truncate shadow-sm"
                        style={{ backgroundColor: meeting.color || '#3b82f6' }}
                        whileHover={{ scale: 1.03, opacity: 0.9 }}
                    >
                        {meeting.title || 'Meeting'}
                    </Motion.div>
                ))}
              </div>
            </Motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;