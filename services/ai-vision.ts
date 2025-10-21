// AI Vision service for extracting table name and score from photos
// This will use Claude API or OpenAI Vision API

export interface VisionResult {
  tableName: string;
  score: number;
  confidence: number; // 0-1
  manufacturer?: string;
  isMockData?: boolean; // Indicates if this is mock/test data
}

export const aiVision = {
  // Analyze a photo and extract pinball table info and score
  async analyzePhoto(photoUri: string): Promise<VisionResult> {
    // TODO: Implement AI vision API call
    // For now, return a mock result

    // This will eventually:
    // 1. Convert photo to base64 or upload to cloud storage
    // 2. Call Claude API or OpenAI Vision API with prompt like:
    //    "Analyze this pinball machine photo. Extract:
    //     - Table name
    //     - Current score displayed
    //     - Manufacturer if visible
    //     Return as JSON."
    // 3. Parse the response and return structured data

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          tableName: 'Medieval Madness',
          score: 125000000,
          confidence: 0, // Mock data has zero confidence
          manufacturer: 'Williams',
          isMockData: true,
        });
      }, 1500);
    });
  },

  // Set API key for the vision service
  async setApiKey(key: string, provider: 'claude' | 'openai'): Promise<void> {
    // TODO: Store API key securely
    // Use expo-secure-store for production
  },
};
