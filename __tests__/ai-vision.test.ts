import { aiVision, extractJsonFromResponse } from '@/services/ai-vision';

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

  describe('JSON Extraction from Claude Response', () => {
    describe('positive cases', () => {
      it('should extract pure JSON response', () => {
        const response = '{"score": 3542040, "tableName": "Medieval Madness"}';
        const result = extractJsonFromResponse(response);
        expect(result).toEqual({ score: 3542040, tableName: 'Medieval Madness' });
      });

      it('should extract JSON from response with markdown code blocks', () => {
        const response = '```json\n{"score": 121962080, "tableName": "Guardians of the Galaxy"}\n```';
        const result = extractJsonFromResponse(response);
        expect(result).toEqual({ score: 121962080, tableName: 'Guardians of the Galaxy' });
      });

      it('should extract JSON from response with explanatory text before JSON', () => {
        const response = `I need to carefully read the score displayed on the digital scoreboard.

Looking at the LED display, I can see: **3,542,040**

\`\`\`json
{"score": 3542040, "tableName": null}
\`\`\``;
        const result = extractJsonFromResponse(response);
        expect(result).toEqual({ score: 3542040, tableName: null });
      });

      it('should extract JSON with null tableName', () => {
        const response = '{"score": 5000000, "tableName": null}';
        const result = extractJsonFromResponse(response);
        expect(result).toEqual({ score: 5000000, tableName: null });
      });

      it('should extract JSON with backticks around JSON object', () => {
        const response = '`{"score": 2500000, "tableName": "Medieval Madness"}`';
        const result = extractJsonFromResponse(response);
        expect(result).toEqual({ score: 2500000, tableName: 'Medieval Madness' });
      });
    });

    describe('negative cases', () => {
      it('should throw error when no JSON object found in response', () => {
        const response = 'This response has no JSON object at all, just plain text';
        expect(() => extractJsonFromResponse(response)).toThrow();
      });

      it('should throw error when JSON is malformed', () => {
        const response = '{"score": 3542040, "tableName": "Incomplete';
        expect(() => extractJsonFromResponse(response)).toThrow();
      });

      it('should throw error when response is empty', () => {
        const response = '';
        expect(() => extractJsonFromResponse(response)).toThrow();
      });

      it('should throw error when only closing brace exists', () => {
        const response = '}';
        expect(() => extractJsonFromResponse(response)).toThrow();
      });

      it('should throw error when JSON has score as string instead of number', () => {
        const response = '{"score": "3542040", "tableName": "Medieval Madness"}';
        expect(() => extractJsonFromResponse(response)).toThrow();
      });
    });
  });
});
