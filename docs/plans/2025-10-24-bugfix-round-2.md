# BugFix Round 2 Implementation Plan

> **For Claude:** Use `${SUPERPOWERS_SKILLS_ROOT}/skills/collaboration/executing-plans/SKILL.md` to implement this plan task-by-task.

**Goal:** Fix four critical issues: remove manufacturer field, fix "unknown" table display in edit screen, limit quick select to 7 recent tables with autocomplete, and investigate photo storage behavior.

**Architecture:**
1. First remove manufacturer field (simplest, affects all screens)
2. Fix edit screen "unknown" table issue by ensuring tableName is properly loaded
3. Enhance quick select with recent table limit (7), text filtering, and autocomplete
4. Investigate photo storage to understand and optimize storage mechanism

**Tech Stack:** React Native, TypeScript, Jest/Testing Library, AsyncStorage, TDD with RED → GREEN → REFACTOR

---

## Task 1: Remove Manufacturer Field from Type Definition

**Files:**
- Modify: `types/index.ts:1-30`

**Step 1: Read the current Table interface**

Current code shows:
```typescript
export interface Table {
  id: string;
  name: string;
  manufacturer?: string;  // ← REMOVE THIS LINE
  year?: number;
}
```

**Step 2: Update the interface**

Replace with:
```typescript
export interface Table {
  id: string;
  name: string;
  year?: number;
}
```

**Step 3: Verify no build errors**

Run: `npm run type-check` or just run tests which will catch type errors:
```bash
npm test
```

Expected: Tests compile without type errors related to Table

---

## Task 2: Remove Manufacturer from Storage Service

**Files:**
- Modify: `services/storage.ts:64-80` (addTable function)
- Modify: `services/storage.ts:240-270` (updateScore function)
- Modify: `services/storage.ts` (any other references to manufacturer)

**Step 1: Find all manufacturer references**

Run:
```bash
grep -n "manufacturer" /Users/david/dev/FlippersLog/services/storage.ts
```

Expected: Shows all lines with "manufacturer"

**Step 2: Update addTable function**

Find the addTable function and remove manufacturer parameter:

Old code (approximately line 64):
```typescript
async addTable(tableName: string, manufacturer?: string): Promise<void> {
  // ...
  const newTable: Table = {
    id: generateId(),
    name: tableName,
    manufacturer: manufacturer || '',  // ← REMOVE
  };
```

New code:
```typescript
async addTable(tableName: string): Promise<void> {
  // ...
  const newTable: Table = {
    id: generateId(),
    name: tableName,
  };
```

**Step 3: Update any calls to addTable**

Search for `addTable(` calls and remove manufacturer argument:

```bash
grep -n "addTable(" /Users/david/dev/FlippersLog/services/storage.ts
```

Update calls like:
- `this.addTable(tableName, manufacturer)` → `this.addTable(tableName)`

**Step 4: Run all tests**

```bash
npm test
```

Expected: All tests pass

---

## Task 3: Remove Manufacturer from Manual Entry Screen

**Files:**
- Modify: `app/manual-entry.tsx:1-20` (imports)
- Modify: `app/manual-entry.tsx:20-25` (state)
- Modify: `app/manual-entry.tsx:55-60` (selectTable function)
- Modify: `app/manual-entry.tsx:160-170` (UI - manufacturer field)
- Modify: `app/manual-entry.tsx:70-80` (handleSave - remove manufacturer from save)

**Step 1: Write failing test for manufacturer removal**

Create `__tests__/manual-entry-no-manufacturer.test.tsx`:

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ManualEntryScreen from '@/app/manual-entry';
import { storage } from '@/services/storage';
import { useRouter } from 'expo-router';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useFocusEffect: jest.fn((callback) => {
    callback();
  }),
}));

jest.mock('@/services/storage');
const mockStorage = storage as jest.Mocked<typeof storage>;

describe('Manual Entry - No Manufacturer Field', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      back: jest.fn(),
    });
    mockStorage.getTables.mockResolvedValue([]);
    mockStorage.getSampleTables.mockResolvedValue([]);
    mockStorage.saveTable.mockResolvedValue({
      id: 'table-1',
      name: 'Test Table',
    });
    mockStorage.saveScore.mockResolvedValue(undefined);
  });

  it('should not have manufacturer input field', () => {
    render(<ManualEntryScreen />);

    // Manufacturer field should not exist
    const manufacturerLabels = screen.queryAllByText(/manufacturer/i);
    expect(manufacturerLabels.length).toBe(0);
  });

  it('should save score without manufacturer field', async () => {
    render(<ManualEntryScreen />);

    const tableInput = screen.getByDisplayValue('');
    fireEvent.changeText(tableInput, 'Medieval Madness');

    const scoreInput = screen.getByDisplayValue('');
    fireEvent.changeText(scoreInput, '1000000');

    const saveButton = screen.getByText('Save Score');
    fireEvent.press(saveButton);

    await waitFor(() => {
      // saveTable should be called with only name, no manufacturer
      expect(mockStorage.saveTable).toHaveBeenCalledWith({
        name: 'Medieval Madness',
      });
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/manual-entry-no-manufacturer.test.tsx
```

Expected: Test fails because manufacturer field still exists in UI

**Step 3: Remove manufacturer state**

In `app/manual-entry.tsx`, find and remove:
```typescript
const [manufacturer, setManufacturer] = useState('');
```

**Step 4: Remove manufacturer from selectTable function**

Change from:
```typescript
const selectTable = (table: Table) => {
  setTableName(table.name);
  setManufacturer(table.manufacturer || '');
  setShowSuggestions(false);
};
```

To:
```typescript
const selectTable = (table: Table) => {
  setTableName(table.name);
  setShowSuggestions(false);
};
```

**Step 5: Remove manufacturer UI field**

Find and remove this entire section (approximately lines 160-170):
```typescript
<View style={styles.fieldContainer}>
  <Text style={styles.label}>Manufacturer</Text>
  <TextInput
    style={styles.input}
    placeholder="e.g., Williams, Stern, Bally"
    value={manufacturer}
    onChangeText={setManufacturer}
    autoCapitalize="words"
  />
</View>
```

**Step 6: Update handleSave to not save manufacturer**

Change from:
```typescript
const table = await storage.saveTable({
  name: tableName.trim(),
  manufacturer: manufacturer.trim() || undefined,
});
```

To:
```typescript
const table = await storage.saveTable({
  name: tableName.trim(),
});
```

**Step 7: Run test to verify it passes**

```bash
npm test -- __tests__/manual-entry-no-manufacturer.test.tsx
```

Expected: Test passes

**Step 8: Run all tests**

```bash
npm test
```

Expected: All tests pass (should still be ~98)

**Step 9: Commit**

```bash
git add app/manual-entry.tsx types/index.ts services/storage.ts __tests__/manual-entry-no-manufacturer.test.tsx
git commit -m "refactor: remove manufacturer field from backend and UI

- Remove manufacturer from Table interface
- Remove manufacturer from addTable in storage service
- Remove manufacturer state and input field from manual entry screen
- Update saveTable call to not include manufacturer
- Add test to verify manufacturer field is removed

All 98+ tests passing."
```

---

## Task 4: Fix Edit Screen "Unknown" Table Issue

**Files:**
- Modify: `app/edit-score.tsx:32-45` (loadExistingScore function)
- Create: `__tests__/edit-score-unknown-table.test.tsx`

**Step 1: Write failing test**

Create `__tests__/edit-score-unknown-table.test.tsx`:

```typescript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import EditScore from '@/app/edit-score';
import { storage } from '@/services/storage';
import { useLocalSearchParams, useRouter } from 'expo-router';

jest.mock('expo-router');
jest.mock('@/services/storage');

const mockStorage = storage as jest.Mocked<typeof storage>;
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

describe('Edit Score - Table Name Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: jest.fn(), back: jest.fn() });
    mockStorage.getTables.mockResolvedValue([]);
  });

  it('should display table name when editing manually entered score', async () => {
    const mockScore = {
      id: 'score-1',
      tableName: 'Medieval Madness',
      score: 1000000,
      date: new Date().toISOString(),
    };

    mockUseLocalSearchParams.mockReturnValue({
      scoreId: 'score-1',
    });

    mockStorage.getScoreById.mockResolvedValue(mockScore);
    mockStorage.getTables.mockResolvedValue([]);

    render(<EditScore />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeOnTheScreen();
    });

    const tableDisplay = screen.getByText(/Table:/);
    expect(tableDisplay.children[0]).toBe('Table: Medieval Madness');
  });

  it('should not display "Unknown" when tableName exists', async () => {
    const mockScore = {
      id: 'score-1',
      tableName: 'Attack from Mars',
      score: 2000000,
      date: new Date().toISOString(),
    };

    mockUseLocalSearchParams.mockReturnValue({
      scoreId: 'score-1',
    });

    mockStorage.getScoreById.mockResolvedValue(mockScore);
    mockStorage.getTables.mockResolvedValue([]);

    render(<EditScore />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/)).not.toBeOnTheScreen();
    });

    // Should NOT contain "Unknown"
    expect(screen.queryByText(/Unknown/)).not.toBeOnTheScreen();
    expect(screen.getByText(/Attack from Mars/)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/edit-score-unknown-table.test.tsx
```

Expected: Test fails because tableName is not being loaded/displayed correctly

**Step 3: Fix loadExistingScore function**

In `app/edit-score.tsx`, update the `loadExistingScore` function:

Current code (lines 32-45):
```typescript
const loadExistingScore = async () => {
  try {
    const existingScore = await storage.getScoreById(params.scoreId!);
    if (existingScore) {
      setScore(existingScore.score.toString());
      setTableName(existingScore.tableName || '');
      setPhotoUri(existingScore.photoUri);
    }
    setLoading(false);
  } catch (error) {
    Alert.alert('Error', 'Failed to load score');
    setLoading(false);
  }
};
```

The issue is that it's setting `existingScore.tableName || ''` which is correct. The real issue might be in how the score is being saved. Let's ensure we're checking both tableName and legacy tableId:

New code:
```typescript
const loadExistingScore = async () => {
  try {
    const existingScore = await storage.getScoreById(params.scoreId!);
    if (existingScore) {
      setScore(existingScore.score.toString());

      // Use tableName if available, otherwise fallback to legacy tableId lookup
      let displayTableName = existingScore.tableName || '';

      // If no tableName but tableId exists (legacy), try to find the table name
      if (!displayTableName && existingScore.tableId) {
        const tables = await storage.getTables();
        const table = tables.find(t => t.id === existingScore.tableId);
        displayTableName = table?.name || '';
      }

      setTableName(displayTableName);
      setPhotoUri(existingScore.photoUri);
    }
    setLoading(false);
  } catch (error) {
    Alert.alert('Error', 'Failed to load score');
    setLoading(false);
  }
};
```

**Step 4: Also verify manual entry is saving tableName correctly**

Check that `app/manual-entry.tsx` in the `handleSave` function is calling:

```typescript
await storage.saveScore({
  tableId: table.id,
  score: numericScore,
  date: new Date().toISOString(),
});
```

Should be:
```typescript
await storage.saveScore({
  tableName: table.name,  // Add this
  tableId: table.id,      // Keep for now (backward compat)
  score: numericScore,
  date: new Date().toISOString(),
});
```

**Step 5: Run test to verify it passes**

```bash
npm test -- __tests__/edit-score-unknown-table.test.tsx
```

Expected: Test passes

**Step 6: Run all tests**

```bash
npm test
```

Expected: All tests pass

**Step 7: Commit**

```bash
git add app/edit-score.tsx app/manual-entry.tsx __tests__/edit-score-unknown-table.test.tsx
git commit -m "fix: display correct table name in edit screen instead of 'Unknown'

- Ensure manual entry saves tableName with scores
- Fix loadExistingScore to handle both tableName and legacy tableId
- Add fallback table name lookup for legacy scores with only tableId
- Add tests to verify table names display correctly

Fixes: Edit screen shows 'Unknown' for manually entered scores"
```

---

## Task 5: Add lastUsedDate to Table for Quick Select Sorting

**Files:**
- Modify: `types/index.ts` - Add lastUsedDate to Table
- Modify: `services/storage.ts` - Track and update lastUsedDate
- Create: `__tests__/table-last-used.test.ts`

**Step 1: Write failing test**

Create `__tests__/table-last-used.test.ts`:

```typescript
import { storage } from '@/services/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('Table Last Used Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should track lastUsedDate when score is saved', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    // Save a table
    await storage.saveTable({ name: 'Test Table' });

    // Save a score with that table
    await storage.saveScore({
      tableName: 'Test Table',
      score: 1000000,
      date: new Date().toISOString(),
    });

    // Get tables - the table should have lastUsedDate set to approximately now
    const tables = await storage.getTables();
    const testTable = tables.find(t => t.name === 'Test Table');

    expect(testTable?.lastUsedDate).toBeTruthy();
    expect(new Date(testTable!.lastUsedDate!).getTime()).toBeCloseTo(Date.now(), -3);
  });

  it('should update lastUsedDate when score is updated', async () => {
    // Setup: create table and score
    const oldDate = new Date('2025-01-01').toISOString();

    // ... setup code ...

    // Update the score - lastUsedDate should be updated
    await storage.updateScore('score-1', {
      score: 2000000,
      tableName: 'Test Table',
    });

    const tables = await storage.getTables();
    const testTable = tables.find(t => t.name === 'Test Table');

    expect(new Date(testTable!.lastUsedDate!).getTime()).toBeGreaterThan(
      new Date(oldDate).getTime()
    );
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/table-last-used.test.ts
```

Expected: Fails because lastUsedDate doesn't exist on Table

**Step 3: Add lastUsedDate to Table interface**

In `types/index.ts`:

```typescript
export interface Table {
  id: string;
  name: string;
  year?: number;
  lastUsedDate?: string;  // ← ADD THIS
}
```

**Step 4: Update addScore to set lastUsedDate**

In `services/storage.ts`, find the `addScore` function and update the table when a score is saved:

After saving the table, also update its `lastUsedDate`:

```typescript
// In addScore, after saving the score:
const tables = await this.getTables();
const tableIndex = tables.findIndex(t => t.name === scoreData.tableName);
if (tableIndex >= 0) {
  tables[tableIndex].lastUsedDate = new Date().toISOString();
  await AsyncStorage.setItem(TABLES_KEY, JSON.stringify(tables));
}
```

**Step 5: Update updateScore to update lastUsedDate**

In `updateScore`, add similar logic to update the table's lastUsedDate when a score is updated.

**Step 6: Run test to verify it passes**

```bash
npm test -- __tests__/table-last-used.test.ts
```

Expected: Test passes

**Step 7: Run all tests**

```bash
npm test
```

Expected: All tests pass

**Step 8: Commit**

```bash
git add types/index.ts services/storage.ts __tests__/table-last-used.test.ts
git commit -m "feat: track lastUsedDate on tables for quick select sorting

- Add lastUsedDate field to Table interface
- Update lastUsedDate when scores are saved or updated
- Enable sorting tables by recency for quick select menu

Prepares for quick select improvements in next task"
```

---

## Task 6: Limit Quick Select to 7 Most Recent Tables

**Files:**
- Modify: `app/manual-entry.tsx:27-46` (loadTablesForQuickSelect)
- Create: `__tests__/manual-entry-quick-select-limit.test.tsx`

**Step 1: Write failing test**

Create `__tests__/manual-entry-quick-select-limit.test.tsx`:

```typescript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import ManualEntryScreen from '@/app/manual-entry';
import { storage } from '@/services/storage';
import { useRouter } from 'expo-router';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useFocusEffect: jest.fn((callback) => {
    callback();
  }),
}));

jest.mock('@/services/storage');
const mockStorage = storage as jest.Mocked<typeof storage>;

describe('Manual Entry - Quick Select Limit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      back: jest.fn(),
    });
  });

  it('should show only 7 most recent tables in quick select', async () => {
    const mockTables = Array.from({ length: 15 }, (_, i) => ({
      id: `table-${i}`,
      name: `Table ${i}`,
      lastUsedDate: new Date(Date.now() - i * 1000000).toISOString(), // Most recent first
    }));

    mockStorage.getTables.mockResolvedValue(mockTables);
    mockStorage.getSampleTables.mockResolvedValue([]);

    render(<ManualEntryScreen />);

    await waitFor(() => {
      // Should only show first 7 tables
      for (let i = 0; i < 7; i++) {
        expect(screen.getByText(`Table ${i}`)).toBeTruthy();
      }

      // Should NOT show tables 7-14
      expect(screen.queryByText('Table 7')).not.toBeOnTheScreen();
      expect(screen.queryByText('Table 14')).not.toBeOnTheScreen();
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/manual-entry-quick-select-limit.test.tsx
```

Expected: Fails because all tables are shown, not limited to 7

**Step 3: Modify loadTablesForQuickSelect to limit and sort**

In `app/manual-entry.tsx`, update the function:

```typescript
const loadTablesForQuickSelect = useCallback(async () => {
  try {
    const userTables = await storage.getTables();

    // Sort by lastUsedDate (most recent first), limit to 7
    const sortedTables = userTables
      .sort((a, b) => {
        const dateA = new Date(a.lastUsedDate || 0).getTime();
        const dateB = new Date(b.lastUsedDate || 0).getTime();
        return dateB - dateA; // Most recent first
      })
      .slice(0, 7); // Take only first 7

    if (sortedTables.length > 0) {
      setSampleTables(sortedTables);
    } else {
      // Fallback: show sample tables for new users with no saved tables
      const samples = await storage.getSampleTables();
      setSampleTables(samples);
    }
  } catch (error) {
    console.error('Error loading tables for quick select:', error);
    const samples = await storage.getSampleTables();
    setSampleTables(samples);
  }
}, []);
```

**Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/manual-entry-quick-select-limit.test.tsx
```

Expected: Test passes

**Step 5: Run all tests**

```bash
npm test
```

Expected: All tests pass

**Step 6: Commit**

```bash
git add app/manual-entry.tsx __tests__/manual-entry-quick-select-limit.test.tsx
git commit -m "feat: limit quick select to 7 most recent tables

- Sort tables by lastUsedDate in descending order
- Limit quick select display to 7 most recent tables
- Fallback to sample tables for new users with no tables
- Add tests to verify limit works correctly"
```

---

## Task 7: Add Text Matching and Autocomplete to Table Input

**Files:**
- Modify: `app/manual-entry.tsx:60-80` (add text matching logic)
- Create: `__tests__/manual-entry-autocomplete.test.tsx`

**Step 1: Write failing test**

Create `__tests__/manual-entry-autocomplete.test.tsx`:

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ManualEntryScreen from '@/app/manual-entry';
import { storage } from '@/services/storage';
import { useRouter } from 'expo-router';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useFocusEffect: jest.fn((callback) => {
    callback();
  }),
}));

jest.mock('@/services/storage');
const mockStorage = storage as jest.Mocked<typeof storage>;

describe('Manual Entry - Text Matching and Autocomplete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      back: jest.fn(),
    });
    mockStorage.getSampleTables.mockResolvedValue([]);
  });

  it('should filter tables by partial text match', async () => {
    const mockTables = [
      { id: '1', name: 'Medieval Madness', lastUsedDate: new Date().toISOString() },
      { id: '2', name: 'Attack from Mars', lastUsedDate: new Date().toISOString() },
      { id: '3', name: 'The Addams Family', lastUsedDate: new Date().toISOString() },
    ];

    mockStorage.getTables.mockResolvedValue(mockTables);

    render(<ManualEntryScreen />);

    // Find table input and type partial text
    const tableInput = screen.getByDisplayValue('');
    fireEvent.changeText(tableInput, 'med');

    await waitFor(() => {
      // Should show matching table
      expect(screen.getByText('Medieval Madness')).toBeTruthy();
      // Should not show non-matching tables
      expect(screen.queryByText('Attack from Mars')).not.toBeOnTheScreen();
    });
  });

  it('should autocomplete when exactly one table matches', async () => {
    const mockTables = [
      { id: '1', name: 'Medieval Madness', lastUsedDate: new Date().toISOString() },
      { id: '2', name: 'Attack from Mars', lastUsedDate: new Date().toISOString() },
    ];

    mockStorage.getTables.mockResolvedValue(mockTables);

    render(<ManualEntryScreen />);

    const tableInput = screen.getByDisplayValue('');

    // Type 'att' - should match only 'Attack from Mars'
    fireEvent.changeText(tableInput, 'att');

    await waitFor(() => {
      // Should autocomplete to 'Attack from Mars'
      expect(tableInput.props.value).toBe('Attack from Mars');
    });
  });

  it('should not autocomplete when multiple tables match', async () => {
    const mockTables = [
      { id: '1', name: 'Medieval Madness', lastUsedDate: new Date().toISOString() },
      { id: '2', name: 'Monster Bash', lastUsedDate: new Date().toISOString() },
    ];

    mockStorage.getTables.mockResolvedValue(mockTables);

    render(<ManualEntryScreen />);

    const tableInput = screen.getByDisplayValue('');

    // Type 'ma' - matches both Medieval and Monster
    fireEvent.changeText(tableInput, 'ma');

    await waitFor(() => {
      // Should NOT autocomplete (multiple matches)
      expect(tableInput.props.value).toBe('ma');
      // Should show both options
      expect(screen.getByText('Medieval Madness')).toBeTruthy();
      expect(screen.getByText('Monster Bash')).toBeTruthy();
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/manual-entry-autocomplete.test.tsx
```

Expected: Fails because autocomplete logic doesn't exist

**Step 3: Implement text matching and autocomplete**

In `app/manual-entry.tsx`, update the table input handling. First, add state for tracked input:

```typescript
const [tableInputValue, setTableInputValue] = useState('');
```

Then create a new handler function:

```typescript
const handleTableNameInputChange = (text: string) => {
  setTableInputValue(text);
  setTableName(text);

  if (text.length === 0) {
    // No text - show quick select again
    loadTablesForQuickSelect();
  } else {
    // Filter tables by text match
    const matchingTables = sampleTables.filter(table =>
      table.name.toLowerCase().includes(text.toLowerCase())
    );

    // If exactly one table matches, autocomplete
    if (matchingTables.length === 1) {
      const fullName = matchingTables[0].name;
      setTableName(fullName);
      setTableInputValue(fullName);
    } else if (matchingTables.length > 1) {
      // Multiple matches - show filtered list
      setSampleTables(matchingTables);
    } else {
      // No matches - don't show quick select
      setSampleTables([]);
    }
  }
};
```

**Step 4: Replace the TextInput onChange handler**

Find the table name input and change from:
```typescript
onChangeText={setTableName}
```

To:
```typescript
onChangeText={handleTableNameInputChange}
value={tableInputValue}
```

**Step 5: Run test to verify it passes**

```bash
npm test -- __tests__/manual-entry-autocomplete.test.tsx
```

Expected: Tests pass

**Step 6: Run all tests**

```bash
npm test
```

Expected: All tests pass (should be 101+ now with new tests)

**Step 7: Commit**

```bash
git add app/manual-entry.tsx __tests__/manual-entry-autocomplete.test.tsx
git commit -m "feat: add text matching and autocomplete to table name input

- Filter tables by partial text match as user types
- Autocomplete table name when exactly one table matches
- Show filtered suggestions when multiple tables match
- Clear quick select when no matches found
- Add tests for text matching and autocomplete behavior"
```

---

## Task 8: Investigate Photo Storage Behavior

**Files:**
- Document findings in BUGFIX-ROUND-2.md
- No code changes yet (investigation only)

**Step 1: Check how photos are stored**

Run:
```bash
grep -n "photoUri" /Users/david/dev/FlippersLog/app/capture.tsx
grep -n "photoUri" /Users/david/dev/FlippersLog/services/storage.ts
grep -n "photoUri" /Users/david/dev/FlippersLog/types/index.ts
```

**Step 2: Examine capture.tsx to understand photo flow**

Read `/Users/david/dev/FlippersLog/app/capture.tsx` and determine:
- How is the photo URI generated?
- Is it a file path or base64?
- Is it stored in photo library or as temporary file?

**Step 3: Check storage size impact**

Consider:
- Size of typical photoUri string (if base64, could be megabytes)
- Number of scores users typically save
- AsyncStorage size limits

**Step 4: Determine solution**

Based on findings, recommend one of:
1. Store only reference to photo library (ID instead of full URI)
2. Remove photo storage entirely (user keeps in photo library)
3. Compress/thumbnail photos before storing

**Step 5: Document findings**

Update `BUGFIX-ROUND-2.md` with investigation results and recommendation.

---

## Summary of Changes

**Files Modified:**
- types/index.ts - Remove manufacturer, add lastUsedDate
- services/storage.ts - Remove manufacturer handling, track lastUsedDate
- app/manual-entry.tsx - Remove manufacturer field, add table limiting & autocomplete
- app/edit-score.tsx - Fix table name loading

**Tests Added:**
- __tests__/manual-entry-no-manufacturer.test.tsx
- __tests__/edit-score-unknown-table.test.tsx
- __tests__/table-last-used.test.ts
- __tests__/manual-entry-quick-select-limit.test.tsx
- __tests__/manual-entry-autocomplete.test.tsx

**Expected Test Count:** 103+ tests passing (from current 98)

**Commits:** 7 commits (one per task)

---

## Testing Strategy

After each task:
1. Run: `npm test` to verify all tests pass
2. Manual verification on actual device/simulator
3. Check for regressions in existing features

Before final push:
1. Run full test suite
2. Verify manual entry workflow end-to-end
3. Verify edit score workflow
4. Verify home screen display

---

