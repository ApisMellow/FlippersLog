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
    getScoreById: jest.fn(),
    getTables: jest.fn().mockResolvedValue([]),
  },
}));

jest.spyOn(Alert, 'alert');

import EditTable from '@/app/edit-table';

describe('EditTable', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('should render with detected table name pre-filled', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      detectedScore: '42000000',
      detectedTableName: 'Medieval Madness',
      photoUri: 'test://photo.jpg',
    });

    const { findByDisplayValue } = render(<EditTable />);

    expect(await findByDisplayValue('Medieval Madness')).toBeTruthy();
  });

  it('should display score as read-only context', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      detectedScore: '42000000',
    });

    const { findByText } = render(<EditTable />);

    expect(await findByText(/42,000,000/)).toBeTruthy();
  });

  it('should save new score with corrected table name', async () => {
    const { storage } = require('@/services/storage');

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      detectedScore: '42000000',
      detectedTableName: 'Wrong Name',
      photoUri: 'test://photo.jpg',
    });

    const { getByText, findByDisplayValue } = render(<EditTable />);

    const input = await findByDisplayValue('Wrong Name');
    fireEvent.changeText(input, 'Correct Name');

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(storage.addScore).toHaveBeenCalledWith({
        score: 42000000,
        tableName: 'Correct Name',
        date: expect.any(String),
        photoUri: 'test://photo.jpg',
      });
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  it('should update existing score table name', async () => {
    const { storage } = require('@/services/storage');
    storage.getScoreById.mockResolvedValue({
      id: 'score-123',
      score: 1000000,
      tableName: 'Old Table',
      date: '2024-10-10',
    });

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      scoreId: 'score-123',
    });

    const { getByText, findByDisplayValue } = render(<EditTable />);

    const input = await findByDisplayValue('Old Table');
    fireEvent.changeText(input, 'New Table');

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(storage.updateScore).toHaveBeenCalledWith('score-123', {
        tableName: 'New Table',
      });
      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  it('should show validation error for empty table name', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      detectedScore: '1000',
    });

    const { getByText, findByPlaceholderText } = render(<EditTable />);

    const input = await findByPlaceholderText('Enter table name');
    fireEvent.changeText(input, '');

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Table name cannot be empty');
    });
  });

  it('should load existing tables for quick selection', async () => {
    const { storage } = require('@/services/storage');
    storage.getTables.mockResolvedValue([
      { name: 'Medieval Madness', id: '1' },
      { name: 'Attack from Mars', id: '2' },
    ]);

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      detectedScore: '1000',
    });

    const { findByText } = render(<EditTable />);

    await waitFor(() => {
      expect(storage.getTables).toHaveBeenCalled();
    });

    expect(await findByText('Medieval Madness')).toBeTruthy();
    expect(await findByText('Attack from Mars')).toBeTruthy();
  });

  it('should filter quick select list as user types', async () => {
    const { storage } = require('@/services/storage');
    storage.getTables.mockResolvedValue([
      { name: 'Medieval Madness', id: '1' },
      { name: 'Attack from Mars', id: '2' },
      { name: 'Batman', id: '3' },
    ]);

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      detectedScore: '1000',
    });

    const { findByPlaceholderText, findByText, queryByText } = render(<EditTable />);

    // Wait for tables to load
    await waitFor(() => {
      expect(storage.getTables).toHaveBeenCalled();
    });

    // Initially, all tables should be visible
    expect(await findByText('Medieval Madness')).toBeTruthy();
    expect(await findByText('Attack from Mars')).toBeTruthy();
    expect(await findByText('Batman')).toBeTruthy();

    // Type "med" - should only show "Medieval Madness"
    const input = await findByPlaceholderText('Enter table name');
    fireEvent.changeText(input, 'med');

    await waitFor(() => {
      expect(queryByText('Medieval Madness')).toBeTruthy();
      expect(queryByText('Attack from Mars')).toBeNull();
      expect(queryByText('Batman')).toBeNull();
    });

    // Type "bat" - should only show "Batman"
    fireEvent.changeText(input, 'bat');

    await waitFor(() => {
      expect(queryByText('Medieval Madness')).toBeNull();
      expect(queryByText('Attack from Mars')).toBeNull();
      expect(queryByText('Batman')).toBeTruthy();
    });

    // Type "mars" - should only show "Attack from Mars"
    fireEvent.changeText(input, 'mars');

    await waitFor(() => {
      expect(queryByText('Medieval Madness')).toBeNull();
      expect(queryByText('Attack from Mars')).toBeTruthy();
      expect(queryByText('Batman')).toBeNull();
    });

    // Type "xyz" - should show no tables (allows creating new table)
    fireEvent.changeText(input, 'xyz');

    await waitFor(() => {
      expect(queryByText('Medieval Madness')).toBeNull();
      expect(queryByText('Attack from Mars')).toBeNull();
      expect(queryByText('Batman')).toBeNull();
    });
  });
});
