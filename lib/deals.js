export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// on today if it isn't past its end date and today's one of its days (no days = every day)
export const dealIsOn = (deal, now = new Date()) => {
  if (deal.ends && new Date(`${deal.ends}T23:59:59`) < now) return false;
  return !deal.days?.length || deal.days.includes(DAYS[now.getDay()]);
};

export const dealWhen = (deal) => {
  if (!deal.days?.length) return 'Every day';
  if (deal.days.length === 1) return `${deal.days[0]}s`;
  return deal.days.join(' · ');
};
