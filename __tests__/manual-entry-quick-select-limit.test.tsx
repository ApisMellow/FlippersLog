import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import ManualEntryScreen from '@/app/manual-entry';
import { storage } from '@/services/storage';
import { useRouter } from 'expo-router';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useFocusEffect: jest.fn((callback) => {
    callback();
  }),
}));

jest.mock('@/services/storage');
const mockStorage = storage as jest.Mocked<typeof storage>;

describe('Manual Entry - Quick Select Limit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      back: jest.fn(),
    });
  });

  it('should show only 10 most recent tables in quick select', async () => {
    const mockTables = Array.from({ length: 15 }, (_, i) => ({
      id: `table-${i}`,
      name: `Table ${i}`,
      lastUsedDate: new Date(Date.now() - i * 1000000).toISOString(), // Most recent first
    }));

    mockStorage.getTables.mockResolvedValue(mockTables);
    mockStorage.getSampleTables.mockResolvedValue([]);

    const { getByText, queryByText } = render(<ManualEntryScreen />);

    await waitFor(() => {
      // Should only show first 10 tables (0-9)
      for (let i = 0; i < 10; i++) {
        expect(getByText(`Table ${i}`)).toBeTruthy();
      }

      // Should NOT show tables 10-14
      expect(queryByText('Table 10')).toBeNull();
      expect(queryByText('Table 14')).toBeNull();
    });
  });

  it('should fall back to sample tables if user has no saved tables', async () => {
    mockStorage.getTables.mockResolvedValue([]);
    mockStorage.getSampleTables.mockResolvedValue([
      {
        id: 'sample-1',
        name: 'Medieval Madness',
        year: 1997,
      },
    ]);

    const { getByText } = render(<ManualEntryScreen />);

    await waitFor(() => {
      expect(getByText('Medieval Madness')).toBeTruthy();
    });
  });
});
