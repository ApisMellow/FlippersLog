# Setup Instructions

## Install Dependencies

```bash
npm install
```

**Note:** You may see some deprecation warnings for `glob`, `rimraf`, and `inflight`. These are from transitive dependencies (dependencies of our dependencies) and don't affect functionality. The project uses Expo SDK 54 with up-to-date direct dependencies.

## Start Development Server

```bash
npm start
```

This will start the Expo development server and show a QR code.

## Run on Your iPhone

1. **Install Expo Go** from the App Store
2. **Scan the QR code** with your iPhone camera (not from within Expo Go)
3. The app will open in Expo Go

## Alternative: Run with Expo Go URL

If the QR code doesn't work:

1. Note the `exp://` URL shown in the terminal
2. Open Expo Go on your iPhone
3. Manually enter the URL

## Troubleshooting

### "Unable to resolve module"
- Make sure all dependencies are installed: `npm install`
- Clear the Metro bundler cache: `npm start -- --clear`

### Camera not working
- Make sure you granted camera permissions in iOS Settings
- The app will prompt for permission the first time you use the capture feature

### Assets not loading
- The placeholder asset files (icon.png, splash.png) are empty. You can replace them with actual images later, or the app will use defaults.

## Next Steps After Setup

1. **Test the app** on your iPhone
2. **Add some test scores** using manual entry
3. **Try the camera** to see the UI flow
4. **Integrate AI vision** by adding your Claude or OpenAI API key to `services/ai-vision.ts`

## AI Vision Integration

To enable actual AI photo analysis:

1. Get an API key from:
   - **Anthropic Claude**: https://console.anthropic.com/
   - **OpenAI**: https://platform.openai.com/

2. Update `services/ai-vision.ts` with the actual API implementation

3. Example for Claude API:
```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: 'your-api-key-here',
});

async function analyzePhoto(photoUri: string): Promise<VisionResult> {
  // Convert photo to base64
  const base64 = await FileSystem.readAsStringAsync(photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: base64,
          },
        },
        {
          type: 'text',
          text: 'Analyze this pinball machine photo and extract the table name, score, and manufacturer. Return as JSON.'
        }
      ],
    }],
  });

  // Parse response and return
}
```

For now, the mock implementation will return fake data so you can test the full flow.
