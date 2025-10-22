import { aiVision } from '@/services/ai-vision';

// Mock the Anthropic SDK to return various response formats
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn(),
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

describe('AI Vision - JSON Parsing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  it('should extract JSON from response with markdown code blocks', async () => {
    const Anthropic = require('@anthropic-ai/sdk').default;
    Anthropic.mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: '```json\n{"score": 42000000, "tableName": "Test Table"}\n```'
          }]
        })
      }
    }));

    const result = await aiVision.analyzePhoto('test://photo.jpg');

    expect(result.score).toBe(42000000);
    expect(result.tableName).toBe('Test Table');
    expect(result.isMockData).toBe(false);
  });

  it('should extract JSON from response with backticks only', async () => {
    const Anthropic = require('@anthropic-ai/sdk').default;
    Anthropic.mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: '`{"score": 55555555, "tableName": "Another Table"}`'
          }]
        })
      }
    }));

    const result = await aiVision.analyzePhoto('test://photo.jpg');

    expect(result.score).toBe(55555555);
    expect(result.tableName).toBe('Another Table');
  });

  it('should handle pure JSON response', async () => {
    const Anthropic = require('@anthropic-ai/sdk').default;
    Anthropic.mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: '{"score": 99999999, "tableName": "Pure JSON"}'
          }]
        })
      }
    }));

    const result = await aiVision.analyzePhoto('test://photo.jpg');

    expect(result.score).toBe(99999999);
    expect(result.tableName).toBe('Pure JSON');
  });

  it('should return error when no valid JSON found', async () => {
    const Anthropic = require('@anthropic-ai/sdk').default;
    Anthropic.mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: 'Sorry, I could not read the score from this image.'
          }]
        })
      }
    }));

    const result = await aiVision.analyzePhoto('test://photo.jpg');

    expect(result.isMockData).toBe(true);
    expect(result.error).toBeTruthy();
  });
});
