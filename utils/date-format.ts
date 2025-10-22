const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Format date as "Oct 10, '24"
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export function formatScoreDate(dateString: string): string {
  const date = new Date(dateString);
  const month = MONTH_NAMES[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear().toString().slice(-2);

  return `${month} ${day}, '${year}`;
}
