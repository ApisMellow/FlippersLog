import { aiVision } from '@/services/ai-vision';

describe('AI Vision Service', () => {
  describe('Mock Data Detection', () => {
    it('should indicate when returning mock data', async () => {
      const result = await aiVision.analyzePhoto('test-photo-uri');

      expect(result).toHaveProperty('isMockData');
      expect(result.isMockData).toBe(true);
    });

    it('should set confidence to 0 for mock data', async () => {
      const result = await aiVision.analyzePhoto('test-photo-uri');

      expect(result.confidence).toBe(0);
    });
  });
});
