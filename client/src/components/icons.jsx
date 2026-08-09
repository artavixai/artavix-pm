import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Plus,
  Trash2,
  X,
  Edit
} from 'lucide-react';

/**
 * کامپوننت مرکزی برای مدیریت تمام آیکن‌ها
 */
export const Icons = {
  ChevronLeft: (props) => <ChevronLeft {...props} />,
  ChevronRight: (props) => <ChevronRight {...props} />,
  Calendar: (props) => <CalendarIcon {...props} />,
  Clock: (props) => <Clock {...props} />,
  Users: (props) => <Users {...props} />,
  Plus: (props) => <Plus {...props} />,
  Trash: (props) => <Trash2 {...props} />,
  Close: (props) => <X {...props} />,
  Edit: (props) => <Edit {...props} />,
};