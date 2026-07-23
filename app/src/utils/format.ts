export const formatLongDate = (date = new Date()) =>
  new Intl.DateTimeFormat('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })
    .format(date)
    .replace(/^./, char => char.toUpperCase());

export const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })
    .format(new Date(value))
    .replace('.', '');

export const formatDay = (value: string) =>
  new Intl.DateTimeFormat('es-EC', { weekday: 'long' }).format(new Date(value)).replace(/^./, char => char.toUpperCase());

export const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.max(0, seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
};

export const formatWeight = (weight: number) => Number.isInteger(weight) ? String(weight) : weight.toFixed(1);

export const isSameDay = (a: string | Date, b: string | Date) => {
  const left = new Date(a);
  const right = new Date(b);
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
};
