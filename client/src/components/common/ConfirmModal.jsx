import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', cancelText = 'Cancel', type = 'danger' }) => {
    if (!isOpen) return null;

    const colors = {
        danger: { bg: 'bg-red-50', border: 'border-red-200', button: 'bg-red-600 hover:bg-red-700', icon: 'text-red-500' },
        warning: { bg: 'bg-amber-50', border: 'border-amber-200', button: 'bg-amber-600 hover:bg-amber-700', icon: 'text-amber-500' },
        info: { bg: 'bg-blue-50', border: 'border-blue-200', button: 'bg-blue-600 hover:bg-blue-700', icon: 'text-blue-500' }
    };

    const style = colors[type] || colors.danger;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                onClick={onClose}
                dir="ltr"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className={`bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ${style.border} border-t-4`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={`p-6 text-center ${style.bg}`}>
                        <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${style.icon} bg-white shadow-sm`}>
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mt-4">{title || 'Confirm Action'}</h3>
                        <p className="text-slate-500 text-sm mt-2">{message || 'Are you sure you want to delete this item? This action cannot be undone.'}</p>
                    </div>
                    <div className="flex gap-3 p-6 pt-4">
                        <button onClick={onConfirm} className={`flex-1 ${style.button} text-white py-2.5 rounded-xl font-bold transition-all shadow-md`}>
                            {confirmText}
                        </button>
                        <button onClick={onClose} className="flex-1 flat-button py-2.5 rounded-xl font-bold transition-all">
                            {cancelText}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ConfirmModal;