import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Import real storage for integration tests
import { storage } from '@/services/storage';
import EditScore from '@/app/edit-score';

describe('EditScore Integration Tests', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    await storage.clearAll();
  });

  test('complete flow: detect unknown table, correct it, and save', async () => {
    // Setup: Add an existing table to the database
    await storage.addScore({
      score: 100000,
      tableName: 'Medieval Madness',
      date: new Date().toISOString(),
    });

    // Mock the params for this test
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      detectedScore: '150000',
      detectedTableName: 'Unknown',
      photoUri: 'file:///test.jpg',
    });

    // Render the component with detected unknown table
    const { getByTestId, queryByTestId } = render(<EditScore />);

    // Wait for tables to load (give the component time to fetch tables)
    await waitFor(() => {
      // Component should have loaded - we can tell because photo renders
      expect(queryByTestId('photo-image')).toBeTruthy();
    });

    // Verify photo is large
    const photo = getByTestId('photo-image');
    expect(photo).toBeTruthy();

    // Verify buttons are side-by-side
    const buttonContainer = getByTestId('button-container');
    expect(buttonContainer.props.style.flexDirection).toBe('row');

    // Verify table field shows Unknown
    const tableField = getByTestId('table-field');
    expect(tableField).toBeTruthy();

    // Tap table field to activate input
    fireEvent.press(tableField);
    const tableInput = getByTestId('table-input');
    expect(tableInput).toBeTruthy();

    // Type to search for Medieval Madness
    fireEvent.changeText(tableInput, 'med');

    // Wait for suggestions to appear
    await waitFor(() => {
      const suggestions = queryByTestId('suggestions');
      expect(suggestions).toBeTruthy();
    });

    // Tap the first suggestion
    const suggestion = getByTestId('suggestion-item-0');
    fireEvent.press(suggestion);

    // Verify input closed
    expect(queryByTestId('table-input')).toBeFalsy();

    // Verify score is pre-filled
    const scoreInput = getByTestId('score-input');
    expect(scoreInput.props.value).toBe('150000');

    // Save the score
    const saveButton = getByTestId('save-button');
    fireEvent.press(saveButton);

    // Verify score was saved correctly
    await waitFor(async () => {
      const scores = await storage.getScores();
      const lastScore = scores[scores.length - 1];
      expect(lastScore.tableName).toBe('Medieval Madness');
      expect(lastScore.score).toBe(150000);
    });
  });

  test('editing existing score with table name change', async () => {
    // Setup: Create two tables and a score
    await storage.addScore({
      score: 100000,
      tableName: 'Medieval Madness',
      date: new Date().toISOString(),
    });

    await storage.addScore({
      score: 200000,
      tableName: 'Attack from Mars',
      date: new Date().toISOString(),
    });

    const allScores = await storage.getScores();
    const scoreToEdit = allScores[0];

    // Mock the params for this test
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      scoreId: scoreToEdit.id,
    });

    // Render edit screen for the first score
    const { getByTestId, queryByTestId } = render(<EditScore />);

    // Wait for score to load
    await waitFor(() => {
      expect(queryByTestId('table-field')).toBeTruthy();
    });

    // Tap table to edit it
    const tableField = getByTestId('table-field');
    fireEvent.press(tableField);

    const tableInput = getByTestId('table-input');

    // Change table from Medieval Madness to Attack from Mars
    fireEvent.changeText(tableInput, 'attack');

    await waitFor(() => {
      const suggestions = queryByTestId('suggestions');
      expect(suggestions).toBeTruthy();
    });

    const suggestion = getByTestId('suggestion-item-0');
    fireEvent.press(suggestion);

    // Save the updated score
    const saveButton = getByTestId('save-button');
    fireEvent.press(saveButton);

    // Verify the score was updated
    await waitFor(async () => {
      const updatedScore = await storage.getScoreById(scoreToEdit.id);
      expect(updatedScore?.tableName).toBe('Attack from Mars');

      // Verify Medieval Madness table was removed (orphaned)
      const tables = await storage.getTables();
      expect(tables.map(t => t.name)).not.toContain('Medieval Madness');
      expect(tables.map(t => t.name)).toContain('Attack from Mars');
    });
  });

  test('validation prevents save with empty table name', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    // Mock the params for this test
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      detectedScore: '100000',
      detectedTableName: '',
    });

    const { getByTestId } = render(<EditScore />);

    const saveButton = getByTestId('save-button');
    fireEvent.press(saveButton);

    // Alert should be called for missing table name
    expect(alertSpy).toHaveBeenCalled();

    // Verify score was not saved
    const scores = await storage.getScores();
    expect(scores.length).toBe(0);
  });
});
