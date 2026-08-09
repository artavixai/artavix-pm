import React from 'react';
import moment from 'moment';
import { Icons } from '../icons';
import { formatDigit } from './helpers';

const HeaderBar = ({
  currentDate,
  onDateChange,
  currentView,
  onViewChange,
}) => {
  
  const getUnit = (view) => {
    switch (view) {
      case 'month': return 'month';
      case 'week': return 'week';
      case 'day': return 'day';
      default: return 'day';
    }
  };

  const handlePrev = () => {
    onDateChange(currentDate.clone().subtract(1, getUnit(currentView)));
  };

  const handleNext = () => {
    onDateChange(currentDate.clone().add(1, getUnit(currentView)));
  };

  const handleToday = () => {
    onDateChange(moment());
  };

  const getHeaderText = () => {
    const date = currentDate.clone();
    let text = '';
    switch (currentView) {
      case 'month':
        text = date.format('MMMM YYYY');
        break;
      case 'week': {
        const startOfWeek = date.clone().startOf('week');
        const endOfWeek = date.clone().endOf('week');
        if (startOfWeek.month() !== endOfWeek.month()) {
          text = `Week ${startOfWeek.format('MMM DD')} - ${endOfWeek.format('MMM DD, YYYY')}`;
        } else {
          text = `Week ${startOfWeek.format('MMM DD')} to ${endOfWeek.format('DD, YYYY')}`;
        }
        break;
      }
      case 'day':
        text = date.format('dddd, MMMM DD, YYYY');
        break;
      default:
        text = '';
    }
    return formatDigit(text);
  };
  
  const viewOptions = [
    { key: 'month', label: 'Month' },
    { key: 'week', label: 'Week' },
    { key: 'day', label: 'Day' },
  ];

  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-200" dir="ltr">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800 w-72 text-left">
          {getHeaderText()}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            aria-label="Previous Period"
          >
            <Icons.ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleToday}
            className="px-4 py-2 text-xs font-bold border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            aria-label="Next Period"
          >
            <Icons.ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex items-center p-1 bg-slate-100 rounded-xl">
         {viewOptions.map(option => (
            <button
                key={option.key}
                onClick={() => onViewChange(option.key)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                    currentView === option.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
            >
                {option.label}
            </button>
         ))}
      </div>
    </div>
  );
};

export default HeaderBar;