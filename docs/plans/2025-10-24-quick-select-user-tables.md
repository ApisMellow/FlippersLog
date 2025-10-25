# Quick Select Menu - Show User Tables Implementation Plan

> **For Claude:** Use `${SUPERPOWERS_SKILLS_ROOT}/skills/collaboration/executing-plans/SKILL.md` to implement this plan task-by-task.

**Goal:** Fix the quick select menu on the Enter Score screen to display user's actual saved tables instead of hardcoded samples, with automatic refresh when returning to the screen.

**Architecture:** Replace the hardcoded `getSampleTables()` call with `getTables()` to fetch real user data from AsyncStorage. Use `useFocusEffect` hook (like the home screen does) to reload tables when the screen regains focus, ensuring new tables appear immediately. Provide fallback to sample tables only when user has no saved tables yet.

**Tech Stack:** React Native, expo-router (useFocusEffect), AsyncStorage (via storage service), TDD with Jest and react-native-testing-library

---

## Task 1: Write Failing Test for User Tables in Quick Select

**Files:**
- Create: `__tests__/manual-entry-user-tables.test.tsx`

**Step 1: Create the failing test file**

Create `__tests__/manual-entry-user-tables.test.tsx`:

```typescript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import ManualEntryScreen from '@/app/manual-entry';
import { storage } from '@/services/storage';
import { useRouter } from 'expo-router';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useFocusEffect: jest.fn((callback) => {
    // Call the callback immediately to simulate screen focus
    callback();
  }),
}));

// Mock the storage
jest.mock('@/services/storage');
const mockStorage = storage as jest.Mocked<typeof storage>;

describe('Manual Entry Screen - User Tables Quick Select', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      back: jest.fn(),
    });
  });

  it('should display user tables from getTables when user has saved tables', async () => {
    const mockUserTables = [
      {
        id: 'user-1',
        name: 'Test Table 1',
        manufacturer: 'Williams',
      },
      {
        id: 'user-2',
        name: 'Test Table 2',
        manufacturer: 'Bally',
      },
    ];

    mockStorage.getTables.mockResolvedValue(mockUserTables);

    const { findByText } = render(<ManualEntryScreen />);

    // User tables should be displayed in quick select
    await waitFor(() => {
      expect(findByText('Test Table 1')).toBeTruthy();
      expect(findByText('Test Table 2')).toBeTruthy();
    });
  });

  it('should show sample tables as fallback when user has no saved tables', async () => {
    // User has no saved tables
    mockStorage.getTables.mockResolvedValue([]);
    // But sample tables exist for new users
    mockStorage.getSampleTables.mockResolvedValue([
      {
        id: 'sample-1',
        name: 'Medieval Madness',
        manufacturer: 'Williams',
      },
    ]);

    const { findByText } = render(<ManualEntryScreen />);

    // Sample tables should show as fallback
    await waitFor(() => {
      expect(findByText('Medieval Madness')).toBeTruthy();
    });
  });

  it('should refresh tables when screen regains focus', async () => {
    const firstCallTables = [
      {
        id: 'user-1',
        name: 'Table One',
        manufacturer: 'Williams',
      },
    ];

    const secondCallTables = [
      {
        id: 'user-1',
        name: 'Table One',
        manufacturer: 'Williams',
      },
      {
        id: 'user-2',
        name: 'New Table',
        manufacturer: 'Stern',
      },
    ];

    // First render - one table
    mockStorage.getTables.mockResolvedValueOnce(firstCallTables);
    mockStorage.getSampleTables.mockResolvedValue([]);

    const { rerender, findByText } = render(<ManualEntryScreen />);

    await waitFor(() => {
      expect(findByText('Table One')).toBeTruthy();
    });

    // Simulate returning to screen - getTables called again with updated data
    mockStorage.getTables.mockResolvedValueOnce(secondCallTables);

    // useFocusEffect mock calls callback, which should trigger table reload
    rerender(<ManualEntryScreen />);

    // New table should appear
    await waitFor(() => {
      expect(findByText('New Table')).toBeTruthy();
    });

    // Verify getTables was called twice
    expect(mockStorage.getTables).toHaveBeenCalledTimes(2);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/manual-entry-user-tables.test.tsx
```

Expected output:
```
FAIL __tests__/manual-entry-user-tables.test.tsx
  Manual Entry Screen - User Tables Quick Select
    ✕ should display user tables from getTables when user has saved tables
    ✕ should show sample tables as fallback when user has no saved tables
    ✕ should refresh tables when screen regains focus

Tests: 3 failed, 3 total
```

The tests fail because:
1. Manual entry screen currently calls `getSampleTables()` not `getTables()`
2. No `useFocusEffect` to refresh on screen focus
3. No fallback logic for empty user tables

---

## Task 2: Update Import in Manual Entry Screen

**Files:**
- Modify: `app/manual-entry.tsx:1-16`

**Step 1: Add useFocusEffect import**

In `app/manual-entry.tsx`, update the import from `expo-router`:

```typescript
import { useRouter, useFocusEffect } from 'expo-router';
```

Full updated import section:

```typescript
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { storage } from '@/services/storage';
import { Table } from '@/types';
```

**Step 2: Verify import syntax is correct**

Check that the file compiles:
```bash
npm run type-check
```

Expected: No type errors

---

## Task 3: Update ManualEntryScreen State and Data Loading

**Files:**
- Modify: `app/manual-entry.tsx:18-40`

**Step 1: Replace useEffect + useFocusEffect, rename state variable**

Replace the current `useEffect` hook and loading function with the new implementation:

Old code (lines 27-34):
```typescript
useEffect(() => {
  loadSampleTables();
}, []);

const loadSampleTables = async () => {
  const samples = await storage.getSampleTables();
  setSampleTables(samples);
};
```

New code:

```typescript
// Load tables when screen mounts and whenever it regains focus
useFocusEffect(
  useCallback(() => {
    loadTablesForQuickSelect();
  }, [])
);

const loadTablesForQuickSelect = async () => {
  try {
    // Try to load user's actual saved tables
    const userTables = await storage.getTables();

    if (userTables.length > 0) {
      // Show real user tables
      setSampleTables(userTables);
    } else {
      // Fallback: show sample tables for new users with no saved tables
      const samples = await storage.getSampleTables();
      setSampleTables(samples);
    }
  } catch (error) {
    console.error('Error loading tables for quick select:', error);
    // On error, fall back to sample tables
    const samples = await storage.getSampleTables();
    setSampleTables(samples);
  }
};
```

**Step 2: Verify the function logic**

The logic should:
1. Try to load user tables with `getTables()`
2. If user has tables, use those
3. If user has no tables, fall back to samples
4. If there's an error, fall back to samples

This provides the fallback for new users while prioritizing real data.

---

## Task 4: Run Tests to Verify GREEN Phase

**Files:**
- Test: `__tests__/manual-entry-user-tables.test.tsx`

**Step 1: Run the new tests**

```bash
npm test -- __tests__/manual-entry-user-tables.test.tsx
```

Expected output:
```
PASS __tests__/manual-entry-user-tables.test.tsx
  Manual Entry Screen - User Tables Quick Select
    ✓ should display user tables from getTables when user has saved tables
    ✓ should show sample tables as fallback when user has no saved tables
    ✓ should refresh tables when screen regains focus

Tests: 3 passed, 3 total
```

**Step 2: Run all tests to check for regressions**

```bash
npm test
```

Expected: All tests pass (95+ tests total)

---

## Task 5: Verify Manual Testing Scenarios

**Manual Test Checklist:**

1. **New user scenario:**
   - Install/reset app
   - Go to Enter Score screen
   - Verify 3 sample tables appear in quick select (Medieval Madness, Attack from Mars, The Addams Family)
   - ✓ Expected: Sample tables shown as fallback

2. **User with saved tables:**
   - Save a score with table "My Table 1" (on home screen or via any entry method)
   - Go to Enter Score screen
   - ✓ Expected: "My Table 1" appears in quick select, NOT the hardcoded samples

3. **New table appears on return:**
   - While on Enter Score screen, save a score with "New Table" in another method
   - Return to Enter Score screen (navigate back and forth)
   - ✓ Expected: "New Table" now appears in quick select

4. **Typing hides quick select:**
   - Start typing in table name field
   - ✓ Expected: Quick select chips disappear (existing behavior preserved)

---

## Task 6: Commit Changes

**Step 1: Stage files**

```bash
git add app/manual-entry.tsx __tests__/manual-entry-user-tables.test.tsx
```

**Step 2: Commit**

```bash
git commit -m "fix: show user tables in quick select instead of hardcoded samples

- Replace getSampleTables() with getTables() to fetch real user data
- Add useFocusEffect hook to refresh tables when screen regains focus
- Implement fallback to sample tables only for new users with no saved tables
- Add comprehensive test coverage for all scenarios

Fixes BUGFIX.md: Quick Select Menu Not Auto-Populating with User Tables"
```

**Step 3: Verify commit**

```bash
git log -1 --stat
```

Expected: Shows commit with 2 files changed

---

## Notes for Implementer

### Pattern References
- **useFocusEffect pattern**: Used in `app/index.tsx` (home screen) - copy this pattern
- **getTables pattern**: Used in `app/edit-table.tsx` for loading user tables
- **Fallback pattern**: Handle both old (no tables) and new (has tables) users gracefully

### Testing Notes
- The test mocks `useFocusEffect` to call the callback immediately
- This allows testing the data refresh behavior in unit tests
- Manual testing still required for full screen navigation flow

### Files NOT to modify
- `services/storage.ts` - Keep both `getTables()` and `getSampleTables()` methods
- `types/index.ts` - No type changes needed
- Other screens - Only manual-entry.tsx needs changes

### Why This Approach
1. **Real data priority**: User tables appear as soon as they exist
2. **Graceful fallback**: New users see helpful sample tables
3. **Auto-refresh**: Screen focus triggers reload without user action
4. **Error resilient**: Errors fall back to samples instead of crashing
5. **TDD verified**: All behavior covered by automated tests

---
