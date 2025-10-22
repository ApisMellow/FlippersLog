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

    it('should remove old table when LAST score is migrated to different table', async () => {
      // This test exposes the race condition bug
      // The bug: filter checks the UPDATED scores array for oldScore.tableName
      // If the score being updated is the only one in the old table,
      // it won't be found because it now has the new table name
      await storage.addScore({ score: 5000, tableName: 'Old Table', date: '2024-10-10' });

      const scores = await storage.getScores();
      const scoreId = scores[0].id;

      // Verify old table exists
      let tables = await storage.getTables();
      expect(tables.find(t => t.name === 'Old Table')).toBeDefined();

      // Migrate the only score to a new table
      await storage.updateScore(scoreId, { tableName: 'New Table' });

      // Old table should be removed since no scores remain
      tables = await storage.getTables();
      expect(tables.find(t => t.name === 'Old Table')).toBeUndefined();
      expect(tables.find(t => t.name === 'New Table')).toBeDefined();

      const updatedScores = await storage.getScores();
      expect(updatedScores[0].tableName).toBe('New Table');
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

  describe('getTablesWithScores', () => {
    it('should return tables with scores using tableName (new model)', async () => {
      // This reproduces the bug: addScore saves with tableName,
      // but getTablesWithScores filters by tableId only
      await storage.addScore({ score: 157308820, tableName: 'Batman', date: '2024-10-21' });
      await storage.addScore({ score: 125000000, tableName: 'Batman', date: '2024-10-20' });
      await storage.addScore({ score: 50000000, tableName: 'Medieval Madness', date: '2024-10-19' });

      const tablesWithScores = await storage.getTablesWithScores();

      // Should return 2 tables
      expect(tablesWithScores).toHaveLength(2);

      // Batman table should exist with 2 scores
      const batmanTable = tablesWithScores.find(t => t.name === 'Batman');
      expect(batmanTable).toBeDefined();
      expect(batmanTable?.topScores).toHaveLength(2);
      expect(batmanTable?.topScores[0].score).toBe(157308820);
      expect(batmanTable?.topScores[1].score).toBe(125000000);

      // Medieval Madness table should exist with 1 score
      const mmTable = tablesWithScores.find(t => t.name === 'Medieval Madness');
      expect(mmTable).toBeDefined();
      expect(mmTable?.topScores).toHaveLength(1);
      expect(mmTable?.topScores[0].score).toBe(50000000);
    });

    it('should return tables with scores using tableId (legacy model)', async () => {
      // Add tables first (legacy model)
      const table1 = await storage.saveTable({ name: 'Attack from Mars' });
      const table2 = await storage.saveTable({ name: 'The Addams Family' });

      // Add scores with tableId (legacy)
      await storage.saveScore({ score: 100000000, tableId: table1.id, date: '2024-10-21' });
      await storage.saveScore({ score: 75000000, tableId: table1.id, date: '2024-10-20' });
      await storage.saveScore({ score: 60000000, tableId: table2.id, date: '2024-10-19' });

      const tablesWithScores = await storage.getTablesWithScores();

      // Should return 2 tables
      expect(tablesWithScores).toHaveLength(2);

      // Attack from Mars should have 2 scores
      const afmTable = tablesWithScores.find(t => t.name === 'Attack from Mars');
      expect(afmTable).toBeDefined();
      expect(afmTable?.topScores).toHaveLength(2);

      // The Addams Family should have 1 score
      const tafTable = tablesWithScores.find(t => t.name === 'The Addams Family');
      expect(tafTable).toBeDefined();
      expect(tafTable?.topScores).toHaveLength(1);
    });

    it('should handle mixed tableId and tableName scores', async () => {
      // Add a table (legacy)
      const table = await storage.saveTable({ name: 'Twilight Zone' });

      // Add legacy score with tableId
      await storage.saveScore({ score: 50000000, tableId: table.id, date: '2024-10-19' });

      // Add new score with tableName
      await storage.addScore({ score: 75000000, tableName: 'Twilight Zone', date: '2024-10-20' });

      const tablesWithScores = await storage.getTablesWithScores();

      // Should return 1 table with both scores
      expect(tablesWithScores).toHaveLength(1);
      const tzTable = tablesWithScores[0];
      expect(tzTable.name).toBe('Twilight Zone');
      expect(tzTable.topScores).toHaveLength(2);
      expect(tzTable.topScores[0].score).toBe(75000000);
      expect(tzTable.topScores[1].score).toBe(50000000);
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
      const firstScoreId = scores[0].id;

      await storage.deleteScore(firstScoreId);

      const remaining = await storage.getScores();
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
