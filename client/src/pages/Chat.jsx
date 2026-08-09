import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import chatService from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/apiService';
import api from '../services/apiService';
import EmojiPicker, { EmojiStyle } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import moment from 'jalali-moment';
import { SERVER_URL } from '../config';
import { 
    FaceSmileIcon, 
    PaperAirplaneIcon,
    XMarkIcon,
    ArrowUturnLeftIcon,
    TrashIcon as TrashOutline,
    ChevronDownIcon,
    ChevronUpIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    UsersIcon,
    PaperClipIcon,
    PhotoIcon,
    DocumentIcon,
    MapPinIcon,
    DocumentTextIcon,
    ArrowDownTrayIcon,
    PlayIcon,
    PauseIcon
} from '@heroicons/react/24/outline';

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileType = (file) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'file';
};

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const SingleTickIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>;
const DoubleTickIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M1.5 12.5L5.5 16.5L14.5 5.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 12.5L12 16.5L21.5 5.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const FolderIcon = (props) => <svg viewBox="0 0 20 20" fill="currentColor" {...props}><path d="M2 4.75A2.75 2.75 0 014.75 2h5.166c.959 0 1.843.434 2.44 1.187l1.714 1.714A1.25 1.25 0 0115.25 6H18A2.75 2.75 0 0120.75 8.75v6.5A2.75 2.75 0 0118 18H4.75A2.75 2.75 0 012 15.25V4.75z" /></svg>;

const AttachmentPreviewModal = ({ attachment, caption, setCaption, onClose, onSend }) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiButtonRef = useRef(null);
    const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiButtonRef.current && !emojiButtonRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (showEmojiPicker && emojiButtonRef.current) {
            const rect = emojiButtonRef.current.getBoundingClientRect();
            setPickerPosition({
                top: rect.top - 350,
                left: rect.left
            });
        }
    }, [showEmojiPicker]);

    if (!attachment) return null;

    const fileType = getFileType(attachment.file);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/70 z-[110] flex items-center justify-center p-4 backdrop-blur-md" dir="ltr">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                    animate={{ scale: 1, opacity: 1, y: 0 }} 
                    exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                    className="bg-white rounded-3xl shadow-2xl flex flex-col w-full max-w-md"
                >
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800 text-sm">Send Preview</h3>
                        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                            <XMarkIcon className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    <div className="bg-slate-100 flex items-center justify-center p-6 min-h-[250px] max-h-[400px] overflow-hidden">
                        {fileType === 'image' && (
                            <img src={attachment.previewUrl} alt="Preview" className="max-w-full max-h-[350px] object-contain rounded-xl shadow-sm" />
                        )}
                        {fileType === 'video' && (
                            <video controls className="max-w-full max-h-[350px] rounded-xl shadow-sm">
                                <source src={attachment.previewUrl} type={attachment.file.type} />
                            </video>
                        )}
                        {fileType === 'file' && (
                            <div className="flex flex-col items-center gap-3 text-slate-500">
                                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                    <DocumentTextIcon className="w-10 h-10 text-emerald-500" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-slate-700 text-xs truncate max-w-[250px]">{attachment.file.name}</p>
                                    <p className="text-[11px] mt-1 text-slate-400">{formatFileSize(attachment.file.size)}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-white border-t relative">
                        <div className="flex items-end gap-3">
                            <div className="relative">
                                <button 
                                    ref={emojiButtonRef}
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                                    className={`transition-colors p-2 rounded-full ${showEmojiPicker ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <FaceSmileIcon className="w-6 h-6" />
                                </button>
                            </div>
                            <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Add a caption..."
                                className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-2.5 focus:ring-1 focus:ring-blue-100 resize-none text-xs text-slate-700 scrollbar-none"
                                rows={1}
                                autoFocus
                            />
                            <button 
                                onClick={onSend}
                                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex-shrink-0"
                            >
                                <PaperAirplaneIcon className="w-5 h-5" />
                            </button>
                        </div>
                        {showEmojiPicker && createPortal(
                            <div 
                                style={{
                                    position: 'fixed',
                                    top: pickerPosition.top,
                                    left: pickerPosition.left,
                                    zIndex: 200,
                                    width: '320px',
                                    maxHeight: '400px'
                                }}
                                className="shadow-2xl rounded-2xl overflow-hidden border border-slate-100 bg-white"
                            >
                                <EmojiPicker 
                                    emojiStyle={EmojiStyle.NATIVE} 
                                    onEmojiClick={(e) => {
                                        setCaption(prev => prev + e.emoji);
                                        setShowEmojiPicker(false);
                                    }} 
                                    lazyLoadEmojis={true} 
                                    searchPlaceholder="Search emoji..." 
                                    width="100%"
                                    height="350px"
                                />
                            </div>,
                            document.body
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const VideoPlayer = ({ src, type }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const videoRef = useRef(null);

    const togglePlay = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play().catch(e => console.log("Play error:", e));
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => setIsPlaying(false);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);
        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
        };
    }, []);

    return (
        <div 
            className="relative group rounded-xl overflow-hidden bg-slate-900"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <video 
                ref={videoRef}
                className="w-full max-h-[300px] object-contain"
                onClick={togglePlay}
                preload="metadata"
            >
                <source src={src} type={type} />
                Your browser does not support playing video.
            </video>
            {isHovered && (
                <button 
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-14 h-14 bg-black/50 rounded-full flex items-center justify-center text-white transition-opacity"
                >
                    {isPlaying ? <PauseIcon className="w-7 h-7" /> : <PlayIcon className="w-7 h-7 ml-0.5" />}
                </button>
            )}
        </div>
    );
};

const FileMessageContent = ({ fileUrl, fileName, fileSize, fileType, caption }) => {
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const isImage = fileType?.startsWith('image/');
    const isVideo = fileType?.startsWith('video/');
    
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download started');
    };
    
    if (isImage) {
        return (
            <>
                <div className="relative group flex justify-center">
                    <img 
                        src={fileUrl} 
                        alt={caption || fileName} 
                        className="max-w-full max-h-[300px] rounded-xl cursor-pointer object-contain bg-slate-100 mx-auto"
                        onClick={() => setIsImageModalOpen(true)}
                    />
                    <button 
                        onClick={handleDownload}
                        className="absolute bottom-2 right-2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                    </button>
                </div>
                {isImageModalOpen && createPortal(
                    <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4" onClick={() => setIsImageModalOpen(false)}>
                        <img src={fileUrl} alt={caption || fileName} className="max-w-full max-h-full object-contain" />
                        <button className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/30" onClick={() => setIsImageModalOpen(false)}>
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>,
                    document.body
                )}
            </>
        );
    }
    
    if (isVideo) {
        return <VideoPlayer src={fileUrl} type={fileType} />;
    }
    
    return (
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <DocumentTextIcon className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{fileName}</p>
                <p className="text-[10px] text-slate-400">{formatFileSize(fileSize)}</p>
            </div>
            <button onClick={handleDownload} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

const LocationMessageContent = ({ latitude, longitude }) => {
    const baladLink = `https://balad.ir/#${Math.round(latitude * 100) / 100}/${Math.round(longitude * 100) / 100}`;
    return (
        <div className="flex flex-col gap-2">
            <a 
                href={baladLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity bg-slate-100 p-4 text-center"
            >
                <div className="flex flex-col items-center gap-2">
                    <MapPinIcon className="w-8 h-8 text-rose-500" />
                    <span className="text-xs font-bold text-slate-700">View Location on Map</span>
                    <span className="text-[10px] text-slate-400">(Click to open)</span>
                </div>
            </a>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <MapPinIcon className="w-4 h-4 text-rose-500" />
                <span>Shared Location</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </div>
        </div>
    );
};

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm }) => {
    const [deleteForEveryone, setDeleteForEveryone] = useState(true);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" dir="ltr">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 max-w-[320px] w-full shadow-2xl flex flex-col items-center">
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <TrashOutline className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2 text-center">Delete Message</h3>
                <p className="text-slate-500 text-xs mb-6 text-center leading-relaxed">Are you sure you want to delete this message? This action cannot be undone.</p>
                <label className="flex items-center justify-center gap-2 mb-6 cursor-pointer group w-full bg-slate-50 py-2.5 px-3 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-100">
                    <input type="checkbox" checked={deleteForEveryone} onChange={e => setDeleteForEveryone(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-red-500 focus:ring-red-500" />
                    <span className="text-xs font-bold text-slate-700">Delete for both participants</span>
                </label>
                <div className="flex gap-2 w-full">
                    <button onClick={() => onConfirm(deleteForEveryone)} className="flex-1 flex items-center justify-center py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100">Delete Message</button>
                    <button onClick={onClose} className="flex-1 flex items-center justify-center py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">Cancel</button>
                </div>
            </motion.div>
        </div>
    );
};

const NewChatModal = ({ isOpen, onClose, onSelectUser }) => {
    const [allUsers, setAllUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    useEffect(() => {
        if (isOpen) {
            userService.getColleagues().then(res => setAllUsers(res.data)).catch(err => console.error(err));
        }
    }, [isOpen]);
    const filteredUsers = allUsers.filter(u => u.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!isOpen) return null;
    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose} dir="ltr">
                <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} className="flat-card bg-white rounded-3xl w-full max-w-md flex flex-col h-[70vh]" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-sm">New Discussion</h3>
                        <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    <div className="p-4 border-b">
                        <input type="text" placeholder="Search colleague..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flat-input w-full bg-slate-50 border-none rounded-xl py-2.5 px-4 text-xs" />
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-flat">
                        {filteredUsers.map(user => (
                            <div key={user.id} onClick={() => onSelectUser(user.id)} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors">
                                <img src={user.avatarUrl ? `${SERVER_URL}/${user.avatarUrl}` : `https://ui-avatars.com/api/?name=${user.fullName}&background=random&color=fff`} alt={user.fullName} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                                <span className="font-bold text-slate-800 text-xs">{user.fullName}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const ChatContextMenu = ({ menuPosition, message, user, onClose, onCopy, onEdit, onDelete, onReact, onReply }) => {
    const menuRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={menuRef} style={{ top: menuPosition.y, left: menuPosition.x }} className="fixed z-50 w-52 bg-white rounded-2xl shadow-2xl ring-1 ring-black ring-opacity-5 overflow-hidden py-1" dir="ltr">
            <div className="flex items-center justify-around p-2 border-b bg-slate-50">
                {QUICK_REACTIONS.map(emoji => (
                    <button key={emoji} onClick={() => { onReact(message.id, emoji); onClose(); }} className="text-lg hover:scale-125 transition-transform p-1">{emoji}</button>
                ))}
            </div>
            <button onClick={() => { onReply(message); onClose(); }} className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2"><span>↩️</span> Reply</button>
            <button onClick={onCopy} className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2"><span>📋</span> Copy Text</button>
            {String(message.senderId) === String(user.id) && (
                <>
                    <button onClick={onEdit} className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2"><span>✏️</span> Edit</button>
                    <div className="border-t my-1"></div>
                    <button onClick={() => { onDelete(message.id); onClose(); }} className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"><span>🗑️</span> Delete Message</button>
                </>
            )}
        </div>
    );
};

const MessageBubble = ({ msg, isSender, onContextMenu, onSaveEdit, onCancelEdit, editingMessage, setEditingMessage, onReact }) => {
    const formatFullDateTime = (date) => {
        if (!date) return '';
        try {
            return moment.utc(date).local().format('YYYY/MM/DD HH:mm');
        } catch (e) {
            return '';
        }
    };

    const handleLocalContextMenu = (e) => {
        e.preventDefault();
        onContextMenu(e, msg);
    };

    const isLocation = msg.latitude && msg.longitude;
    const hasAttachment = msg.attachmentUrl || msg.fileUrl;
    const isFileMessage = msg.messageType === 'file' || hasAttachment;

    return (
        <div onContextMenu={handleLocalContextMenu} className={`flex items-start gap-3 mb-5 ${isSender ? 'flex-row-reverse' : ''}`}>
            <img src={msg.senderAvatarUrl ? `${SERVER_URL}/${msg.senderAvatarUrl}` : `https://ui-avatars.com/api/?name=${msg.senderFullName}&background=random&color=fff`}
                 alt={msg.senderFullName} className="w-8 h-8 rounded-full object-cover self-end shadow-sm" />
            <div className="flex flex-col max-w-lg w-full">
                <div className={`relative group rounded-2xl py-3 px-4 shadow-sm ${isSender ? 'bg-blue-600 text-white rounded-bl-none' : 'bg-white text-slate-800 rounded-br-none border border-slate-100'}`}>
                    {msg.repliedContent && (
                        <div className={`mb-2 p-2 rounded border-l-4 text-[11px] ${isSender ? 'bg-white/10 border-white/50 text-white/90' : 'bg-slate-50 border-blue-500 text-slate-500'} italic truncate`}>
                            {msg.repliedContent}
                        </div>
                    )}
                    {editingMessage?.id === msg.id ? (
                        <div>
                            <textarea value={editingMessage.content} onChange={(e) => setEditingMessage(prev => ({ ...prev, content: e.target.value }))}
                                className={`w-full bg-white/10 text-xs p-2 rounded-xl resize-none focus:outline-none border border-white/20 ${isSender ? 'text-white' : 'text-slate-800 bg-slate-100 border-slate-200'}`}
                                rows={Math.max(2, editingMessage.content.split('\n').length)} autoFocus />
                            <div className="flex justify-end gap-2 mt-2">
                                <button onClick={onCancelEdit} className="text-[10px] px-3 py-1 rounded-lg bg-black/10 hover:bg-black/20 font-bold transition-all">Cancel</button>
                                <button onClick={onSaveEdit} className="text-[10px] font-bold px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-all">Save</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isLocation ? (
                                <LocationMessageContent latitude={msg.latitude} longitude={msg.longitude} />
                            ) : isFileMessage ? (
                                <div className="flex flex-col gap-2">
                                    <FileMessageContent 
                                        fileUrl={msg.attachmentUrl || msg.fileUrl}
                                        fileName={msg.fileName || 'File'}
                                        fileSize={msg.fileSize || 0}
                                        fileType={msg.fileType}
                                        caption={msg.content}
                                    />
                                    {msg.content && (
                                        <p className="text-xs leading-relaxed mt-1">{msg.content}</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                            )}
                            <div className={`flex items-center justify-end gap-1.5 text-[10px] mt-1.5 ${isSender ? 'text-blue-100' : 'text-slate-400'}`}>
                                {msg.editedAt && (
                                    <span className="opacity-80" title="Edited time">
                                        (Edited: {formatFullDateTime(msg.editedAt)})
                                    </span>
                                )}
                                <span title="Sent time">{formatFullDateTime(msg.sentAt)}</span>
                                {isSender && (
                                    <div className="w-3.5 h-3.5 flex items-center justify-center">
                                        {msg.seenAt ? <DoubleTickIcon className="w-3.5 h-3.5 text-emerald-300" /> : <SingleTickIcon className="w-3.5 h-3.5" />}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
                {msg.reactions && msg.reactions.length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-[-6px] relative z-20 ${isSender ? 'justify-end pl-3' : 'justify-start pr-3'}`}>
                        {msg.reactions.map((r, i) => (
                            <button key={i} onClick={() => onReact(msg.id, r.reaction)} 
                                className="bg-white border border-slate-100 rounded-full px-2 py-0.5 text-[10px] shadow-sm hover:scale-110 transition-all flex items-center gap-1">
                                <span>{r.reaction}</span>
                                {r.count > 0 && <span className="font-bold text-slate-500">{r.count}</span>}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const Chat = () => {
    const { user, updateTotalUnreadCount } = useAuth();
    const [projectChannels, setProjectChannels] = useState([]);
    const [directChannels, setDirectChannels] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [editingMessage, setEditingMessage] = useState({ id: null, content: '' });
    const [replyingTo, setReplyingTo] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [pendingAttachment, setPendingAttachment] = useState(null);
    const [attachmentCaption, setAttachmentCaption] = useState('');
    
    const [sendingLocation, setSendingLocation] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, messageId: null });
    const [allColleagues, setAllColleagues] = useState([]);
    const [isProjectExpanded, setIsProjectExpanded] = useState(false);
    const [isDirectExpanded, setIsDirectExpanded] = useState(true);
    const [projectSearch, setProjectSearch] = useState("");
    const [directSearch, setDirectSearch] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    
    const [showColleaguesBar, setShowColleaguesBar] = useState(() => {
        const saved = localStorage.getItem('showColleaguesBar');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const chatPanelRef = useRef(null);
    const textareaRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const attachmentMenuRef = useRef(null);
    const imageInputRef = useRef(null);
    const documentInputRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('showColleaguesBar', JSON.stringify(showColleaguesBar));
    }, [showColleaguesBar]);

    useEffect(() => {
        return () => {
            if (pendingAttachment?.previewUrl) {
                URL.revokeObjectURL(pendingAttachment.previewUrl);
            }
        };
    }, [pendingAttachment]);

    useEffect(() => {
        const checkStatus = () => {
            const connected = chatService.connection?.state === 'Connected';
            if (connected !== isConnected) setIsConnected(connected);
        };
        const interval = setInterval(checkStatus, 2000);
        checkStatus();
        return () => clearInterval(interval);
    }, [isConnected]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) setShowEmojiPicker(false);
            if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) setIsAttachmentMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [newMessage]);

    const fetchChannels = useCallback(async () => {
        try {
            const response = await chatService.getUserChannels();
            setProjectChannels(response.data.projectChannels);
            setDirectChannels(response.data.directChannels);
            if (updateTotalUnreadCount) updateTotalUnreadCount();
        } catch (error) { console.error(error); }
    }, [updateTotalUnreadCount]);

    const fetchColleagues = useCallback(async () => {
        try {
            const res = await userService.getColleagues();
            setAllColleagues(res.data);
        } catch (err) { console.error(err); }
    }, []);

    useEffect(() => {
        fetchChannels();
        fetchColleagues();
        if (!isConnected) return;
        const connection = chatService.connection;
        
        connection.on("ReceiveMessage", (message) => {
            if (selectedChannel?.id === message.channelId) {
                setMessages(prev => {
                    if (prev.some(m => m.id === message.id)) return prev;
                    return [...prev, message].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
                });
                if (String(message.senderId) !== String(user.id)) {
                    chatService.markMessagesAsSeen(Number(message.channelId));
                }
            } else {
                fetchChannels();
            }
        });

        connection.on("UpdateUnreadCount", fetchChannels);
        connection.on("MessagesSeen", (data) => {
            if (selectedChannel?.id === data.channelId) {
                setMessages(prev => prev.map(msg => 
                    (String(msg.senderId) === String(user.id) && !msg.seenAt) 
                    ? { ...msg, seenAt: data.seenAt } 
                    : msg
                ));
            }
        });
        connection.on("UpdateMessageReactions", (data) => {
            setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, reactions: data.reactions } : m));
        });
        connection.on("MessageDeleted", (messageId) => {
            setMessages(prev => prev.filter(m => m.id !== messageId));
        });
        connection.on("MessageEdited", (data) => {
            setMessages(prev => prev.map(m => m.id === data.messageId ? { 
                ...m, 
                content: data.content, 
                editedAt: data.editedAt 
            } : m));
        });

        return () => {
            connection.off("ReceiveMessage"); 
            connection.off("UpdateUnreadCount"); 
            connection.off("MessagesSeen");
            connection.off("UpdateMessageReactions"); 
            connection.off("MessageDeleted"); 
            connection.off("MessageEdited");
        };
    }, [fetchChannels, isConnected, selectedChannel, user.id, fetchColleagues]);

    useEffect(() => {
        if (chatPanelRef.current) chatPanelRef.current.scrollTop = chatPanelRef.current.scrollHeight;
    }, [messages]);

    const handleChannelSelection = useCallback(async (channel) => {
        if (!channel || channel.id === selectedChannel?.id) return;
        setSelectedChannel(channel);
        setMessages([]);
        setReplyingTo(null);
        setEditingMessage({ id: null, content: '' });
        setIsAttachmentMenuOpen(false);
        try {
            const response = await chatService.getChannelMessages(channel.id);
            setMessages(response.data.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt)));
            if (chatService.connection?.state === 'Connected') {
                chatService.markMessagesAsSeen(Number(channel.id));
                chatService.connection.invoke("JoinChannel", Number(channel.id));
            }
            fetchChannels();
        } catch (error) { toast.error("Error loading messages."); }
    }, [selectedChannel?.id, fetchChannels]);

    const handleProcessFile = (file) => {
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        const fileType = getFileType(file);
        setPendingAttachment({
            file,
            previewUrl,
            type: fileType,
            name: file.name,
            size: file.size,
            mimeType: file.type
        });
        setAttachmentCaption('');
        setIsAttachmentMenuOpen(false);
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files[0];
        if (file) handleProcessFile(file);
        e.target.value = null; 
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1 || items[i].type.indexOf('video') !== -1) {
                e.preventDefault();
                const file = items[i].getAsFile();
                handleProcessFile(file);
                break;
            }
        }
    };

    const handleSendAttachment = () => {
        if (!pendingAttachment || !selectedChannel) return;
        const tempMessage = {
            id: Date.now(),
            channelId: selectedChannel.id,
            senderId: user.id,
            senderFullName: user.fullName,
            senderAvatarUrl: user.avatarUrl,
            content: attachmentCaption || '',
            sentAt: new Date().toISOString(),
            messageType: 'file',
            attachmentUrl: pendingAttachment.previewUrl,
            fileName: pendingAttachment.name,
            fileSize: pendingAttachment.size,
            fileType: pendingAttachment.mimeType,
            reactions: [],
            seenAt: null
        };
        setMessages(prev => [...prev, tempMessage]);
        toast.success("Attachment sent successfully.");
        setPendingAttachment(null);
        setAttachmentCaption('');
    };

    const sendLocationMessage = async (latitude, longitude) => {
        if (!selectedChannel) return;
        if (!isConnected) { toast.error("Connection lost"); return; }
        try {
            await chatService.connection.invoke("SendLocation", Number(selectedChannel.id), latitude, longitude);
            toast.success("Location shared.");
        } catch (err) { 
            console.error(err);
            toast.error("Error sharing location."); 
        }
    };

    const handleLocationClick = () => {
        if (!selectedChannel) {
            toast.error("Select a channel first.");
            return;
        }
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }
        setSendingLocation(true);
        const DEFAULT_LAT = 35.6995;
        const DEFAULT_LNG = 51.412;
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setSendingLocation(false);
                const { latitude, longitude } = position.coords;
                sendLocationMessage(latitude, longitude);
            },
            (error) => {
                setSendingLocation(false);
                toast.error("Could not fetch accurate location. Sending default.");
                sendLocationMessage(DEFAULT_LAT, DEFAULT_LNG);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedChannel) return;
        if (!isConnected) { toast.error("Connection lost"); return; }
        try {
            await chatService.connection.invoke("SendMessage", Number(selectedChannel.id), newMessage, replyingTo?.id ? Number(replyingTo.id) : null);
            setNewMessage('');
            setReplyingTo(null);
            setShowEmojiPicker(false);
            setIsAttachmentMenuOpen(false);
        } catch (err) { toast.error("Error sending message."); }
    };

    const handleToggleReaction = async (messageId, emoji) => {
        if (chatService.connection && chatService.connection.state === 'Connected') {
            try {
                await chatService.connection.invoke("ToggleReaction", Number(messageId), emoji);
            } catch (err) {
                console.error("SignalR ToggleReaction Error:", err);
                toast.error("Error setting reaction");
            }
        } else {
            toast.error("Connection lost");
        }
    };

    const handleSaveEdit = async () => {
        if (!editingMessage.id || !editingMessage.content.trim()) return;
        if (!isConnected) { toast.error("Connection lost"); return; }
        try {
            await chatService.connection.invoke("EditMessage", Number(editingMessage.id), editingMessage.content);
            setEditingMessage({ id: null, content: '' });
        } catch (err) { toast.error("Error editing message"); }
    };

    const handleDeleteMessage = async (forEveryone) => {
        if (!deleteModal.messageId) return;
        if (!isConnected) { toast.error("Connection lost"); return; }
        try {
            await chatService.connection.invoke("DeleteMessage", Number(deleteModal.messageId), forEveryone);
            setDeleteModal({ isOpen: false, messageId: null });
        } catch (err) { toast.error("Error deleting message"); }
    };

    const startDirectChat = useCallback(async (otherUserId) => {
        setIsNewChatModalOpen(false);
        try {
            const { data } = await api.post('/chat/direct', { otherUserId });
            await fetchChannels();
            const refreshedRes = await chatService.getUserChannels();
            const refreshedAll = [...refreshedRes.data.projectChannels, ...refreshedRes.data.directChannels];
            const newChannel = refreshedAll.find(c => c.id === data.id);
            if (newChannel) handleChannelSelection(newChannel);
        } catch(error) { toast.error("Error starting chat."); }
    }, [fetchChannels, handleChannelSelection]);

    const filteredProjects = useMemo(() => projectChannels.filter(c => c.name.toLowerCase().includes(projectSearch.toLowerCase())), [projectChannels, projectSearch]);
    const filteredDirects = useMemo(() => directChannels.filter(c => c.name.toLowerCase().includes(directSearch.toLowerCase())), [directChannels, directSearch]);

    return (
      <div dir="ltr" className="h-full">
        {contextMenu && (
            <ChatContextMenu menuPosition={contextMenu} message={contextMenu.message} user={user} onClose={() => setContextMenu(null)} onCopy={() => { navigator.clipboard.writeText(contextMenu.message.content); toast.success("Copied"); setContextMenu(null); }} onEdit={() => { setEditingMessage({ id: contextMenu.message.id, content: contextMenu.message.content }); setContextMenu(null); }} onDelete={(id) => setDeleteModal({isOpen: true, messageId: id})} onReact={handleToggleReaction} onReply={setReplyingTo} />
        )}
        <DeleteConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({isOpen: false, messageId: null})} onConfirm={handleDeleteMessage} />
        <NewChatModal isOpen={isNewChatModalOpen} onClose={() => setIsNewChatModalOpen(false)} onSelectUser={startDirectChat} />
        
        <AttachmentPreviewModal 
            attachment={pendingAttachment} 
            caption={attachmentCaption} 
            setCaption={setAttachmentCaption} 
            onClose={() => setPendingAttachment(null)} 
            onSend={handleSendAttachment} 
        />
        
        <div className="p-8 h-full flex flex-col overflow-hidden text-left">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full min-h-0">
                {/* Sidebar */}
                <div className="lg:col-span-1 h-full min-h-0 flex flex-col">
                    <div className="flat-card rounded-3xl p-4 h-full flex flex-col bg-white border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-2 mb-2"><h3 className="font-black text-slate-800 text-lg">Discussions</h3></div>
                        <div className="flex-1 overflow-y-auto scrollbar-flat pr-2">
                            <div className="mb-4 border-b border-slate-100 pb-2">
                                <button onClick={() => setIsProjectExpanded(!isProjectExpanded)} className="flex items-center justify-between w-full px-2 py-2.5 hover:bg-slate-50 rounded-2xl transition-all">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-500 text-xs uppercase tracking-wider">Project Channels</h4>
                                        <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">{projectChannels.length}</span>
                                    </div>
                                    {isProjectExpanded ? <ChevronUpIcon className="w-4 h-4 text-slate-400"/> : <ChevronDownIcon className="w-4 h-4 text-slate-400"/>}
                                </button>
                                <AnimatePresence>
                                    {isProjectExpanded && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                            <div className="relative my-2 px-1"><MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Search channel..." value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl pl-9 py-2 text-xs focus:ring-1 focus:ring-blue-100" /></div>
                                            <div className="mt-2 space-y-1">
                                                {filteredProjects.map(channel => (
                                                    <div key={channel.id} className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${selectedChannel?.id === channel.id ? 'bg-blue-600 text-white shadow-blue-200 shadow-md' : 'hover:bg-slate-50 text-slate-700'}`} onClick={() => handleChannelSelection(channel)}>
                                                        <div className="flex items-center gap-2.5"><div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedChannel?.id === channel.id ? 'bg-white/20' : 'bg-slate-100'}`}><FolderIcon className={`w-4 h-4 ${selectedChannel?.id === channel.id ? 'text-white' : 'text-slate-500'}`}/></div><h4 className="font-bold text-xs truncate max-w-[120px]">{channel.name}</h4></div>
                                                        {channel.unreadCount > 0 && <span className={`${selectedChannel?.id === channel.id ? 'bg-white text-blue-600' : 'bg-red-500 text-white'} text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full`}>{channel.unreadCount}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div>
                                <div className="flex items-center justify-between px-2 py-2">
                                    <button onClick={() => setIsDirectExpanded(!isDirectExpanded)} className="flex items-center gap-2 hover:bg-slate-50 rounded-xl transition-all"><h4 className="font-bold text-slate-500 text-xs uppercase tracking-wider">Direct Messages</h4>{isDirectExpanded ? <ChevronUpIcon className="w-4 h-4 text-slate-400"/> : <ChevronDownIcon className="w-4 h-4 text-slate-400"/>}</button>
                                    <button onClick={() => setIsNewChatModalOpen(true)} className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><PlusIcon className="w-5 h-5"/></button>
                                </div>
                                <AnimatePresence>
                                    {isDirectExpanded && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                            <div className="relative my-2 px-1"><MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Search contact..." value={directSearch} onChange={(e) => setDirectSearch(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl pl-9 py-2 text-xs focus:ring-1 focus:ring-blue-100" /></div>
                                            <div className="mt-2 space-y-1">
                                                {filteredDirects.map(channel => (
                                                    <div key={channel.id} className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${selectedChannel?.id === channel.id ? 'bg-blue-600 text-white shadow-blue-200 shadow-md' : 'hover:bg-slate-50 text-slate-700'}`} onClick={() => handleChannelSelection(channel)}>
                                                        <div className="flex items-center gap-2.5"><img src={channel.avatarUrl ? `${SERVER_URL}/${channel.avatarUrl}` : `https://ui-avatars.com/api/?name=${channel.name}&background=random&color=fff`} className="w-9 h-9 rounded-full object-cover border border-white shadow-sm" alt=""/><h4 className="font-bold text-xs truncate max-w-[120px]">{channel.name}</h4></div>
                                                        {channel.unreadCount > 0 && <span className={`${selectedChannel?.id === channel.id ? 'bg-white text-blue-600' : 'bg-red-500 text-white'} text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full`}>{channel.unreadCount}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Chat Panel */}
                <div className="lg:col-span-3 h-full min-h-0 flex flex-col gap-4">
                    {showColleaguesBar && allColleagues.length > 0 && (
                        <div className="flat-card bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-24 shrink-0 flex items-center">
                            <div className="flex items-center justify-between w-full px-4">
                                <div className="flex items-center gap-5 overflow-x-auto scrollbar-none py-2 px-2 h-full w-full">
                                    {allColleagues.map((col) => (
                                        <div key={col.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group min-w-[65px]" onClick={() => startDirectChat(col.id)}>
                                            <div className="relative p-1">
                                                <img src={col.avatarUrl ? `${SERVER_URL}/${col.avatarUrl}` : `https://ui-avatars.com/api/?name=${col.fullName}&background=random&color=fff`} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md z-10 relative" alt={col.fullName} />
                                                {col.isOnline && <div className="absolute inset-0 rounded-full bg-emerald-500/20 z-0 scale-125 soft-pulse-effect"></div>}
                                                {col.isOnline && <div className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full z-20 shadow-sm"></div>}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-600 truncate max-w-[60px]">{col.fullName.split(' ')[0]}</span>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => setShowColleaguesBar(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                                    title="Hide online colleagues"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                    {!showColleaguesBar && (
                        <div className="flex justify-start px-2">
                            <button 
                                onClick={() => setShowColleaguesBar(true)}
                                className="text-xs text-blue-600 font-bold hover:underline transition-colors flex items-center gap-1"
                            >
                                <UsersIcon className="w-4 h-4" />
                                Show Online Colleagues
                            </button>
                        </div>
                    )}

                    <div className="flat-card rounded-3xl flex-1 flex flex-col bg-white overflow-hidden relative border border-slate-100 shadow-sm min-h-0">
                        {selectedChannel ? (
                            <>
                                <div className="p-4 border-b flex items-center justify-between bg-white z-10 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full border border-slate-100 overflow-hidden bg-blue-50 flex items-center justify-center">
                                            {selectedChannel.avatarUrl ? (
                                                <img src={`${SERVER_URL}/${selectedChannel.avatarUrl}`} className="w-full h-full object-cover" alt={selectedChannel.name} />
                                            ) : (
                                                <span className="text-blue-600 font-black text-sm">{selectedChannel.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-sm">{selectedChannel.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold">{selectedChannel.channelType === 'Project' ? 'Project Channel' : 'Direct Conversation'}</p>
                                        </div>
                                    </div>
                                    {!isConnected && <span className="text-[10px] text-red-500 font-bold animate-pulse">Connecting...</span>}
                                </div>
                                <div ref={chatPanelRef} className="flex-1 p-6 overflow-y-auto scrollbar-flat bg-[#f8fafc] flex flex-col" style={{ scrollBehavior: 'smooth' }}>
                                    {messages.map((msg) => (
                                        <MessageBubble key={msg.id} msg={msg} isSender={String(msg.senderId) === String(user.id)} onContextMenu={(e, m) => setContextMenu({ x: e.clientX, y: e.clientY, message: m })} onSaveEdit={handleSaveEdit} onCancelEdit={() => setEditingMessage({id:null})} editingMessage={editingMessage} setEditingMessage={setEditingMessage} onReact={handleToggleReaction} />
                                    ))}
                                    <div className="h-4"></div>
                                </div>
                                
                                <div className="px-4 py-4 bg-white border-t border-slate-50 relative">
                                    <AnimatePresence>
                                        {replyingTo && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex items-center justify-between bg-blue-50/80 p-2.5 border-l-4 border-blue-500 mb-2 rounded-t-2xl mx-12 shadow-sm">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <ArrowUturnLeftIcon className="w-4 h-4 text-blue-500" />
                                                    <div className="text-xs truncate"><span className="font-bold text-blue-600">{replyingTo.senderFullName}:</span> <span className="text-slate-600">{replyingTo.content}</span></div>
                                                </div>
                                                <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-blue-200 rounded-full transition-colors"><XMarkIcon className="w-4 h-4 text-blue-500"/></button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="flex items-end gap-3 max-w-6xl mx-auto relative">
                                        <div className="relative mb-0.5" ref={attachmentMenuRef}>
                                            <button 
                                                onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)} 
                                                className={`p-2.5 transition-all rounded-full ${isAttachmentMenuOpen ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'}`}
                                            >
                                                <PaperClipIcon className="w-6 h-6" />
                                            </button>
                                            <AnimatePresence>
                                                {isAttachmentMenuOpen && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                                                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                                                        exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                                                        className="absolute bottom-full left-0 mb-3 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 py-1.5 z-50 overflow-hidden"
                                                    >
                                                        <button onClick={() => imageInputRef.current.click()} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-slate-700 text-xs font-bold">
                                                            <PhotoIcon className="w-4 h-4 text-blue-500" /> Photos & Videos
                                                        </button>
                                                        <button onClick={() => documentInputRef.current.click()} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-slate-700 text-xs font-bold">
                                                            <DocumentIcon className="w-4 h-4 text-emerald-500" /> Document File
                                                        </button>
                                                        <button onClick={handleLocationClick} disabled={sendingLocation} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-slate-700 text-xs font-bold disabled:opacity-50">
                                                            <MapPinIcon className="w-4 h-4 text-rose-500" /> {sendingLocation ? 'Fetching location...' : 'Share Location'}
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        
                                        <input type="file" ref={imageInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileInputChange} />
                                        <input type="file" ref={documentInputRef} className="hidden" accept="*" onChange={handleFileInputChange} />

                                        <div className="flex-1 flex items-end bg-slate-50 rounded-2xl border border-slate-200 transition-all px-3 py-1.5 min-h-[48px]">
                                            <textarea 
                                                ref={textareaRef} 
                                                value={newMessage} 
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onPaste={handlePaste} 
                                                placeholder="Type a message..." 
                                                rows={1} 
                                                className="w-full bg-transparent border-none focus:ring-0 outline-none text-slate-800 resize-none py-1.5 px-2 text-xs leading-relaxed scrollbar-none shadow-none"
                                                style={{ overflow: 'hidden' }}
                                            />
                                            <div className="relative mb-0.5" ref={emojiPickerRef}>
                                                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`transition-colors ${showEmojiPicker ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'}`}>
                                                    <FaceSmileIcon className="w-6 h-6" />
                                                </button>
                                                <AnimatePresence>
                                                    {showEmojiPicker && (
                                                        <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: -20, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute bottom-full right-0 z-50 shadow-2xl rounded-2xl overflow-hidden border border-slate-100">
                                                            <EmojiPicker emojiStyle={EmojiStyle.NATIVE} onEmojiClick={(e) => setNewMessage(p => p + e.emoji)} lazyLoadEmojis={true} searchPlaceholder="Search emoji..." />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        <button onClick={handleSendMessage} disabled={!newMessage.trim()} className={`p-3 rounded-full shadow-lg transition-all mb-0.5 active:scale-90 ${newMessage.trim() ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>
                                            <PaperAirplaneIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300 bg-[#f8fafc]"><div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-50"><UsersIcon className="w-12 h-12 text-slate-200"/></div><h3 className="font-bold text-base text-slate-400 text-center">No Discussion Selected</h3><p className="text-xs mt-1 text-slate-400 text-center">Select a contact or channel to start chatting</p></div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
};

export default Chat;