import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import HomeScreen from '@/app/index';
import { storage } from '@/services/storage';

// Mock the storage
jest.mock('@/services/storage');
const mockStorage = storage as jest.Mocked<typeof storage>;

describe('Home Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display scores after navigating back from manual entry', async () => {
    // Start with no scores
    mockStorage.getTablesWithScores.mockResolvedValue([]);

    const { rerender } = render(<HomeScreen />);

    // Verify empty state shows
    await waitFor(() => {
      expect(screen.getByText(/No scores yet!/i)).toBeTruthy();
    });

    // Simulate navigating away and back with a new score added
    // The useFocusEffect mock calls the callback on every render
    mockStorage.getTablesWithScores.mockResolvedValue([
      {
        id: '1',
        name: 'Medieval Madness',
        manufacturer: 'Williams',
        topScores: [{
          id: 's1',
          tableId: '1',
          score: 125000000,
          date: new Date().toISOString(),
        }],
      },
    ]);

    // Re-render to simulate coming back to the screen
    rerender(<HomeScreen />);

    // Verify the new score appears
    await waitFor(() => {
      expect(screen.getByText('Medieval Madness')).toBeTruthy();
      expect(screen.getByText('125,000,000')).toBeTruthy();
    });
  });
});
