import React from 'react';
import { render, screen } from '@testing-library/react-native';
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
}));

// Mock the storage
jest.mock('@/services/storage');
const mockStorage = storage as jest.Mocked<typeof storage>;

describe('Manual Entry Screen - Flipper Icon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      back: jest.fn(),
    });
    mockStorage.getTables.mockResolvedValue([]);
    mockStorage.getSampleTables.mockResolvedValue([]);
  });

  it('should render the flipper icon image in the icon container', async () => {
    const { findByTestId } = render(<ManualEntryScreen />);

    // Test that the icon container with the flipper image is rendered
    // This tests the actual rendered element, not mocks
    const flipperIcon = await findByTestId('flipper-icon');
    expect(flipperIcon).toBeTruthy();
  });
});
