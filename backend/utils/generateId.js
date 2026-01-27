export const generateId = (prefix, count) => {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}`;
  return `${prefix}-${yearMonth}${String(count).padStart(3,'0')}`;
};
