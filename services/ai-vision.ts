// AI Vision service for extracting table name and score from photos
// This will use Claude API or OpenAI Vision API
import Anthropic from '@anthropic-ai/sdk';
import { readAsStringAsync } from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import Constants from 'expo-constants';

export interface VisionResult {
  tableName?: string;
  score: number;
  confidence: number; // 0-1
  manufacturer?: string;
  isMockData?: boolean; // Indicates if this is mock/test data
  error?: string; // Error message if API call fails
}

// Helper function to get media type - always returns jpeg since we convert all images
function getMediaType(uri: string): 'image/jpeg' {
  // We convert all images to JPEG before sending to API, so always return jpeg
  return 'image/jpeg';
}

// Helper function to extract JSON from Claude response
// Handles responses with explanatory text, markdown code blocks, and backticks
export function extractJsonFromResponse(response: string): { score: number; tableName?: string | null } {
  if (!response || response.trim().length === 0) {
    throw new Error('Empty response');
  }

  let jsonText = response.trim();

  // Remove markdown code blocks: ```json ... ``` or ``` ... ```
  jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

  // Remove single backticks: `...`
  jsonText = jsonText.replace(/^`+|`+$/g, '');

  jsonText = jsonText.trim();

  // If response contains text before JSON, extract just the JSON object
  // Look for { at the start and } at the end
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON object found in response');
  }

  jsonText = jsonMatch[0];

  const parsed = JSON.parse(jsonText);

  // Validate score exists and is a number
  if (typeof parsed.score !== 'number') {
    throw new Error('No valid score in response');
  }

  return parsed;
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
      // Debug: Log the photo URI
      console.log('[AI Vision] Photo URI:', photoUri);

      // Convert image to JPEG (handles HEIC and other formats)
      // Resize to 1568px max width to stay under Claude's 5 MB image limit
      // Anthropic recommends max 1568px dimension for optimal performance
      console.log('[AI Vision] Converting image to JPEG format...');
      const manipResult = await ImageManipulator.manipulateAsync(
        photoUri,
        [{ resize: { width: 1568 } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      console.log('[AI Vision] Image converted to JPEG:', manipResult.uri);

      // Read photo as base64
      const base64 = await readAsStringAsync(manipResult.uri, {
        encoding: 'base64',
      });

      // Debug: Check base64 encoding
      console.log('[AI Vision] Base64 length:', base64.length);
      console.log('[AI Vision] Base64 first 50 chars:', base64.substring(0, 50));
      console.log('[AI Vision] Has data URI prefix:', base64.startsWith('data:'));

      // Always use image/jpeg since we converted it
      const mediaType = 'image/jpeg';
      console.log('[AI Vision] Using media type:', mediaType);

      // Initialize Claude client
      const anthropic = new Anthropic({ apiKey });

      // Debug: Log request details
      console.log('[AI Vision] Sending request to Claude API...');

      // Call Claude Vision API
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        temperature: 0.0,  // Add this line for maximum determinism in OCR
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: `You are analyzing a pinball machine scoreboard photo. Extract the score (required) and table name (optional if visible).

CRITICAL: Read each digit of the score very carefully, from left to right. Common mistakes:
- Confusing 6 and 8
- Confusing 1 and 7
- Missing commas or misreading digit groupings

Return ONLY valid JSON in this exact format:
{"score": <number>, "tableName": "<string or null>"}

Rules:
- score must be a number (no commas, no letters)
- Double-check each digit before responding
- If you can't read the score clearly, return null for score
- tableName is optional - only include if clearly visible
- No additional text, only the JSON object`
            }
          ]
        }]
      });

      // Debug: Log successful response
      console.log('[AI Vision] Received response from Claude API');

      // Parse response
      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in response');
      }

      // Add this line to log raw response for debugging
      console.log('[AI Vision] Raw Claude response:', textContent.text);

      const parsed = extractJsonFromResponse(textContent.text);

      console.log('[AI Vision] Successfully extracted:', { score: parsed.score, tableName: parsed.tableName });

      return {
        score: parsed.score,
        tableName: parsed.tableName || undefined,
        confidence: 1.0,
        isMockData: false,
      };

    } catch (error) {
      console.error('[AI Vision] Error occurred during image processing');
      console.error('[AI Vision] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[AI Vision] Error message:', error instanceof Error ? error.message : String(error));

      // Log additional error details if available
      if (error && typeof error === 'object') {
        const errorObj = error as any;
        if (errorObj.status) {
          console.error('[AI Vision] HTTP Status:', errorObj.status);
        }
        if (errorObj.error) {
          console.error('[AI Vision] Error details:', JSON.stringify(errorObj.error, null, 2));
        }
        if (errorObj.response) {
          console.error('[AI Vision] Response data:', JSON.stringify(errorObj.response, null, 2));
        }
      }

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
