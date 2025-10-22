import { formatScoreDate } from '@/utils/date-format';

describe('formatScoreDate', () => {
  it('should format date as "Oct 10, \'24"', () => {
    const date = new Date('2024-10-10T12:00:00Z');
    expect(formatScoreDate(date.toISOString())).toBe("Oct 10, '24");
  });

  it('should handle single digit days', () => {
    const date = new Date('2024-01-05T12:00:00Z');
    expect(formatScoreDate(date.toISOString())).toBe("Jan 5, '24");
  });

  it('should handle different months', () => {
    const date = new Date('2024-12-25T12:00:00Z');
    expect(formatScoreDate(date.toISOString())).toBe("Dec 25, '24");
  });

  it('should handle year 2025', () => {
    const date = new Date('2025-03-15T12:00:00Z');
    expect(formatScoreDate(date.toISOString())).toBe("Mar 15, '25");
  });
});
