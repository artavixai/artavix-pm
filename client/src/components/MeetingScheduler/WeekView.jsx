import React, { useRef, useLayoutEffect, useState } from 'react';
import moment from 'moment';
import { motion } from 'framer-motion';
import { formatDigit } from './helpers';

const WeekView = ({ currentDate, meetings, onDayClick, onMeetingClick }) => {
    const startOfWeek = currentDate.clone().startOf('week');
    const days = Array.from({ length: 7 }, (_, i) => startOfWeek.clone().add(i, 'days'));
    const today = moment();
    
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

    const gridRef = useRef(null);
    const [scrollbarWidth, setScrollbarWidth] = useState(0);

    useLayoutEffect(() => {
        if (gridRef.current) {
            const width = gridRef.current.offsetWidth - gridRef.current.clientWidth;
            setScrollbarWidth(width);
        }
    }, []);

    return (
        <div className="flex flex-col flex-grow overflow-hidden" dir="ltr">
            <div className="flex border-b border-t border-slate-200 bg-slate-50" style={{ paddingLeft: `${scrollbarWidth}px` }}>
                <div className="w-14 flex-shrink-0 border-r flex items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hour</span>
                </div>
                <div className="grid grid-cols-7 flex-grow">
                    {days.map(day => {
                        const isToday = day.isSame(today, 'day');
                        return (
                            <div key={day.format()} className="text-center py-2 border-r border-slate-200">
                                <span className={`text-[10px] uppercase font-bold ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>{day.format('ddd')}</span>
                                <span className={`block text-base font-black mt-0.5 ${isToday ? 'bg-blue-600 text-white rounded-full w-7 h-7 mx-auto flex items-center justify-center shadow-sm' : 'text-slate-800'}`}>
                                    {formatDigit(day.format('DD'))}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-grow overflow-y-auto scrollbar-flat" ref={gridRef}>
                <div className="w-14 flex-shrink-0">
                    {hours.map((hour, index) => (
                        <div key={hour} className={`h-[60px] relative text-center border-r ${index !== 0 ? 'border-t' : ''} border-slate-200`}>
                             {index > 0 && <span className="absolute -top-2 left-2 text-[10px] font-bold text-slate-400">{formatDigit(hour)}</span>}
                        </div>
                    ))}
                </div>

                <div className="flex-grow grid grid-cols-7 relative">
                    {days.map((day, index) => (
                        <div key={index} className="border-r border-slate-200" onClick={() => onDayClick(day)}></div>
                    ))}
                    <div className="absolute inset-0 grid grid-rows-24 pointer-events-none">
                         {hours.map(hour => <div key={hour} className="border-t border-slate-200 h-[60px]"></div>)}
                    </div>
                    
                    <div className="absolute inset-0 pointer-events-none">
                        {meetings.map(meeting => {
                            const start = moment(meeting.startTime);
                            const end = moment(meeting.endTime);
                            
                            const dayIndex = start.diff(startOfWeek, 'days');

                            const startMinutes = start.hours() * 60 + start.minutes();
                            const endMinutes = end.hours() * 60 + end.minutes();
                            const durationMinutes = Math.max(30, endMinutes - startMinutes);
                            
                            const top = (startMinutes / 60) * 60;
                            const height = (durationMinutes / 60) * 60;

                            if (dayIndex >= 0 && dayIndex < 7) {
                                return (
                                    <motion.div
                                        key={meeting.id}
                                        className="absolute p-2 rounded-xl text-white text-xs cursor-pointer z-10 overflow-hidden flex flex-col pointer-events-auto shadow-md"
                                        style={{
                                            top: `${top}px`,
                                            height: `${Math.min(height, 1440 - top)}px`,
                                            left: `calc(${(dayIndex / 7) * 100}% + 4px)`,
                                            width: `calc(${100/7}% - 8px)`,
                                            backgroundColor: meeting.color || '#3b82f6'
                                        }}
                                        onClick={(e) => { e.stopPropagation(); onMeetingClick(meeting); }}
                                    >
                                        <p className="font-bold text-xs truncate">{meeting.title}</p>
                                        <p className="text-[10px] opacity-90 mt-0.5">{formatDigit(`${start.format('HH:mm')} - ${end.format('HH:mm')}`)}</p>
                                    </motion.div>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeekView;