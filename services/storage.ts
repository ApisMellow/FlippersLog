import AsyncStorage from '@react-native-async-storage/async-storage';
import { Score, Table, TableWithScores } from '@/types';

const SCORES_KEY = '@flipperslog:scores';
const TABLES_KEY = '@flipperslog:tables';

// Storage service for managing scores and tables
export const storage = {
  // Get all scores
  async getScores(): Promise<Score[]> {
    try {
      const data = await AsyncStorage.getItem(SCORES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading scores:', error);
      return [];
    }
  },

  // Save a new score (legacy method using tableId)
  async saveScore(score: Omit<Score, 'id'>): Promise<Score> {
    try {
      const scores = await this.getScores();
      // Generate unique ID by combining timestamp with random number to avoid collisions
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newScore: Score = {
        ...score,
        id,
      };
      scores.push(newScore);
      await AsyncStorage.setItem(SCORES_KEY, JSON.stringify(scores));
      return newScore;
    } catch (error) {
      console.error('Error saving score:', error);
      throw error;
    }
  },

  // Add a new score with tableName (preferred method)
  async addScore(scoreData: { score: number; tableName: string; date: string; photoUri?: string }): Promise<void> {
    try {
      const scores = await this.getScores();
      // Generate unique ID by combining timestamp with random number to avoid collisions
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newScore: Score = {
        id,
        score: scoreData.score,
        tableName: scoreData.tableName,
        date: scoreData.date,
        photoUri: scoreData.photoUri,
      };
      scores.push(newScore);
      await AsyncStorage.setItem(SCORES_KEY, JSON.stringify(scores));

      // Ensure table exists
      await this.addTable(scoreData.tableName);
    } catch (error) {
      console.error('Error adding score:', error);
      throw error;
    }
  },

  // Add a table by name (creates if doesn't exist)
  async addTable(tableName: string): Promise<void> {
    try {
      const tables = await this.getTables();
      const existingTable = tables.find(t => t.name === tableName);

      if (!existingTable) {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newTable: Table = {
          id,
          name: tableName,
        };
        tables.push(newTable);
        await AsyncStorage.setItem(TABLES_KEY, JSON.stringify(tables));
      }
    } catch (error) {
      console.error('Error adding table:', error);
      throw error;
    }
  },

  // Get all tables
  async getTables(): Promise<Table[]> {
    try {
      const data = await AsyncStorage.getItem(TABLES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading tables:', error);
      return [];
    }
  },

  // Save or update a table
  async saveTable(table: Omit<Table, 'id'> | Table): Promise<Table> {
    try {
      const tables = await this.getTables();
      const existingTable = 'id' in table
        ? tables.find(t => t.id === table.id)
        : tables.find(t => t.name.toLowerCase() === table.name.toLowerCase());

      if (existingTable) {
        return existingTable;
      }

      // Generate unique ID by combining timestamp with random number to avoid collisions
      const id = 'id' in table ? table.id : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newTable: Table = {
        ...table,
        id,
      };
      tables.push(newTable);
      await AsyncStorage.setItem(TABLES_KEY, JSON.stringify(tables));
      return newTable;
    } catch (error) {
      console.error('Error saving table:', error);
      throw error;
    }
  },

  // Get tables with their top 3 scores
  async getTablesWithScores(): Promise<TableWithScores[]> {
    try {
      const [tables, scores] = await Promise.all([
        this.getTables(),
        this.getScores(),
      ]);

      return tables
        .map(table => {
          const tableScores = scores
            .filter(s => s.tableId === table.id)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3); // Top 3 scores

          return {
            ...table,
            topScores: tableScores,
          };
        })
        .filter(table => table.topScores.length > 0) // Only show tables with scores
        .sort((a, b) => {
          // Sort by highest score
          const aMax = a.topScores[0]?.score || 0;
          const bMax = b.topScores[0]?.score || 0;
          return bMax - aMax;
        });
    } catch (error) {
      console.error('Error loading tables with scores:', error);
      return [];
    }
  },

  // Get sample pinball tables
  async getSampleTables(): Promise<Table[]> {
    return [
      {
        id: 'sample-1',
        name: 'Medieval Madness',
        manufacturer: 'Williams',
        year: 1997,
      },
      {
        id: 'sample-2',
        name: 'Attack from Mars',
        manufacturer: 'Bally',
        year: 1995,
      },
      {
        id: 'sample-3',
        name: 'The Addams Family',
        manufacturer: 'Bally',
        year: 1992,
      },
    ];
  },

  // Delete a score by id (supports both tableId and tableName)
  async deleteScore(scoreId: string): Promise<void> {
    try {
      // Get current scores
      const scoresJson = await AsyncStorage.getItem(SCORES_KEY);
      if (!scoresJson) return;

      const scores: Score[] = JSON.parse(scoresJson);

      // Find the score to delete
      const scoreToDelete = scores.find(s => s.id === scoreId);
      if (!scoreToDelete) return;

      // Remove the score
      const updatedScores = scores.filter(s => s.id !== scoreId);
      await AsyncStorage.setItem(SCORES_KEY, JSON.stringify(updatedScores));

      // Check if this was the last score for the table
      // Handle both tableName (new) and tableId (legacy)
      let remainingScoresForTable: Score[];
      if (scoreToDelete.tableName) {
        remainingScoresForTable = updatedScores.filter(
          s => s.tableName === scoreToDelete.tableName
        );
      } else {
        remainingScoresForTable = updatedScores.filter(
          s => s.tableId === scoreToDelete.tableId
        );
      }

      // If no scores remain for this table, remove the table
      if (remainingScoresForTable.length === 0) {
        const tablesJson = await AsyncStorage.getItem(TABLES_KEY);
        if (tablesJson) {
          const tables: Table[] = JSON.parse(tablesJson);
          let updatedTables: Table[];

          if (scoreToDelete.tableName) {
            updatedTables = tables.filter(t => t.name !== scoreToDelete.tableName);
          } else {
            updatedTables = tables.filter(t => t.id !== scoreToDelete.tableId);
          }

          await AsyncStorage.setItem(TABLES_KEY, JSON.stringify(updatedTables));
        }
      }
    } catch (error) {
      console.error('Error deleting score:', error);
      throw error;
    }
  },

  // Update a score by id
  async updateScore(scoreId: string, updates: Partial<Omit<Score, 'id'>>): Promise<void> {
    try {
      const scoresJson = await AsyncStorage.getItem(SCORES_KEY);
      if (!scoresJson) return;

      const scores: Score[] = JSON.parse(scoresJson);
      const scoreIndex = scores.findIndex(s => s.id === scoreId);
      if (scoreIndex === -1) return;

      const oldScore = scores[scoreIndex];
      const updatedScore = { ...oldScore, ...updates };
      scores[scoreIndex] = updatedScore;

      await AsyncStorage.setItem(SCORES_KEY, JSON.stringify(scores));

      // If table name changed, handle table migration
      if (updates.tableName && updates.tableName !== oldScore.tableName) {
        // Check if old table should be removed
        const remainingOldTableScores = scores.filter(
          s => s.tableName === oldScore.tableName
        );

        if (remainingOldTableScores.length === 0) {
          // Remove old table
          const tablesJson = await AsyncStorage.getItem(TABLES_KEY);
          if (tablesJson) {
            const tables: Table[] = JSON.parse(tablesJson);
            const updatedTables = tables.filter(t => t.name !== oldScore.tableName);
            await AsyncStorage.setItem(TABLES_KEY, JSON.stringify(updatedTables));
          }
        }

        // Ensure new table exists
        await this.addTable(updates.tableName);
      }
    } catch (error) {
      console.error('Error updating score:', error);
      throw error;
    }
  },

  // Get a score by id
  async getScoreById(scoreId: string): Promise<Score | null> {
    try {
      const scoresJson = await AsyncStorage.getItem(SCORES_KEY);
      if (!scoresJson) return null;

      const scores: Score[] = JSON.parse(scoresJson);
      return scores.find(s => s.id === scoreId) || null;
    } catch (error) {
      console.error('Error getting score by id:', error);
      return null;
    }
  },

  // Clear all data (for testing)
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([SCORES_KEY, TABLES_KEY]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  },
};
