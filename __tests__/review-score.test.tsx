import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

// Mock expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock storage
jest.mock('@/services/storage', () => ({
  storage: {
    addScore: jest.fn().mockResolvedValue(undefined),
  },
}));

// We'll need to import the actual component - this will fail initially
import ReviewScore from '@/app/review-score';

describe('ReviewScore', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('should display detected score and table name', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      photoUri: 'test://photo.jpg',
      detectedScore: '42000000',
      detectedTableName: 'Medieval Madness',
      confidence: '0.95',
    });

    const { getByText } = render(<ReviewScore />);

    expect(getByText(/42,000,000/)).toBeTruthy();
    expect(getByText(/Medieval Madness/)).toBeTruthy();
  });

  it('should show "Not detected" when table name missing', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      photoUri: 'test://photo.jpg',
      detectedScore: '1000000',
      confidence: '0.90',
    });

    const { getByText } = render(<ReviewScore />);

    expect(getByText(/Not detected/)).toBeTruthy();
  });

  it('should navigate to edit-score when "Wrong Score" tapped', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      photoUri: 'test://photo.jpg',
      detectedScore: '42000000',
      detectedTableName: 'Test Table',
      confidence: '0.95',
    });

    const { getByText } = render(<ReviewScore />);

    fireEvent.press(getByText('Wrong Score'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/edit-score',
      params: {
        detectedScore: '42000000',
        detectedTableName: 'Test Table',
        photoUri: 'test://photo.jpg',
      },
    });
  });

  it('should navigate to edit-table when "Wrong Name" tapped', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      photoUri: 'test://photo.jpg',
      detectedScore: '42000000',
      detectedTableName: 'Test Table',
      confidence: '0.95',
    });

    const { getByText } = render(<ReviewScore />);

    fireEvent.press(getByText('Wrong Name'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/edit-table',
      params: {
        detectedScore: '42000000',
        detectedTableName: 'Test Table',
        photoUri: 'test://photo.jpg',
      },
    });
  });

  it('should save score and navigate home when "Accept" tapped', async () => {
    const { storage } = require('@/services/storage');

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      photoUri: 'test://photo.jpg',
      detectedScore: '42000000',
      detectedTableName: 'Test Table',
      confidence: '0.95',
    });

    const { getByText } = render(<ReviewScore />);

    fireEvent.press(getByText(/Accept/));

    await waitFor(() => {
      expect(storage.addScore).toHaveBeenCalledWith({
        score: 42000000,
        tableName: 'Test Table',
        date: expect.any(String),
        photoUri: 'test://photo.jpg',
      });
      expect(mockRouter.push).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('should show warning for low confidence scores', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      photoUri: 'test://photo.jpg',
      detectedScore: '1000',
      confidence: '0.3',
    });

    const { getByText } = render(<ReviewScore />);

    expect(getByText(/Low confidence/i)).toBeTruthy();
  });
});
