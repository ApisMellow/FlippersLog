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
});
