import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import ManualEntryScreen from '@/app/manual-entry';
import { storage } from '@/services/storage';
import { useRouter } from 'expo-router';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useFocusEffect: jest.fn((callback) => {
    // Call the callback immediately to simulate screen focus
    callback();
  }),
  useLocalSearchParams: jest.fn(() => ({})),
}));

// Mock the storage
jest.mock('@/services/storage');
const mockStorage = storage as jest.Mocked<typeof storage>;

describe('Manual Entry Screen - User Tables Quick Select', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      back: jest.fn(),
    });
  });

  it('should display user tables from getTables when user has saved tables', async () => {
    const mockUserTables = [
      {
        id: 'user-1',
        name: 'Test Table 1',
        manufacturer: 'Williams',
      },
      {
        id: 'user-2',
        name: 'Test Table 2',
        manufacturer: 'Bally',
      },
    ];

    mockStorage.getTables.mockResolvedValue(mockUserTables);

    const { findByText } = render(<ManualEntryScreen />);

    // User tables should be displayed in quick select
    await waitFor(async () => {
      expect(await findByText('Test Table 1')).toBeTruthy();
      expect(await findByText('Test Table 2')).toBeTruthy();
    });
  });

  it('should show sample tables as fallback when user has no saved tables', async () => {
    // User has no saved tables
    mockStorage.getTables.mockResolvedValue([]);
    // But sample tables exist for new users
    mockStorage.getSampleTables.mockResolvedValue([
      {
        id: 'sample-1',
        name: 'Medieval Madness',
        manufacturer: 'Williams',
      },
    ]);

    const { findByText } = render(<ManualEntryScreen />);

    // Sample tables should show as fallback
    await waitFor(async () => {
      expect(await findByText('Medieval Madness')).toBeTruthy();
    });
  });

  it('should call getTables on mount via useFocusEffect', async () => {
    const mockUserTables = [
      {
        id: 'user-1',
        name: 'Table One',
        manufacturer: 'Williams',
      },
    ];

    mockStorage.getTables.mockResolvedValue(mockUserTables);
    mockStorage.getSampleTables.mockResolvedValue([]);

    render(<ManualEntryScreen />);

    // Verify getTables was called (via useFocusEffect callback)
    // The mock immediately calls the callback, so getTables runs once
    expect(mockStorage.getTables).toHaveBeenCalled();
  });
});
