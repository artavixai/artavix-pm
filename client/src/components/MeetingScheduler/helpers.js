import moment from 'moment';

export const WEEKDAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const formatDigit = (n) => {
  if (n === null || n === undefined) return '';
  return String(n);
};

export const getMonthDays = (date) => {
  const month = date.month();
  const year = date.year();

  const firstDayOfMonth = moment([year, month, 1]);
  const startDayOfWeek = firstDayOfMonth.day();

  const firstDayOfGrid = firstDayOfMonth.clone().subtract(startDayOfWeek, 'days');

  const weeks = [];
  let currentDay = firstDayOfGrid.clone();

  for (let i = 0; i < 6; i++) {
    const week = [];
    for (let j = 0; j < 7; j++) {
      week.push(currentDay.clone());
      currentDay.add(1, 'day');
    }
    weeks.push(week);
    if (currentDay.month() !== month && i >= 3) {
      break;
    }
  }
  return weeks;
};