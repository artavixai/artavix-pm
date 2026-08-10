import React from 'react';
import moment from 'moment';
import { motion } from 'framer-motion';
import { formatDigit } from './helpers';

const Motion = motion;

const DayView = ({ currentDate, meetings, onMeetingClick }) => {
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

    const safeMeetings = (meetings || []).filter(Boolean);

    return (
        <div className="flex-grow overflow-y-auto relative p-4 pl-14 scrollbar-flat" dir="ltr">
            <div className="relative h-[1440px]">
                {hours.map((hour) => (
                    <div key={hour} className="border-b border-slate-200 h-[60px] relative">
                        <span className="absolute -left-12 top-[-8px] text-xs font-bold text-slate-400 bg-white px-1">{formatDigit(hour)}</span>
                    </div>
                ))}

                {safeMeetings.map(meeting => {
                    if (!meeting.startTime || !meeting.endTime) return null;
                    const start = moment(meeting.startTime);
                    const end = moment(meeting.endTime);
                    
                    const startMinutes = start.hours() * 60 + start.minutes();
                    const endMinutes = end.hours() * 60 + end.minutes();
                    const durationMinutes = endMinutes - startMinutes;
                    
                    const top = (startMinutes / 60) * 60;
                    const height = (durationMinutes / 60) * 60;

                    if (start.isSame(currentDate, 'day')) {
                        return (
                            <Motion.div
                                key={meeting.id || Math.random()}
                                className="absolute left-4 right-4 p-3 rounded-2xl text-white text-xs cursor-pointer z-10 overflow-hidden shadow-md"
                                style={{
                                    top: `${top}px`,
                                    height: `${height}px`,
                                    backgroundColor: meeting.color || '#3b82f6',
                                }}
                                onClick={() => onMeetingClick(meeting)}
                            >
                                <p className="font-bold text-sm">{meeting.title || 'Meeting'}</p>
                                <p className="text-xs opacity-90 mt-1">{formatDigit(`${start.format('HH:mm')} - ${end.format('HH:mm')}`)}</p>
                            </Motion.div>
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
};

export default DayView;