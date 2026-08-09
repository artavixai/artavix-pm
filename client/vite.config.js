import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // این خط باعث می‌شود روی تمام اینترفیس‌های شبکه (از جمله 192.168.12.130) در دسترس باشد
    port: 3001, // پورت کلاینت
    strictPort: true, // اگر پورت 3001 اشغال بود، خطا بدهد (به جای اینکه روی پورت دیگری اجرا شود)
  }
})