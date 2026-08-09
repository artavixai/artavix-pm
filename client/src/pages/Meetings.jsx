import React from 'react';
import MeetingScheduler from '../components/MeetingScheduler/MeetingScheduler';

const Meetings = () => {
  return (
    <div className="p-8 h-[calc(100vh-120px)]" dir="ltr">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Meetings Management</h1>
          <p className="mt-1 text-slate-500 text-xs font-medium">Schedule, view, and organize team meetings</p>
        </div>
      </div>
      
      <div className="h-full pb-12">
        <MeetingScheduler />
      </div>
    </div>
  );
};

export default Meetings;