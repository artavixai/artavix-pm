/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/apiService';
import chatService from '../services/chatService';
import { jwtDecode } from 'jwt-decode';
import toast from 'react-hot-toast';
import { useNotification } from './NotificationContext';
import * as signalR from "@microsoft/signalr";

const BellIcon = ({ className = "w-6 h-6 text-white" }) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path></svg>;

const stripHtml = (html) => {
   if (!html) return '';
   const doc = new DOMParser().parseFromString(html, 'text/html');
   return doc.body.textContent || "";
}

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    const savedSetting = localStorage.getItem('notificationSoundEnabled');
    return savedSetting ? JSON.parse(savedSetting) : true;
  });

  const toggleSound = () => {
    setIsSoundEnabled(prev => {
      const newState = !prev;
      localStorage.setItem('notificationSoundEnabled', JSON.stringify(newState));
      return newState;
    });
  };
  
  const updateTotalUnreadCount = useCallback(async () => {
    try {
        const response = await chatService.getUserChannels();
        const { projectChannels, directChannels } = response.data;
        const total = [...(projectChannels || []), ...(directChannels || [])].reduce((sum, channel) => sum + (channel.unreadCount || 0), 0);
        setTotalUnreadCount(total);
    } catch (error) {
        console.error("Failed to update unread count:", error);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    if (chatService.connection && chatService.connection.state !== signalR.HubConnectionState.Disconnected) {
      chatService.stopConnection();
    }
    setUser(null);
  }, []);

  const decodeAndSetUser = useCallback((token) => {
    try {
      const decodedToken = jwtDecode(token);
      const roles = decodedToken.role;
      
      const userData = {
        id: decodedToken.sub,
        username: decodedToken.unique_name,
        fullName: decodedToken.name,
        email: decodedToken.email,
        avatarUrl: decodedToken.picture,
        roles: roles ? (Array.isArray(roles) ? roles : [roles]) : [],
        token: token,
      };
      
      setUser(userData);
      localStorage.setItem('authToken', token);
    } catch (error) { 
        console.error("Failed to decode token:", error);
        logout(); 
    }
  }, [logout]);
  
  useEffect(() => {
    if (user?.id) {
        const reminderHandler = (reminder) => {
            addNotification(reminder);
            if (isSoundEnabled) {
                const audio = new Audio('/notification.mp3');
                audio.play().catch(e => console.error("Audio play error:", e));
            }
            
            let navigateTo = '/notes';
            let navigateState = null;
            
            if (reminder.type === 'FollowUp' && reminder.projectId) {
                navigateTo = `/projects/${reminder.projectId}`;
                navigateState = { activeTab: 'followups' };
            } else if (reminder.type === 'Note') {
                navigateTo = '/notes';
                navigateState = { openNoteId: reminder.id };
            }
            
            toast.custom((t) => (
              <div onClick={() => { navigate(navigateTo, { state: navigateState }); toast.dismiss(t.id); }}
                className={`${t.visible ? 'animate-slide-in-left' : 'animate-slide-out-left'} max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer`}>
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5"><div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white"><BellIcon /></div></div>
                    <div className="ml-3 mr-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">{reminder.title}</p>
                      <p className="mt-1 text-sm text-gray-500 truncate">{stripHtml(reminder.content) || 'Reminder alert'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center p-2">
                  <button onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }} 
                    className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-red-100 hover:text-red-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              </div>
            ));
        };

        if (!chatService.connection || chatService.connection.state === signalR.HubConnectionState.Disconnected) {
          chatService.startConnection()
              .then(() => {
                  console.log("Global SignalR connection established.");
                  if (chatService.connection) {
                      chatService.connection.on("ReceiveReminder", reminderHandler);
                  }
              }).catch(err => console.error("Global SignalR Connection Error:", err));
        }

        return () => {
            if (chatService.connection) {
                chatService.connection.off("ReceiveReminder", reminderHandler);
            }
        };
    }
  }, [user?.id, isSoundEnabled, addNotification, navigate]);
  
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      decodeAndSetUser(token);
    }
    setLoading(false);
  }, [decodeAndSetUser]);

  const login = async (username, password) => {
    try {
      const response = await authService.login({ username, password });
      const { token } = response.data;
      decodeAndSetUser(token);
      return true;
    } catch (error) { 
        console.error('Login failed:', error);
        return false; 
    }
  };

  const authValue = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    isSoundEnabled,
    toggleSound,
    totalUnreadCount, 
    updateTotalUnreadCount 
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);