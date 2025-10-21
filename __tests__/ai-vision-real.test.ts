import { aiVision } from '@/services/ai-vision';

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: '{"score": 42000000, "tableName": "Test Table"}'
          }]
        })
      }
    }))
  };
});

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('base64data'),
  EncodingType: { Base64: 'base64' }
}));

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({ uri: 'converted.jpg' }),
  SaveFormat: { JPEG: 'jpeg' }
}));

describe('AI Vision - Real API', () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  it('should call Claude API and extract score', async () => {
    const result = await aiVision.analyzePhoto('test://photo.jpg');

    expect(result.score).toBe(42000000);
    expect(result.tableName).toBe('Test Table');
    expect(result.isMockData).toBe(false);
  });

  it('should return mock data when no API key', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const result = await aiVision.analyzePhoto('test://photo.jpg');

    expect(result.isMockData).toBe(true);
  });

  it('should handle API errors gracefully', async () => {
    const Anthropic = require('@anthropic-ai/sdk').default;
    Anthropic.mockImplementation(() => ({
      messages: {
        create: jest.fn().mockRejectedValue(new Error('API Error'))
      }
    }));

    const result = await aiVision.analyzePhoto('test://photo.jpg');

    expect(result.error).toBeTruthy();
    expect(result.isMockData).toBe(true);
  });
});
