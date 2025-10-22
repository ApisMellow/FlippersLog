import { storage } from '@/services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Storage Service', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('Sample Tables', () => {
    it('should provide 3 sample pinball tables', async () => {
      const sampleTables = await storage.getSampleTables();

      expect(sampleTables).toHaveLength(3);
      expect(sampleTables[0]).toHaveProperty('id');
      expect(sampleTables[0]).toHaveProperty('name');
      expect(sampleTables[0].name).toBeTruthy();
    });

    it('should include table details for each sample', async () => {
      const sampleTables = await storage.getSampleTables();

      sampleTables.forEach(table => {
        expect(table.name).toBeTruthy();
        expect(table.manufacturer).toBeTruthy();
      });
    });
  });

  describe('deleteScore', () => {
    it('should delete a score by id', async () => {
      // Add some scores first
      await storage.addScore({ score: 1000, tableName: 'Test Table', date: '2024-10-10' });
      await storage.addScore({ score: 2000, tableName: 'Test Table', date: '2024-10-11' });

      const scores = await storage.getScores();
      const firstScoreId = scores[0].id;

      await storage.deleteScore(firstScoreId);

      const remaining = await storage.getScores();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].score).toBe(2000);
    });

    it('should remove table when last score is deleted', async () => {
      await storage.addScore({ score: 1000, tableName: 'Solo Table', date: '2024-10-10' });

      const scores = await storage.getScores();
      const scoreId = scores[0].id;

      await storage.deleteScore(scoreId);

      const tables = await storage.getTables();
      expect(tables.find(t => t.name === 'Solo Table')).toBeUndefined();
    });

    it('should keep table when other scores remain', async () => {
      await storage.addScore({ score: 1000, tableName: 'Multi Table', date: '2024-10-10' });
      await storage.addScore({ score: 2000, tableName: 'Multi Table', date: '2024-10-11' });

      const scores = await storage.getScores();
      const firstScoreId = scores[0].id;

      await storage.deleteScore(firstScoreId);

      const tables = await storage.getTables();
      expect(tables.find(t => t.name === 'Multi Table')).toBeDefined();
    });
  });

  describe('updateScore', () => {
    it('should update score value', async () => {
      await storage.addScore({ score: 1000, tableName: 'Test Table', date: '2024-10-10' });

      const scores = await storage.getScores();
      const scoreId = scores[0].id;

      await storage.updateScore(scoreId, { score: 9999 });

      const updated = await storage.getScores();
      expect(updated[0].score).toBe(9999);
    });

    it('should update table name and migrate score', async () => {
      await storage.addScore({ score: 1000, tableName: 'Old Table', date: '2024-10-10' });

      const scores = await storage.getScores();
      const scoreId = scores[0].id;

      await storage.updateScore(scoreId, { tableName: 'New Table' });

      const updated = await storage.getScores();
      expect(updated[0].tableName).toBe('New Table');

      const tables = await storage.getTables();
      expect(tables.find(t => t.name === 'New Table')).toBeDefined();
      expect(tables.find(t => t.name === 'Old Table')).toBeUndefined();
    });

    it('should keep old table if other scores remain', async () => {
      await storage.addScore({ score: 1000, tableName: 'Shared Table', date: '2024-10-10' });
      await storage.addScore({ score: 2000, tableName: 'Shared Table', date: '2024-10-11' });

      const scores = await storage.getScores();
      const firstScoreId = scores[0].id;

      await storage.updateScore(firstScoreId, { tableName: 'Different Table' });

      const tables = await storage.getTables();
      expect(tables.find(t => t.name === 'Shared Table')).toBeDefined();
      expect(tables.find(t => t.name === 'Different Table')).toBeDefined();
    });
  });

  describe('getScoreById', () => {
    it('should retrieve score by id', async () => {
      await storage.addScore({ score: 1000, tableName: 'Test Table', date: '2024-10-10' });

      const scores = await storage.getScores();
      const scoreId = scores[0].id;

      const score = await storage.getScoreById(scoreId);

      expect(score).toBeDefined();
      expect(score?.score).toBe(1000);
      expect(score?.tableName).toBe('Test Table');
    });

    it('should return null for non-existent id', async () => {
      const score = await storage.getScoreById('non-existent-id');
      expect(score).toBeNull();
    });
  });

  // Legacy tests for backward compatibility with tableId model
  describe('deleteScore (legacy tableId)', () => {
    it('should delete a score by id', async () => {
      // Add a table first
      const table = await storage.saveTable({ name: 'Test Table' });

      // Add some scores
      await storage.saveScore({ score: 1000, tableId: table.id, date: '2024-10-10' });
      await storage.saveScore({ score: 2000, tableId: table.id, date: '2024-10-11' });

      const scores = await storage.getScores();
      console.log('Scores before delete:', scores);
      const firstScoreId = scores[0].id;
      console.log('Deleting score with ID:', firstScoreId);

      await storage.deleteScore(firstScoreId);

      const remaining = await storage.getScores();
      console.log('Remaining scores:', remaining);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].score).toBe(2000);
    });

    it('should remove table when last score is deleted', async () => {
      // Add a table
      const table = await storage.saveTable({ name: 'Solo Table' });

      // Add one score to it
      await storage.saveScore({ score: 1000, tableId: table.id, date: '2024-10-10' });

      const scores = await storage.getScores();
      const scoreId = scores[0].id;

      await storage.deleteScore(scoreId);

      const tables = await storage.getTables();
      expect(tables.find(t => t.name === 'Solo Table')).toBeUndefined();
    });

    it('should keep table when other scores remain', async () => {
      // Add a table
      const table = await storage.saveTable({ name: 'Multi Table' });

      // Add multiple scores
      await storage.saveScore({ score: 1000, tableId: table.id, date: '2024-10-10' });
      await storage.saveScore({ score: 2000, tableId: table.id, date: '2024-10-11' });

      const scores = await storage.getScores();
      const firstScoreId = scores[0].id;

      await storage.deleteScore(firstScoreId);

      const tables = await storage.getTables();
      expect(tables.find(t => t.name === 'Multi Table')).toBeDefined();
    });
  });
});
