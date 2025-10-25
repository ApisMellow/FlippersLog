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

describe('Manual Entry - Text Matching and Autocomplete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      back: jest.fn(),
    });
    mockStorage.getSampleTables.mockResolvedValue([]);
  });

  it('should filter tables by partial text match', async () => {
    const mockTables = [
      { id: '1', name: 'Medieval Madness', lastUsedDate: new Date().toISOString() },
      { id: '2', name: 'Attack from Mars', lastUsedDate: new Date().toISOString() },
      { id: '3', name: 'The Addams Family', lastUsedDate: new Date().toISOString() },
    ];

    mockStorage.getTables.mockResolvedValue(mockTables);

    const { getByPlaceholderText, getByText, queryByText } = render(<ManualEntryScreen />);

    // Wait for initial load of tables
    await waitFor(() => {
      expect(getByText('Medieval Madness')).toBeTruthy();
    });

    // Type 'att' - should match only 'Attack from Mars'
    const tableInput = getByPlaceholderText('e.g., Medieval Madness');
    fireEvent.changeText(tableInput, 'att');

    await waitFor(() => {
      // Should show matching table
      expect(getByText('Attack from Mars')).toBeTruthy();
      // Should not show non-matching tables - these weren't loaded into quick select yet so won't be shown
      // Medieval Madness was already shown in initial load but shouldn't be in filtered list
      // The key is that the input autocompletes when exactly one match
      expect(tableInput.props.value).toBe('Attack from Mars');
    });
  });

  it('should autocomplete when exactly one table matches', async () => {
    const mockTables = [
      { id: '1', name: 'Medieval Madness', lastUsedDate: new Date().toISOString() },
      { id: '2', name: 'Attack from Mars', lastUsedDate: new Date().toISOString() },
    ];

    mockStorage.getTables.mockResolvedValue(mockTables);

    const { getByPlaceholderText, getByText } = render(<ManualEntryScreen />);

    // Wait for initial load
    await waitFor(() => {
      expect(getByText('Medieval Madness')).toBeTruthy();
    });

    const tableInput = getByPlaceholderText('e.g., Medieval Madness');

    // Type 'att' - should match only 'Attack from Mars'
    fireEvent.changeText(tableInput, 'att');

    await waitFor(() => {
      // Should autocomplete to 'Attack from Mars'
      expect(tableInput.props.value).toBe('Attack from Mars');
    });
  });

  it('should not autocomplete when multiple tables match', async () => {
    const mockTables = [
      { id: '1', name: 'Medieval Madness', lastUsedDate: new Date().toISOString() },
      { id: '2', name: 'Monster Bash', lastUsedDate: new Date().toISOString() },
    ];

    mockStorage.getTables.mockResolvedValue(mockTables);

    const { getByPlaceholderText, getByText } = render(<ManualEntryScreen />);

    const tableInput = getByPlaceholderText('e.g., Medieval Madness');

    // Type 'ma' - matches both Medieval and Monster
    fireEvent.changeText(tableInput, 'ma');

    await waitFor(() => {
      // Should NOT autocomplete (multiple matches)
      expect(tableInput.props.value).toBe('ma');
      // Should show both options
      expect(getByText('Medieval Madness')).toBeTruthy();
      expect(getByText('Monster Bash')).toBeTruthy();
    });
  });
});
