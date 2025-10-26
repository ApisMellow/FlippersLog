import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../../services/storage';

describe('Storage - Venue Tagged Scores', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('adds venueId when score saved with active venue', async () => {
    await storage.addScore({
      tableName: 'Medieval Madness',
      score: 50000,
      date: new Date().toISOString(),
      venueId: 123,
    });

    const scores = await storage.getScores();
    expect(scores[0].venueId).toBe(123);
  });

  it('saves score without venueId when not provided', async () => {
    await storage.addScore({
      tableName: 'Medieval Madness',
      score: 50000,
      date: new Date().toISOString(),
    });

    const scores = await storage.getScores();
    expect(scores[0].venueId).toBeUndefined();
  });
});
