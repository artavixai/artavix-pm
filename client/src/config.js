// خواندن آدرس پایه از متغیرهای محیطی
// اگر متغیری تعریف نشده باشد، به صورت پیش‌فرض از لوکال‌هاست استفاده می‌کند
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5244';

// آدرس پایه برای درخواست‌های API
export const API_URL = `${SERVER_URL}/api`;

// آدرس پایه برای سوکت‌های SignalR
export const CHAT_HUB_URL = `${SERVER_URL}/chathub`;