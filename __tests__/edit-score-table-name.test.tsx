import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import EditScore from '@/app/edit-score';
import { storage } from '@/services/storage';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

// Mock the storage
jest.mock('@/services/storage');
const mockStorage = storage as jest.Mocked<typeof storage>;

describe('Edit Score Screen - Table Name Display', () => {
  const mockRouter = {
    back: jest.fn(),
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      scoreId: 'test-score-1',
    });
    mockStorage.getTables.mockResolvedValue([
      {
        id: 'table-1',
        name: 'Medieval Madness',
      },
    ]);
  });

  it('should display the table name instead of "Unknown" when tableName is populated', async () => {
    // Score with tableName (new format)
    mockStorage.getScoreById.mockResolvedValue({
      id: 'test-score-1',
      score: 12345,
      tableName: 'Medieval Madness',
      date: '2025-10-24T10:00:00Z',
    });

    const { findByText } = render(<EditScore />);

    // Should display the actual table name, not "Unknown"
    await waitFor(async () => {
      expect(await findByText(/Table: Medieval Madness/)).toBeTruthy();
    });
  });

  it('should handle missing tableName gracefully', async () => {
    // Score with missing tableName (legacy format without tableName)
    mockStorage.getScoreById.mockResolvedValue({
      id: 'test-score-2',
      score: 54321,
      date: '2025-10-24T10:00:00Z',
    });

    const { findByText } = render(<EditScore />);

    // With missing tableName, should show "Unknown" as fallback
    await waitFor(async () => {
      expect(await findByText(/Table: Unknown/)).toBeTruthy();
    });
  });
});
