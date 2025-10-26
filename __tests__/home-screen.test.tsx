import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import HomeScreen from '@/app/index';
import { storage } from '@/services/storage';
import { formatScoreDate } from '@/utils/date-format';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useFocusEffect: jest.fn((callback) => {
    // Call the callback immediately to simulate screen focus
    callback();
  }),
}));

// Mock the storage
jest.mock('@/services/storage');
const mockStorage = storage as jest.Mocked<typeof storage>;

describe('Home Screen', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
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

  it('should display formatted date under each score', async () => {
    const mockScores = [
      {
        id: '1',
        name: 'Test Table',
        topScores: [{
          id: 'score-1',
          score: 1000000,
          tableName: 'Test Table',
          date: '2024-10-10T12:00:00Z',
        }],
      },
    ];

    mockStorage.getTablesWithScores.mockResolvedValue(mockScores);

    const { findByText } = render(<HomeScreen />);

    const formattedDate = formatScoreDate('2024-10-10T12:00:00Z');
    expect(await findByText(formattedDate)).toBeTruthy();
  });

  it('should navigate to edit-score when edit button tapped', async () => {
    const mockScores = [
      {
        id: '1',
        name: 'Test Table',
        topScores: [{
          id: 'score-123',
          score: 1000000,
          tableName: 'Test Table',
          date: '2024-10-10T12:00:00Z',
        }],
      },
    ];

    mockStorage.getTablesWithScores.mockResolvedValue(mockScores);

    const { findByTestId } = render(<HomeScreen />);

    const editButton = await findByTestId('edit-icon-0');
    fireEvent.press(editButton);

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/edit-score',
      params: { scoreId: 'score-123' },
    });
  });

  it('should delete score when swipe delete button tapped', async () => {
    const mockScores = [
      {
        id: '1',
        name: 'Test Table',
        topScores: [{
          id: 'score-123',
          score: 1000000,
          tableName: 'Test Table',
          date: '2024-10-10T12:00:00Z',
        }],
      },
    ];

    mockStorage.getTablesWithScores.mockResolvedValue(mockScores);
    mockStorage.deleteScore.mockResolvedValue(undefined);

    const { findByTestId } = render(<HomeScreen />);

    const deleteButton = await findByTestId('swipe-delete-score-123');
    fireEvent.press(deleteButton);

    await waitFor(() => {
      expect(mockStorage.deleteScore).toHaveBeenCalledWith('score-123');
    });
  });

  it('should render swipeable component for each score', async () => {
    const mockScores = [
      {
        id: '1',
        name: 'Test Table',
        topScores: [{
          id: 'score-1',
          score: 1000000,
          tableName: 'Test Table',
          date: '2024-10-10T12:00:00Z',
        }],
      },
    ];
    mockStorage.getTablesWithScores.mockResolvedValue(mockScores);

    const { UNSAFE_getAllByType } = render(<HomeScreen />);

    await waitFor(() => {
      const swipeables = UNSAFE_getAllByType(Swipeable);
      expect(swipeables.length).toBeGreaterThan(0);
    });
  });

  it('renders venue discovery FAB', () => {
    const { getByTestId } = render(<HomeScreen />);
    const venueFab = getByTestId('venue-fab');
    expect(venueFab).toBeTruthy();
  });

  it('navigates to venues screen when venue FAB tapped', async () => {
    const { getByTestId } = render(<HomeScreen />);
    const venueFab = getByTestId('venue-fab');

    fireEvent.press(venueFab);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/venues');
    });
  });
});
