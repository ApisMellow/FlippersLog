import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import ManualEntryScreen from '@/app/manual-entry';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useFocusEffect: jest.fn((callback) => {
    // Call the callback immediately for testing
    const useCallbackFn = callback();
    if (useCallbackFn) {
      useCallbackFn();
    }
  }),
}));

jest.mock('@/services/storage', () => ({
  storage: {
    getTables: jest.fn(() => Promise.resolve([])),
    getSampleTables: jest.fn(() => Promise.resolve([
      {
        id: 'sample-1',
        name: 'Medieval Madness',
        year: 1997,
      },
    ])),
    addScore: jest.fn(() => Promise.resolve({
      id: '1',
      score: 150000,
      tableName: 'Medieval Madness',
      date: '2025-01-01',
    })),
  },
}));

describe('Manual Entry Return Key Submission', () => {
  test('pressing return key on number pad submits the score', async () => {
    const { getByTestId, getByPlaceholderText } = render(<ManualEntryScreen />);

    // Fill in table name
    const tableInput = getByPlaceholderText('e.g., Medieval Madness');
    fireEvent.changeText(tableInput, 'Medieval Madness');

    // Fill in score
    const scoreInput = getByPlaceholderText('0');
    fireEvent.changeText(scoreInput, '150000');

    // Simulate pressing return key on number pad
    await waitFor(() => {
      fireEvent(scoreInput, 'submitEditing');
    });

    // Alert should show (indicating score was submitted)
    await waitFor(() => {
      expect(require('@/services/storage').storage.addScore).toHaveBeenCalledWith({
        score: 150000,
        tableName: 'Medieval Madness',
        date: expect.any(String),
      });
    });
  });
});
