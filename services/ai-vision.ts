// AI Vision service for extracting table name and score from photos
// This will use Claude API or OpenAI Vision API
import Anthropic from '@anthropic-ai/sdk';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

export interface VisionResult {
  tableName?: string;
  score: number;
  confidence: number; // 0-1
  manufacturer?: string;
  isMockData?: boolean; // Indicates if this is mock/test data
  error?: string; // Error message if API call fails
}

// Helper function to detect media type from URI
function getMediaType(uri: string): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
  const ext = uri.split('.').pop()?.toLowerCase();
  switch(ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'heic': return 'image/jpeg'; // Anthropic SDK doesn't support heic in types but accepts it, fallback to jpeg
    case 'webp': return 'image/webp';
    default: return 'image/jpeg'; // fallback
  }
}

export const aiVision = {
  // Analyze a photo and extract pinball table info and score
  async analyzePhoto(photoUri: string): Promise<VisionResult> {
    const apiKey = Constants.expoConfig?.extra?.anthropicApiKey || process.env.ANTHROPIC_API_KEY;

    // Fallback to mock if no API key
    if (!apiKey) {
      return getMockResult();
    }

    try {
      // Read photo as base64
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Initialize Claude client
      const anthropic = new Anthropic({ apiKey });

      // Call Claude Vision API
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: getMediaType(photoUri),
                data: base64,
              },
            },
            {
              type: 'text',
              text: `You are analyzing a pinball machine scoreboard photo. Extract the score (required) and table name (optional if visible).

Return ONLY valid JSON in this exact format:
{"score": <number>, "tableName": "<string or null>"}

Rules:
- score must be a number (no commas, no letters)
- If you can't read the score clearly, return null for score
- tableName is optional - only include if clearly visible
- No additional text, only the JSON object`
            }
          ]
        }]
      });

      // Parse response
      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in response');
      }

      const parsed = JSON.parse(textContent.text);

      // Validate score exists
      if (typeof parsed.score !== 'number') {
        throw new Error('No valid score in response');
      }

      return {
        score: parsed.score,
        tableName: parsed.tableName || undefined,
        confidence: 1.0,
        isMockData: false,
      };

    } catch (error) {
      console.error('AI Vision API Error:', error);
      // Return mock data with error flag
      return {
        ...getMockResult(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async setApiKey(key: string, provider: 'claude' | 'openai'): Promise<void> {
    // TODO: Store API key securely if needed
  },
};

// Helper for mock data
function getMockResult(): VisionResult {
  return {
    tableName: 'Medieval Madness',
    score: 125000000,
    confidence: 0,
    manufacturer: 'Williams',
    isMockData: true,
  };
}
