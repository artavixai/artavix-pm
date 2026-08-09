import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

// این کامپوننت فرزندان خود را فقط در صورتی رندر می‌کند که کاربر یکی از نقش‌های مجاز را داشته باشد
const RoleBasedGuard = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  // اگر کاربر لاگین نکرده یا هیچ نقشی ندارد، چیزی نمایش نده
  if (!user || !user.roles) {
    return null;
  }

  // بررسی اینکه آیا کاربر حداقل یکی از نقش‌های مجاز را دارد یا خیر
  const hasRequiredRole = user.roles.some(role => allowedRoles.includes(role));

  if (hasRequiredRole) {
    return <>{children}</>; // اگر دسترسی داشت، فرزندان را نمایش بده
  }

  return null; // اگر دسترسی نداشت، چیزی نمایش نده
};

export default RoleBasedGuard;