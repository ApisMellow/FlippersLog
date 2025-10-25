import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
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

describe('Manual Entry - No Manufacturer Field', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      back: jest.fn(),
    });
    mockStorage.getTables.mockResolvedValue([]);
    mockStorage.getSampleTables.mockResolvedValue([]);
    mockStorage.saveTable.mockResolvedValue({
      id: 'table-1',
      name: 'Test Table',
    });
    mockStorage.saveScore.mockResolvedValue(undefined);
  });

  it('should not have manufacturer input field', () => {
    render(<ManualEntryScreen />);

    // Manufacturer field should not exist
    const manufacturerLabels = screen.queryAllByText(/manufacturer/i);
    expect(manufacturerLabels.length).toBe(0);
  });

  it('should save score without manufacturer field', async () => {
    render(<ManualEntryScreen />);

    const tableInput = screen.getByPlaceholderText('e.g., Medieval Madness');
    fireEvent.changeText(tableInput, 'Medieval Madness');

    const scoreInput = screen.getByPlaceholderText('0');
    fireEvent.changeText(scoreInput, '1000000');

    const saveButton = screen.getByText('Save Score');
    fireEvent.press(saveButton);

    await waitFor(() => {
      // saveTable should be called with only name, no manufacturer
      expect(mockStorage.saveTable).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Medieval Madness',
        })
      );
      // Verify manufacturer is NOT in the call
      expect(mockStorage.saveTable).not.toHaveBeenCalledWith(
        expect.objectContaining({
          manufacturer: expect.anything(),
        })
      );
    });
  });
});
