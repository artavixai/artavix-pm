import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import { meetingService } from '../../services/apiService';
import toast from 'react-hot-toast';
import HeaderBar from './HeaderBar';
import Calendar from './Calendar';
import WeekView from './WeekView';
import DayView from './DayView';
import MeetingModal from './MeetingModal';

const MeetingScheduler = ({ projectId }) => {
    const [currentDate, setCurrentDate] = useState(moment());
    const [currentView, setCurrentView] = useState('month');
    const [meetings, setMeetings] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [initialModalDate, setInitialModalDate] = useState(undefined);
    const [loading, setLoading] = useState(false);

    const fetchMeetings = useCallback(async () => {
        setLoading(true);
        try {
            let startDate, endDate;
            if (currentView === 'month') {
                startDate = currentDate.clone().startOf('month').toISOString();
                endDate = currentDate.clone().endOf('month').toISOString();
            } else if (currentView === 'week') {
                startDate = currentDate.clone().startOf('week').toISOString();
                endDate = currentDate.clone().endOf('week').toISOString();
            } else {
                startDate = currentDate.clone().startOf('day').toISOString();
                endDate = currentDate.clone().endOf('day').toISOString();
            }
            const params = { startDate, endDate };
            if (projectId) params.projectId = projectId;
            const response = await meetingService.getAll(params);
            setMeetings(response.data);
        } catch (error) {
            console.error("Failed to fetch meetings:", error);
            toast.error("Error fetching meetings.");
        } finally {
            setLoading(false);
        }
    }, [currentDate, currentView, projectId]);

    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings, currentDate, currentView, projectId]);

    const handleSaveMeeting = async (meeting) => {
        try {
            if (meeting.id) {
                await meetingService.update(meeting.id, meeting);
                toast.success("Meeting updated.");
            } else {
                await meetingService.create(meeting);
                toast.success("New meeting scheduled.");
            }
            fetchMeetings();
            setIsModalOpen(false);
            setSelectedMeeting(null);
        } catch (error) {
            console.error(error);
            toast.error("Error saving meeting");
        }
    };

    const handleDeleteMeeting = async (meetingId) => {
        if (window.confirm('Are you sure you want to delete this meeting?')) {
            try {
                await meetingService.delete(meetingId);
                toast.success("Meeting deleted.");
                fetchMeetings();
                setIsModalOpen(false);
                setSelectedMeeting(null);
            } catch (error) {
                toast.error("Error deleting meeting.");
            }
        }
    };

    const handleDayClick = (date) => {
        setSelectedMeeting(null);
        setInitialModalDate(date.toISOString());
        setIsModalOpen(true);
    };

    const handleMeetingClick = (meeting) => {
        setSelectedMeeting(meeting);
        setInitialModalDate(undefined);
        setIsModalOpen(true);
    };

    const renderView = () => {
        switch(currentView) {
            case 'month':
                return <Calendar 
                    currentDate={currentDate}
                    meetings={meetings}
                    onDayClick={handleDayClick}
                    onMeetingClick={handleMeetingClick}
                />;
            case 'week':
                return <WeekView 
                    currentDate={currentDate}
                    meetings={meetings}
                    onDayClick={handleDayClick}
                    onMeetingClick={handleMeetingClick}
                />;
            case 'day':
                return <DayView 
                    currentDate={currentDate}
                    meetings={meetings}
                    onMeetingClick={handleMeetingClick}
                />;
            default: return null;
        }
    };

    return (
        <div className="bg-white flat-card rounded-2xl shadow-xl h-full flex flex-col overflow-hidden" dir="ltr">
            <HeaderBar 
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                currentView={currentView}
                onViewChange={setCurrentView}
            />
            {loading ? (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-400 font-medium">Loading scheduled meetings...</div>
            ) : renderView()}
            <MeetingModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveMeeting}
                onDelete={handleDeleteMeeting}
                selectedMeeting={selectedMeeting}
                initialDate={initialModalDate}
                projectId={projectId}
            />
        </div>
    );
};

export default MeetingScheduler;