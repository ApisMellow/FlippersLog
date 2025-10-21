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

  // Save a new score
  async saveScore(score: Omit<Score, 'id'>): Promise<Score> {
    try {
      const scores = await this.getScores();
      const newScore: Score = {
        ...score,
        id: Date.now().toString(),
      };
      scores.push(newScore);
      await AsyncStorage.setItem(SCORES_KEY, JSON.stringify(scores));
      return newScore;
    } catch (error) {
      console.error('Error saving score:', error);
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

      const newTable: Table = {
        ...table,
        id: 'id' in table ? table.id : Date.now().toString(),
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
