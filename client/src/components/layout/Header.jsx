import React, { Fragment } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Menu, Transition, Popover } from '@headlessui/react';
import { ChevronDownIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/20/solid';
import { BellIcon as BellIconOutline, BellSnoozeIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { SERVER_URL } from '../../config';

const stripHtml = (html) => {
   if (!html) return '';
   const doc = new DOMParser().parseFromString(html, 'text/html');
   return doc.body.textContent || "";
}

const Header = () => {
  const { user, logout } = useAuth();
  const { notifications, removeNotification } = useNotification();
  const navigate = useNavigate();

  const handleNotificationClick = (notification, close) => {
    navigate('/notes', { state: { openNoteId: notification.id } });
    removeNotification(notification.id);
    close();
  };

  return (
    <header className="flat-raised sticky top-0 z-30 px-8 py-3.5 mb-6 backdrop-blur-md bg-white/90">
      <div className="flex items-center justify-between">
        
        {/* User Menu & Profile */}
        <Menu as="div" className="relative inline-block text-left">
          <div>
            <Menu.Button className="flex items-center space-x-3 rounded-xl p-1.5 hover:bg-slate-100 transition-colors">
              <div className="relative">
                {user?.avatarUrl ? (
                  <img
                    src={`${SERVER_URL}/${user.avatarUrl}`}
                    alt={user.fullName}
                    className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200"
                  />
                ) : (
                  <div className="profile-img">{user?.fullName?.charAt(0).toUpperCase()}</div>
                )}
                <div className="status-online"></div>
              </div>
              <div className="text-left hidden sm:block">
                <h3 className="font-bold text-slate-800 text-sm leading-tight">{user?.fullName}</h3>
                <p className="text-xs text-blue-600 font-semibold">{user?.roles?.[0] || 'User'}</p>
              </div>
              <ChevronDownIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </Menu.Button>
          </div>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-left divide-y divide-slate-100 rounded-2xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={logout}
                      className={`${
                        active ? 'bg-red-50 text-red-600' : 'text-red-600'
                      } group flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors`}
                    >
                      <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5 text-red-500" aria-hidden="true" />
                      Sign Out
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="flat-input w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm text-slate-700 placeholder-slate-400" 
            />
            <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Right Section: Notifications & Brand */}
        <div className="flex items-center space-x-4">
            <Popover className="relative">
              {({ close }) => (
                <>
                  <Popover.Button className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors focus:outline-none">
                      <BellIconOutline className="h-6 w-6" />
                      {notifications.length > 0 && (
                          <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                      )}
                  </Popover.Button>
                  <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-1"
                  >
                      <Popover.Panel className="absolute z-50 right-0 mt-3 w-80 max-w-sm transform px-4 sm:px-0">
                          <div className="overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black ring-opacity-5 bg-white">
                              <div className="p-4">
                                  <h3 className="text-base font-bold text-slate-800 border-b pb-2 mb-2">Notifications</h3>
                                  {notifications.length > 0 ? (
                                    <div className="max-h-80 overflow-y-auto space-y-1">
                                      {notifications.map(notif => (
                                        <div
                                          key={notif.id}
                                          onClick={() => handleNotificationClick(notif, close)}
                                          className="flex items-start p-3 rounded-xl hover:bg-blue-50 cursor-pointer transition-colors"
                                        >
                                          <div className="flex-shrink-0">
                                            <BellIconSolid className="h-5 w-5 text-blue-500 mt-0.5" />
                                          </div>
                                          <div className="ml-3 w-0 flex-1">
                                            <p className="font-bold text-slate-800 text-xs">{notif.title}</p>
                                            <p className="text-xs text-slate-500 truncate mt-1">
                                              {stripHtml(notif.content) || 'New Reminder Notification'}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center text-xs text-slate-400 flex flex-col items-center py-8">
                                        <BellSnoozeIcon className="h-10 w-10 text-slate-300 mb-2" />
                                        No new notifications available.
                                    </div>
                                  )}
                              </div>
                          </div>
                      </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>

            <div className="flex items-center space-x-3 border-l pl-4 border-slate-200">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md">
                    A
                </div>
                <div>
                    <h2 className="font-extrabold text-base bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Artavix PM</h2>
                    <p className="text-[11px] text-slate-500 font-semibold leading-none">Enterprise PMS</p>
                </div>
            </div>
        </div>

      </div>
    </header>
  );
};

export default Header;