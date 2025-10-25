# BugFix Round 2 - FlippersLog

## Bug 1: Edit Screen Shows "Unknown" Table for Manually Entered Scores

### Summary
When editing a score that was manually entered, the edit screen displays "Table: Unknown" even though the score was successfully saved with a table name in the home screen.

### Root Cause
The issue appears to be that when loading an existing score via `getScoreById()` in edit-score.tsx (line 34-38), the `tableName` field may not be properly populated or may have been stored as `tableId` in legacy format. The Score interface has both `tableId` (legacy) and `tableName` (new) fields.

When `tableName` is undefined or empty, line 169 displays: `Table: {tableName || 'Unknown'}`

### Investigation Needed
1. Check if manually saved scores are storing `tableName` correctly
2. Verify the data in AsyncStorage has `tableName` field populated
3. Ensure backward compatibility with legacy `tableId` format

### Solution Approach
Modify `loadExistingScore()` to:
1. Handle both `tableName` (new) and `tableId` (legacy) formats
2. If `tableId` exists but `tableName` doesn't, look up the table name from the tables list
3. Ensure all manual entry saves include `tableName`

### Files to Modify
- `app/edit-score.tsx` - loadExistingScore() function
- `services/storage.ts` - May need to add helper method for legacy conversion
- `app/manual-entry.tsx` - Verify it saves tableName correctly

---

## Bug 2: Photo Reappears on Edit Screen for Photo-Imported Scores

### Summary
When editing a score that was created from a photo import (via camera), the photo reappears on the edit screen. The user is concerned about:
1. Where the photo is being stored (not in photo roll)
2. Duplication with the original photo
3. If it's safe to remove

### Root Cause
The `photoUri` is being stored in AsyncStorage with each score (see types/index.ts line 7: `photoUri?: string;`). When a score is edited, the photoUri is loaded from AsyncStorage and passed to the edit screen (edit-score.tsx line 38).

The photo is being stored as a URI reference in AsyncStorage, likely a temporary file path or base64 data.

### Investigation Needed
1. Determine what the photoUri actually contains (file path, base64, etc.)
2. Check if photos are stored as separate files or embedded in AsyncStorage
3. Verify if original photo is in photo roll or if this is the only copy
4. Determine storage overhead

### Solution Approach
Options:
1. **Store only reference:** Keep photoUri as a reference to the photo library photo (if using Photo Library API)
2. **Don't store photo:** Remove photoUri entirely if the photo is in the user's photo library
3. **Single reference:** Store only the identifier from photo library, not the full URI

### Current Behavior
Currently storing full photoUri in AsyncStorage for every score - this could use significant storage if many photo-imported scores exist.

### Investigation Findings

**Photo URI Content:**
- From `app/capture.tsx`:
  - Camera photos: `photo.uri` from `cameraRef.current.takePictureAsync()`
  - Gallery photos: `result.assets[0].uri` from `ImagePicker.launchImageLibraryAsync()`
  - These are **file paths** (not base64), typically like `/path/to/Library/Caches/...` for camera or `/path/to/Photos/...` for library

**Storage Flow:**
1. Photo is captured/selected in capture.tsx
2. photoUri (file path) is passed via navigation params
3. User confirms, photoUri is stored in AsyncStorage via addScore()
4. On edit screen, photoUri is retrieved from AsyncStorage and displayed

**Storage Overhead Analysis:**
- Photo URI is a file path string (~100-200 bytes)
- File paths are NOT duplicate copies of the photo data
- Actual photo remains in device storage (camera roll or file system)
- Only the URI reference string (~150 bytes) is stored in AsyncStorage
- For 100 photo-imported scores: ~15KB storage overhead (negligible)

**Safety Assessment:**
- The stored photoUri remains valid only if the original photo file still exists
- Camera photos are temporary files (~days of persistence, could be deleted by OS)
- Gallery photos are permanent (safe reference)
- If user deletes the original photo from device, the photoUri becomes invalid
- Trying to display an invalid photoUri will fail silently in React Native Image component

**Recommendation:**
Keep current behavior (storing photoUri strings). However, should consider:
1. Add error handling for missing/deleted photos in Image components
2. Document that camera photos are temporary and may disappear
3. Offer manual photo import from gallery if OS deletes cache
4. No optimization needed - storage overhead is negligible

### Files Investigated
- `services/storage.ts` - Stores photoUri in AsyncStorage with scores
- `app/capture.tsx` - Captures photoUri from Camera or ImagePicker APIs
- `app/edit-score.tsx` - Line 38 loads photoUri from AsyncStorage
- `app/review-score.tsx` - Line 73 displays photoUri in Image component
- `types/index.ts` - Score interface includes optional photoUri field

---

## Bug 3: Quick Select Shows All Tables, Not Limited to 7 Most Recent

### Summary
The quick select menu on the Enter Score screen shows an apparently unbounded list of all tables, instead of:
1. Limiting to 7 most recent tables
2. Implementing text matching autocomplete
3. Auto-filling table names when user types partial match

### Current Behavior
- Quick select shows all user tables (no limit)
- No text filtering/matching on input
- No autocomplete/auto-fill feature
- User must manually select or type full table name

### Expected Behavior
1. **Limited Display:** Show only 7 most recent tables in quick select chips
2. **Text Matching:** When user types text, filter tables by name and show matches
3. **Autocomplete:** When user types characters that match a table name prefix, auto-fill the rest
   - Example: Type "me" → autocomplete to "Medieval Madness"
   - Should only autocomplete if typing matches exactly one table

### Root Cause
The quick select feature was added recently (docs/plans/2025-10-24-quick-select-user-tables.md) with basic functionality but incomplete implementation:
- Line 27-46 loads all user tables with no limit
- Line 140-155 shows all sampleTables with no filtering
- No autocomplete logic implemented

### Solution Approach

**Part A: Limit to 7 Most Recent Tables**
1. Track table creation/last-used dates
2. Modify `loadTablesForQuickSelect()` to sort by recency
3. Slice to show only top 7

**Part B: Implement Text Matching**
1. Add real-time filtering as user types in table name field
2. Show filtered tables in quick select area
3. Hide quick select when user has selected a table

**Part C: Implement Autocomplete**
1. Monitor table name input for partial matches
2. When partial input matches exactly ONE table name, auto-fill the rest
3. Make it clear to user (subtle visual indicator or just show filled text)
4. Only autocomplete if it's a clear, unambiguous match

### Files to Modify
- `app/manual-entry.tsx` - Quick select and autocomplete logic
- `services/storage.ts` - May need method to get sorted most-recent tables
- `types/index.ts` - May need to track lastUsedDate on tables

---

## Bug 4: Remove Manufacturer Field

### Summary
The Manufacturer field is not needed and should be removed from:
1. Backend storage (remove from Score and Table types)
2. UI (remove from all screens where it appears)
3. All database operations

### Current Usage
**Backend:**
- `types/index.ts` - Table interface has `manufacturer?: string`
- `services/storage.ts` - Many functions reference manufacturer
- AsyncStorage stores manufacturer field for all tables

**UI:**
- `app/manual-entry.tsx` - Manufacturer input field (lines ~161-169)
- `app/edit-score.tsx` - May display manufacturer
- `app/edit-table.tsx` - May have manufacturer field
- `app/index.tsx` - Home screen may display manufacturer

### Solution Approach
1. **Remove from Type Definition:** Remove `manufacturer` field from Table interface
2. **Remove from Storage:** Update all storage operations to not save/load manufacturer
3. **Remove from UI:** Remove manufacturer input fields from all screens
4. **Remove from State:** Remove any state variables managing manufacturer
5. **Data Migration:** Handle existing data with manufacturer field gracefully

### Files to Modify
- `types/index.ts` - Remove manufacturer field
- `services/storage.ts` - Remove manufacturer handling from addTable, updateTable, etc.
- `app/manual-entry.tsx` - Remove manufacturer input field and related state
- `app/edit-table.tsx` - Remove manufacturer field if present
- `app/edit-score.tsx` - Remove manufacturer display if present
- `app/index.tsx` - Remove manufacturer from table display if present
- All test files - Update mocks to remove manufacturer

### Priority
High - Simplifies data model and UI

---

## Implementation Order
1. **Bug 4 (Remove Manufacturer)** - Simplest, affects all other screens, should do first
2. **Bug 1 (Unknown Table)** - Critical UX issue, affects manual entry flow
3. **Bug 3 (Quick Select Improvements)** - UX enhancement with significant changes
4. **Bug 2 (Photo Storage)** - Needs investigation, may require careful handling

---

## Testing Notes
After each fix:
1. Run full test suite (npm test)
2. Verify manual entry workflow
3. Verify edit score workflow
4. Verify home screen display
5. Test with both manual and photo-imported scores

---
