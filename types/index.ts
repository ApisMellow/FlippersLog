export interface Score {
  id: string;
  tableId?: string; // Legacy - being phased out
  tableName?: string; // New field - preferred
  score: number;
  date: string; // ISO date string
  photoUri?: string;
}

export interface Table {
  id: string;
  name: string;
  year?: number;
}

export interface TableWithScores extends Table {
  topScores: Score[]; // Top 3 scores for this table
}
