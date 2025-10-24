import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import HomeScreen from '@/app/index';

jest.mock('@/services/storage', () => ({
  storage: {
    getTablesWithScores: jest.fn(() => Promise.resolve([
      {
        id: '1',
        name: 'Medieval Madness',
        topScores: [
          { id: '1', tableName: 'Medieval Madness', score: 150000, date: '2025-01-01', photoUri: 'file://test.jpg' },
        ],
      },
    ])),
  },
}));

describe('HomeScreen Dark Mode', () => {
  test('container has dark navy background color', async () => {
    const { getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      const container = getByTestId('home-container');
      expect(container.props.style.backgroundColor).toBe('#2E3E52');
    });
  });

  test('score card has dark secondary background', async () => {
    const { getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      const card = getByTestId('score-card-0');
      expect(card.props.style.backgroundColor).toBe('#3B4F6B');
    });
  });

  test('primary text is light off-white color', async () => {
    const { getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      const text = getByTestId('table-name-0');
      expect(text.props.style.color).toBe('#E8EEF5');
    });
  });

  test('Edit button uses pencil icon not text', async () => {
    const { queryByText, getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(queryByText('Edit')).toBeFalsy();
      expect(getByTestId('edit-icon-0')).toBeTruthy();
    });
  });

  test('delete button not shown on home screen', async () => {
    const { queryByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(queryByTestId('delete-button-0')).toBeFalsy();
    });
  });

  test('camera icon not shown for photoUri', async () => {
    const { queryByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(queryByTestId('camera-icon-0')).toBeFalsy();
    });
  });
});
