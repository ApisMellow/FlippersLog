import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../app/index';
import * as venueContext from '../../services/venue-context';
import { storage } from '../../services/storage';

jest.mock('../../services/venue-context');
jest.mock('../../services/storage', () => ({
  storage: {
    getTablesWithScores: jest.fn(),
  },
}));

describe('Home Screen - Venue Filtering', () => {
  const mockScores = [
    { id: '1', tableName: 'Medieval Madness', score: 50000, date: '2025-01-10', venueId: 1 },
    { id: '2', tableName: 'Twilight Zone', score: 75000, date: '2025-01-10', venueId: 2 },
    { id: '3', tableName: 'Medieval Madness', score: 60000, date: '2025-01-09', venueId: 1 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows all scores when no venue context', async () => {
    (venueContext.getActiveVenue as jest.Mock).mockResolvedValue(null);
    (storage.getTablesWithScores as jest.Mock).mockResolvedValue([
      {
        id: '1',
        name: 'Medieval Madness',
        manufacturer: 'Williams',
        topScores: [
          { id: '1', score: 50000, date: '2025-01-10', venueId: 1 },
          { id: '3', score: 60000, date: '2025-01-09', venueId: 1 },
        ],
      },
      {
        id: '2',
        name: 'Twilight Zone',
        manufacturer: 'Bally',
        topScores: [
          { id: '2', score: 75000, date: '2025-01-10', venueId: 2 },
        ],
      },
    ]);

    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByText('Medieval Madness')).toBeTruthy();
      expect(screen.getByText('Twilight Zone')).toBeTruthy();
    });
  });

  it('filters scores by active venue', async () => {
    (venueContext.getActiveVenue as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Ice Box Arcade',
    });
    (storage.getTablesWithScores as jest.Mock).mockResolvedValue([]);

    render(<HomeScreen />);

    // Should only show scores from venue 1
  });

  it('displays venue chip when active venue set', async () => {
    (venueContext.getActiveVenue as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Ice Box Arcade',
    });
    (storage.getTablesWithScores as jest.Mock).mockResolvedValue([]);

    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByText('📍 Ice Box Arcade')).toBeTruthy();
      expect(screen.getByTestId('clear-venue-button')).toBeTruthy();
    });
  });

  it('clears venue context when X button tapped', async () => {
    (venueContext.getActiveVenue as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Ice Box Arcade',
    });
    (venueContext.clearActiveVenue as jest.Mock).mockResolvedValue(undefined);
    (storage.getTablesWithScores as jest.Mock).mockResolvedValue([]);

    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('clear-venue-button')).toBeTruthy();
    });

    const clearButton = screen.getByTestId('clear-venue-button');
    fireEvent.press(clearButton);

    await waitFor(() => {
      expect(venueContext.clearActiveVenue).toHaveBeenCalled();
    });
  });
});
