# FlippersLog

A mobile app for tracking your pinball high scores with AI-powered photo scanning.

**Current Version: 1.1.0**

## Features

- 📸 **Quick Capture**: Take a photo of the score display and let AI extract the table name and score
- ✍️ **Manual Entry**: Fast manual entry with table search and formatted score input
- 🏆 **Top 3 Scores**: Track your top 3 scores for each pinball table

## Tech Stack

- **Expo SDK 54** - React Native framework
- **React 19.1** / **React Native 0.81** - Latest stable versions
- **TypeScript 5.6** - Type safety
- **Expo Router 5** - File-based navigation
- **Expo Camera 17** - Photo capture
- **AsyncStorage 2.1** - Local data persistence

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app on your iPhone

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

### Running on Your iPhone

1. Install the **Expo Go** app from the App Store
2. Run `npm start` in the project directory
3. Scan the QR code with your iPhone camera
4. The app will open in Expo Go

## Project Structure

```
FlippersLog/
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Root layout with navigation
│   ├── index.tsx          # Main scores list (shows top 3 per table)
│   ├── capture.tsx        # Camera screen for photo capture
│   └── manual-entry.tsx   # Manual score entry form
├── services/
│   ├── storage.ts         # AsyncStorage wrapper for scores/tables
│   └── ai-vision.ts       # AI vision API integration (placeholder)
├── types/
│   └── index.ts           # TypeScript type definitions
└── components/            # Reusable UI components (coming soon)
```

## MVP Features (Current)

✅ Quick photo capture with camera
✅ Manual score entry with formatted input
✅ Top 3 scores displayed per table
✅ Local data persistence
🚧 AI vision integration (placeholder - ready for API integration)

## Future Features

- 🤝 Social sharing
- 🎮 Pinball table database integration
- 🔍 Table search with autocomplete

## AI Vision Integration

The app is ready to integrate with Claude API or OpenAI Vision API. To enable:

1. Add your API key to `services/ai-vision.ts`
2. Implement the `analyzePhoto()` function with actual API calls
3. Update the prompt to extract table name, manufacturer, and score

Example prompt structure:
```
Analyze this pinball machine photo and extract:
- Table name (exact name of the game)
- Score displayed (numeric value)
- Manufacturer if visible

Return as JSON: { tableName, score, manufacturer }
```

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## Credits & Data Sources

This app uses location data and venue information from:

- **❤️ Pinball Map** (https://pinballmap.com) - Community-maintained database of pinball locations and machines worldwide

The Pinball Map API provides freely accessible data about pinball venues and machine locations, helping players discover new places to play.

## License

MIT
