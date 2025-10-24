import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@/services/storage', () => ({
  storage: {
    addScore: jest.fn().mockResolvedValue(undefined),
    updateScore: jest.fn().mockResolvedValue(undefined),
    deleteScore: jest.fn().mockResolvedValue(undefined),
    getScoreById: jest.fn(),
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

import EditScore from '@/app/edit-score';

describe('EditScore', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('should render with detected score pre-filled', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      detectedScore: '42000000',
      detectedTableName: 'Test Table',
      photoUri: 'test://photo.jpg',
    });

    const { getByDisplayValue } = render(<EditScore />);

    expect(getByDisplayValue('42000000')).toBeTruthy();
  });

  it('should render with existing score for editing', async () => {
    const { storage } = require('@/services/storage');
    storage.getScoreById.mockResolvedValue({
      id: 'score-123',
      score: 9999999,
      tableName: 'Existing Table',
      date: '2024-10-10',
    });

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      scoreId: 'score-123',
    });

    const { findByDisplayValue } = render(<EditScore />);

    await waitFor(() => {
      expect(storage.getScoreById).toHaveBeenCalledWith('score-123');
    });

    expect(await findByDisplayValue('9999999')).toBeTruthy();
  });

  it('should save new score when coming from detection', async () => {
    const { storage } = require('@/services/storage');

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      detectedScore: '42000000',
      detectedTableName: 'Test Table',
      photoUri: 'test://photo.jpg',
    });

    const { getByText, getByDisplayValue } = render(<EditScore />);

    // Change the score
    const input = getByDisplayValue('42000000');
    fireEvent.changeText(input, '55555555');

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(storage.addScore).toHaveBeenCalledWith({
        score: 55555555,
        tableName: 'Test Table',
        date: expect.any(String),
        photoUri: 'test://photo.jpg',
      });
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  it('should update existing score when editing', async () => {
    const { storage } = require('@/services/storage');
    storage.getScoreById.mockResolvedValue({
      id: 'score-123',
      score: 1000000,
      tableName: 'Test Table',
      date: '2024-10-10',
    });

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      scoreId: 'score-123',
    });

    const { getByText, findByDisplayValue } = render(<EditScore />);

    const input = await findByDisplayValue('1000000');
    fireEvent.changeText(input, '2000000');

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(storage.updateScore).toHaveBeenCalledWith('score-123', {
        score: 2000000,
      });
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  it('should show validation error for invalid score', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      detectedScore: '1000',
    });

    const { getByText, getByDisplayValue } = render(<EditScore />);

    const input = getByDisplayValue('1000');
    fireEvent.changeText(input, '0');

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Score must be greater than 0');
    });
  });

  it('should delete score when Delete button pressed', async () => {
    const { storage } = require('@/services/storage');
    storage.getScoreById.mockResolvedValue({
      id: 'score-123',
      score: 1000000,
      tableName: 'Test Table',
      date: '2024-10-10',
    });

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      scoreId: 'score-123',
    });

    const { getByText } = render(<EditScore />);

    await waitFor(() => {
      expect(getByText('Delete')).toBeTruthy();
    });

    fireEvent.press(getByText('Delete'));

    await waitFor(() => {
      expect(storage.deleteScore).toHaveBeenCalledWith('score-123');
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  it('should not show Delete button in correction mode', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      detectedScore: '1000',
    });

    const { queryByText } = render(<EditScore />);

    expect(queryByText('Delete')).toBeNull();
  });

  it('photo takes up approximately 60% of screen height', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      detectedScore: '100000',
      detectedTableName: 'Medieval Madness',
      photoUri: 'file:///test.jpg',
    });

    const { getByTestId } = render(<EditScore />);
    const photo = getByTestId('photo-image');

    // 60% of typical screen (~350px from 600px total)
    expect(photo.props.style.height).toBeGreaterThanOrEqual(300);
  });

  it('buttons are side-by-side (equal width) at bottom', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      detectedScore: '100000',
      detectedTableName: 'Medieval Madness',
      photoUri: 'file:///test.jpg',
    });

    const { getByTestId } = render(<EditScore />);
    const buttonContainer = getByTestId('button-container');

    expect(buttonContainer.props.style.flexDirection).toBe('row');
  });
});
