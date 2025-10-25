import { storage } from '@/services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('Table Last Used Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup AsyncStorage mocks with real Map for testing
    const mockStore: { [key: string]: string } = {};
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      return Promise.resolve(mockStore[key] || null);
    });
    (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
      mockStore[key] = value;
      return Promise.resolve();
    });
    (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);
  });

  it('should track lastUsedDate when score is saved', async () => {
    // Save a table
    await storage.saveTable({ name: 'Test Table' });

    // Save a score with that table (this should update lastUsedDate)
    const beforeSave = Date.now();
    await storage.addScore({
      score: 1000000,
      tableName: 'Test Table',
      date: new Date().toISOString(),
    });
    const afterSave = Date.now();

    // Get tables - the table should have lastUsedDate set to approximately now
    const tables = await storage.getTables();
    const testTable = tables.find(t => t.name === 'Test Table');

    expect(testTable?.lastUsedDate).toBeTruthy();
    const lastUsedTime = new Date(testTable!.lastUsedDate!).getTime();
    expect(lastUsedTime).toBeGreaterThanOrEqual(beforeSave);
    expect(lastUsedTime).toBeLessThanOrEqual(afterSave);
  });

  it('should update lastUsedDate when score is updated', async () => {
    // Save a table with old lastUsedDate
    await storage.saveTable({ name: 'Test Table', lastUsedDate: new Date('2025-01-01').toISOString() });

    // Get the table ID
    let tables = await storage.getTables();
    const testTable = tables.find(t => t.name === 'Test Table');
    expect(testTable).toBeTruthy();

    // Save a score with the table
    const score = await storage.addScore({
      score: 1000000,
      tableName: 'Test Table',
      date: new Date().toISOString(),
    });

    // Now update the score - lastUsedDate should be updated
    const beforeUpdate = Date.now();
    await storage.updateScore(score!.id, {
      score: 2000000,
      tableName: 'Test Table',
    });
    const afterUpdate = Date.now();

    tables = await storage.getTables();
    const updatedTable = tables.find(t => t.name === 'Test Table');

    expect(updatedTable?.lastUsedDate).toBeTruthy();
    const lastUsedTime = new Date(updatedTable!.lastUsedDate!).getTime();
    expect(lastUsedTime).toBeGreaterThanOrEqual(beforeUpdate);
    expect(lastUsedTime).toBeLessThanOrEqual(afterUpdate);
  });
});
