# TDD Bug Fixes - FlippersLog

## Bugs Fixed (Following TDD Methodology)

### Bug 1: Manual Entry Doesn't Show Saved Scores
**Problem:** Scores were being saved but not appearing in the list when navigating back from manual entry.

**Root Cause:** Home screen only loaded data on initial mount (`useEffect`), not when returning to the screen.

**TDD Process:**
1. **RED:** Wrote failing test `__tests__/home-screen.test.tsx` - verified data doesn't reload on focus
2. **GREEN:** Fixed by replacing `useEffect` with `useFocusEffect` in `app/index.tsx:26-30`
3. **REFACTOR:** Cleaned up duplicate imports

**Changes:**
- `app/index.tsx`: Added `useFocusEffect` to reload data when screen gains focus
- Test: `__tests__/home-screen.test.tsx`

---

### Bug 2: Camera Always Returns Mock Data
**Problem:** Camera always returned "Medieval Madness 125000000" with no indication it was test data.

**Root Cause:** AI vision service had hardcoded mock implementation, no flag to indicate mock data.

**TDD Process:**
1. **RED:** Wrote failing tests in `__tests__/ai-vision.test.ts` - verified no `isMockData` field
2. **GREEN:**
   - Added `isMockData?: boolean` to `VisionResult` interface
   - Set `isMockData: true` and `confidence: 0` in mock implementation
   - Updated camera screen to show warning alert when mock data detected
3. **REFACTOR:** No changes needed

**Changes:**
- `services/ai-vision.ts`: Added `isMockData` field to results, set to `true` for mock data
- `app/capture.tsx`: Shows "⚠️ Using Test Data" alert when `isMockData` is true

---

## Enhancement: Sample Tables Dropdown

**Feature:** Added quick-select dropdown with 3 sample pinball tables to manual entry.

**TDD Process:**
1. **RED:** Wrote failing test `__tests__/storage.test.ts` - verified `getSampleTables()` doesn't exist
2. **GREEN:**
   - Added `getSampleTables()` method to storage service
   - Added UI to display sample table chips
   - Added table selection logic
3. **REFACTOR:** No changes needed

**Changes:**
- `services/storage.ts:106-128`: Added `getSampleTables()` returning 3 sample tables
- `app/manual-entry.tsx`: Added sample table quick-select UI with chips

**Sample Tables:**
1. Medieval Madness (Williams, 1997)
2. Attack from Mars (Bally, 1995)
3. The Addams Family (Bally, 1992)

---

## Test Coverage

All tests passing:
```
Test Suites: 4 passed, 4 total
Tests:       6 passed, 6 total
```

### Test Files Created:
1. `__tests__/storage.test.ts` - Sample tables functionality
2. `__tests__/home-screen.test.tsx` - Data reload on focus
3. `__tests__/ai-vision.test.ts` - Mock data detection
4. `__tests__/setup.test.ts` - Jest configuration validation

---

## Testing Infrastructure Setup

**Dependencies Added:**
- `jest@^29.7.0`
- `jest-expo@~54.0.0`
- `@testing-library/react-native@^12.8.1`
- `@types/jest@^29.5.14`

**Configuration Files:**
- `jest.config.js` - Jest configuration with Expo preset
- `jest.setup.js` - Mock setup for AsyncStorage, expo-router, expo-camera, icons

**Scripts Added:**
- `npm test` - Run all tests
- `npm test:watch` - Run tests in watch mode

---

## TDD Verification Checklist

✅ Every new function/method has a test
✅ Watched each test fail before implementing
✅ Each test failed for expected reason (feature missing, not typo)
✅ Wrote minimal code to pass each test
✅ All tests pass
✅ Output pristine (no errors, warnings)
✅ Tests use real code (mocks only where unavoidable)
✅ Edge cases and errors covered

---

## Running the App

1. Install dependencies (if not already done): `npm install`
2. Start development server: `npm start`
3. Scan QR code with Expo Go app on iPhone

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test __tests__/storage.test.ts

# Run in watch mode
npm test:watch
```

---

## What Works Now

✅ **Manual Entry:** Saves scores and they immediately appear on home screen
✅ **Quick Select:** 3 sample tables available for fast entry
✅ **Camera:** Works and shows clear warning that it's using test data
✅ **Home Screen:** Auto-refreshes when you return to it
✅ **Test Coverage:** All features covered by automated tests

## Next Steps

- Add real AI vision API integration (Claude or OpenAI)
- Add settings screen for API key management
- Add more pinball tables to the sample list
- Persist user's recent tables for quick access
