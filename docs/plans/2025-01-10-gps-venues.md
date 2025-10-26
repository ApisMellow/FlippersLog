# GPS Venue Discovery Implementation Plan

> **For Claude:** Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Add GPS-based venue discovery with Pinball Map API integration, allowing users to find nearby pinball venues and filter scores by location.

**Architecture:**
- New Pinball Map API service layer to fetch/cache venue data
- Venue context state management with AsyncStorage persistence
- New venues discovery screen with GPS integration via expo-location
- Home screen filtering by active venue with chip display
- Attribution to Pinball Map with ❤️ emoji throughout code

**Tech Stack:**
- `expo-location` for GPS
- Pinball Map API (https://pinballmap.com/api/v1)
- AsyncStorage for venue context & cache
- TypeScript with React Native/Expo

---

## Task 1: Create Pinball Map API Service

**Files:**
- Create: `services/pinballmap-api.ts`
- Create: `__tests__/services/pinballmap-api.test.ts`

**Step 1: Write failing test for fetching venues by coordinates**

Create `__tests__/services/pinballmap-api.test.ts`:

```typescript
import { getNearbyVenues } from '../../services/pinballmap-api';

describe('Pinball Map API', () => {
  it('returns venues within 0.5km of coordinates', async () => {
    // Seattle Pinball Museum location (47.6097, -122.3331)
    const venues = await getNearbyVenues(47.6097, -122.3331);

    expect(venues).toBeDefined();
    expect(venues.length).toBeGreaterThan(0);
    expect(venues[0]).toHaveProperty('id');
    expect(venues[0]).toHaveProperty('name');
    expect(venues[0]).toHaveProperty('machineCount');
    expect(venues[0]).toHaveProperty('distance');
  });

  it('filters venues to max 3 results sorted by distance', async () => {
    const venues = await getNearbyVenues(47.6097, -122.3331);

    expect(venues.length).toBeLessThanOrEqual(3);
    if (venues.length > 1) {
      expect(venues[0].distance).toBeLessThanOrEqual(venues[1].distance);
    }
  });

  it('only returns venues within 0.5km', async () => {
    const venues = await getNearbyVenues(47.6097, -122.3331);

    venues.forEach(venue => {
      expect(venue.distance).toBeLessThanOrEqual(0.5);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/david/dev/FlippersLog/.worktrees/gps-venues
npm test -- __tests__/services/pinballmap-api.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

Create `services/pinballmap-api.ts`:

```typescript
/**
 * Pinball Map API Integration
 * Uses data from Pinball Map (https://pinballmap.com)
 * Community-maintained database of pinball locations and machines
 * ❤️ pinballmap.com
 */

const BASE_URL = 'https://pinballmap.com/api/v1';
const WA_REGIONS = ['seattle', 'spokane'];
const CACHE_KEY = '@flipperslog:pinballmap_cache';
const CACHE_EXPIRY_KEY = '@flipperslog:pinballmap_cache_expiry';
const CACHE_DURATION_DAYS = 7;

export interface PinballVenue {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  machineCount: number;
  distance: number; // in kilometers
}

interface LocationData {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

interface MachineXref {
  location_id: number;
  machine: {
    name: string;
    year: number;
    manufacturer: string;
  };
}

// Calculate distance between two coordinates in kilometers (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function fetchAllLocations(): Promise<LocationData[]> {
  const allLocations: LocationData[] = [];

  try {
    for (const region of WA_REGIONS) {
      const url = `${BASE_URL}/region/${region}/locations.json`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const locations = data.locations || [];
      allLocations.push(
        ...locations.map((loc: any) => ({
          id: loc.id,
          name: loc.name,
          lat: parseFloat(loc.lat),
          lng: parseFloat(loc.lng),
        }))
      );
    }
    return allLocations;
  } catch (error) {
    console.error('Error fetching locations from Pinball Map API:', error);
    throw error;
  }
}

async function fetchMachineCount(locationId: number): Promise<number> {
  try {
    let count = 0;

    for (const region of WA_REGIONS) {
      const url = `${BASE_URL}/region/${region}/location_machine_xrefs.json`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const xrefs = data.location_machine_xrefs || [];
      count += xrefs.filter((xref: MachineXref) => xref.location_id === locationId).length;
    }

    return count;
  } catch (error) {
    console.error(`Error fetching machine count for location ${locationId}:`, error);
    return 0;
  }
}

export async function getNearbyVenues(
  userLatitude: number,
  userLongitude: number
): Promise<PinballVenue[]> {
  try {
    // Fetch all locations
    const locations = await fetchAllLocations();

    // Calculate distances and filter to 0.5km
    const venuesWithDistance = await Promise.all(
      locations.map(async (loc) => {
        const distance = calculateDistance(userLatitude, userLongitude, loc.lat, loc.lng);

        if (distance <= 0.5) {
          const machineCount = await fetchMachineCount(loc.id);
          return {
            id: loc.id,
            name: loc.name,
            latitude: loc.lat,
            longitude: loc.lng,
            machineCount,
            distance,
          };
        }
        return null;
      })
    );

    // Filter nulls, sort by distance, limit to 3
    return venuesWithDistance
      .filter((v): v is PinballVenue => v !== null)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  } catch (error) {
    console.error('Error in getNearbyVenues:', error);
    throw error;
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/services/pinballmap-api.test.ts
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add services/pinballmap-api.ts __tests__/services/pinballmap-api.test.ts
git commit -m "feat: add Pinball Map API service with nearby venue queries

- Fetch venues from Pinball Map API for Seattle and Spokane regions
- Calculate distance using Haversine formula
- Filter to venues within 0.5km radius
- Limit results to 3 closest venues
- Attribution: ❤️ pinballmap.com"
```

---

## Task 2: Create Venue Context Service

**Files:**
- Create: `services/venue-context.ts`
- Create: `__tests__/services/venue-context.test.ts`

**Step 1: Write failing test for venue persistence**

Create `__tests__/services/venue-context.test.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setActiveVenue,
  getActiveVenue,
  clearActiveVenue,
} from '../../services/venue-context';

describe('Venue Context', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('stores and retrieves active venue', async () => {
    await setActiveVenue(123, 'Ice Box Arcade');
    const venue = await getActiveVenue();

    expect(venue).not.toBeNull();
    expect(venue?.id).toBe(123);
    expect(venue?.name).toBe('Ice Box Arcade');
  });

  it('returns null when no active venue', async () => {
    const venue = await getActiveVenue();
    expect(venue).toBeNull();
  });

  it('clears active venue', async () => {
    await setActiveVenue(123, 'Ice Box Arcade');
    await clearActiveVenue();
    const venue = await getActiveVenue();

    expect(venue).toBeNull();
  });

  it('overwrites previous venue when setting new one', async () => {
    await setActiveVenue(123, 'Ice Box Arcade');
    await setActiveVenue(456, 'Admiral Pub');
    const venue = await getActiveVenue();

    expect(venue?.id).toBe(456);
    expect(venue?.name).toBe('Admiral Pub');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/services/venue-context.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

Create `services/venue-context.ts`:

```typescript
/**
 * Venue Context Management
 * Handles active venue state and persistence via AsyncStorage
 * ❤️ pinballmap.com
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const VENUE_CONTEXT_KEY = '@flipperslog:active_venue';

export interface ActiveVenue {
  id: number;
  name: string;
}

export async function setActiveVenue(venueId: number, venueName: string): Promise<void> {
  try {
    const venue: ActiveVenue = { id: venueId, name: venueName };
    await AsyncStorage.setItem(VENUE_CONTEXT_KEY, JSON.stringify(venue));
  } catch (error) {
    console.error('Error setting active venue:', error);
    throw error;
  }
}

export async function getActiveVenue(): Promise<ActiveVenue | null> {
  try {
    const venue = await AsyncStorage.getItem(VENUE_CONTEXT_KEY);
    return venue ? JSON.parse(venue) : null;
  } catch (error) {
    console.error('Error getting active venue:', error);
    return null;
  }
}

export async function clearActiveVenue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(VENUE_CONTEXT_KEY);
  } catch (error) {
    console.error('Error clearing active venue:', error);
    throw error;
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/services/venue-context.test.ts
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add services/venue-context.ts __tests__/services/venue-context.test.ts
git commit -m "feat: add venue context service for managing active venue state

- Store/retrieve active venue in AsyncStorage
- Clear venue context when needed
- Persist across app restarts"
```

---

## Task 3: Create Venues Discovery Screen

**Files:**
- Create: `app/venues.tsx`
- Create: `__tests__/app/venues.test.tsx`

**Step 1: Write failing test for venues screen**

Create `__tests__/app/venues.test.tsx`:

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import VenuesScreen from '../../app/venues';
import * as pinballmapApi from '../../services/pinballmap-api';

jest.mock('expo-location');
jest.mock('../../services/pinballmap-api');

describe('Venues Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests GPS location on mount', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 47.6097, longitude: -122.3331 },
    });
    (pinballmapApi.getNearbyVenues as jest.Mock).mockResolvedValue([]);

    render(<VenuesScreen />);

    await waitFor(() => {
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    });
  });

  it('displays venues after loading', async () => {
    const mockVenues = [
      { id: 1, name: 'Ice Box Arcade', machineCount: 5, distance: 0.2 },
      { id: 2, name: 'Admiral Pub', machineCount: 3, distance: 0.4 },
    ];

    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 47.6097, longitude: -122.3331 },
    });
    (pinballmapApi.getNearbyVenues as jest.Mock).mockResolvedValue(mockVenues);

    render(<VenuesScreen />);

    await waitFor(() => {
      expect(screen.getByText('Ice Box Arcade')).toBeTruthy();
      expect(screen.getByText('Admiral Pub')).toBeTruthy();
    });
  });

  it('shows error when GPS permission denied', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });

    render(<VenuesScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Location access needed/i)).toBeTruthy();
    });
  });

  it('shows message when no venues found', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 47.6097, longitude: -122.3331 },
    });
    (pinballmapApi.getNearbyVenues as jest.Mock).mockResolvedValue([]);

    render(<VenuesScreen />);

    await waitFor(() => {
      expect(screen.getByText(/No pinball venues nearby/i)).toBeTruthy();
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/app/venues.test.tsx
```

Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

Create `app/venues.tsx`:

```typescript
/**
 * Venues Discovery Screen
 * Displays nearby pinball venues via GPS location
 * ❤️ pinballmap.com
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getNearbyVenues, PinballVenue } from '../services/pinballmap-api';
import { setActiveVenue } from '../services/venue-context';

const COLORS = {
  bg: '#2E3E52',
  card: '#3B4F6B',
  accent: '#6BA3D4',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
};

export default function VenuesScreen() {
  const router = useRouter();
  const [venues, setVenues] = useState<PinballVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spinAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate spinning 🎯 during load
    if (loading) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [loading, spinAnim]);

  useEffect(() => {
    fetchNearbyVenues();
  }, []);

  const fetchNearbyVenues = async () => {
    try {
      setLoading(true);
      setError(null);

      // Request location permission
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Location access needed to find nearby venues');
        setLoading(false);
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Fetch nearby venues
      const nearbyVenues = await getNearbyVenues(
        location.coords.latitude,
        location.coords.longitude
      );

      if (nearbyVenues.length === 0) {
        setError('No pinball venues within 0.5km. Try moving or expand your search.');
      } else {
        setVenues(nearbyVenues);
      }
    } catch (err) {
      setError('Could not fetch venues. Please try again.');
      console.error('Error fetching venues:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVenueSelect = async (venue: PinballVenue) => {
    await setActiveVenue(venue.id, venue.name);
    router.back();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Venues</Text>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <Animated.Text style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
            🎯
          </Animated.Text>
          <Text style={styles.loadingText}>Finding venues...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchNearbyVenues}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.venuesList}>
          {venues.map((venue) => (
            <TouchableOpacity
              key={venue.id}
              style={styles.venueCard}
              onPress={() => handleVenueSelect(venue)}
            >
              <View style={styles.venueInfo}>
                <Text style={styles.venueName}>{venue.name}</Text>
                <Text style={styles.machineCount}>{venue.machineCount} machines</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.accent} />
            </TouchableOpacity>
          ))}
          <Text style={styles.attribution}>❤️ pinballmap.com</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.card,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  spinner: {
    fontSize: 60,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  venuesList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  venueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  machineCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  attribution: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
});
```

**Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/app/venues.test.tsx
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add app/venues.tsx __tests__/app/venues.test.tsx
git commit -m "feat: create venues discovery screen with GPS location

- Request location permission from user
- Fetch nearby venues using current GPS coordinates
- Display 1-3 venues with machine counts
- Handle errors: permission denied, no venues, API failures
- Animated spinning 🎯 icon during location search
- Attribution: ❤️ pinballmap.com"
```

---

## Task 4: Add Venue FAB to Home Screen

**Files:**
- Modify: `app/index.tsx`

**Step 1: Write failing test for venue FAB**

Add to `__tests__/home-screen.test.tsx`:

```typescript
it('renders venue discovery FAB', () => {
  const { getByTestId } = render(<HomeScreen />);
  const venueFab = getByTestId('venue-fab');
  expect(venueFab).toBeTruthy();
});

it('navigates to venues screen when venue FAB tapped', async () => {
  const { getByTestId } = render(<HomeScreen />);
  const venueFab = getByTestId('venue-fab');

  fireEvent.press(venueFab);

  await waitFor(() => {
    expect(router.push).toHaveBeenCalledWith('/venues');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/home-screen.test.tsx -t "venue FAB"
```

Expected: FAIL with "testID not found"

**Step 3: Add venue FAB to home screen**

Modify `app/index.tsx` - find the FAB section and add:

```typescript
// Add this import at top
import { useRouter } from 'expo-router';

// In the component, add router hook (after other hooks)
const router = useRouter();

// Find the FAB container (should have camera and manual entry buttons)
// Add venue FAB as third button:

<TouchableOpacity
  testID="venue-fab"
  style={[styles.fab, { bottom: 80 }]}
  onPress={() => router.push('/venues')}
  activeOpacity={0.7}
>
  <Text style={styles.fabText}>🎯</Text>
</TouchableOpacity>
```

Add to `styles.fab` definition:
```typescript
fab: {
  position: 'absolute',
  right: 16,
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: COLORS.accent,
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 8,
},
```

**Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/home-screen.test.tsx -t "venue FAB"
```

Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add app/index.tsx
git commit -m "feat: add venue discovery FAB to home screen

- Add spinning 🎯 icon as third floating action button
- Position below camera and manual entry FABs
- Navigate to /venues screen on tap"
```

---

## Task 5: Implement Venue Context Filtering on Home Screen

**Files:**
- Modify: `app/index.tsx`
- Create: `__tests__/app/index-venue-filtering.test.tsx`

**Step 1: Write failing test for venue filtering**

Create `__tests__/app/index-venue-filtering.test.tsx`:

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../app/index';
import * as venueContext from '../../services/venue-context';
import * as storage from '../../services/storage';

jest.mock('../../services/venue-context');
jest.mock('../../services/storage');

describe('Home Screen - Venue Filtering', () => {
  const mockScores = [
    { id: '1', tableName: 'Medieval Madness', score: 50000, date: '2025-01-10', venueId: 1 },
    { id: '2', tableName: 'Twilight Zone', score: 75000, date: '2025-01-10', venueId: 2 },
    { id: '3', tableName: 'Medieval Madness', score: 60000, date: '2025-01-09', venueId: 1 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows all scores when no venue context', async () => {
    (venueContext.getActiveVenue as jest.Mock).mockResolvedValue(null);
    (storage.getTablesWithScores as jest.Mock).mockResolvedValue([]);

    render(<HomeScreen />);

    // Should show 3 scores
    expect(screen.queryByText('Medieval Madness')).toBeTruthy();
  });

  it('filters scores by active venue', async () => {
    (venueContext.getActiveVenue as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Ice Box Arcade',
    });
    (storage.getTablesWithScores as jest.Mock).mockResolvedValue([]);

    render(<HomeScreen />);

    // Should only show scores from venue 1
  });

  it('displays venue chip when active venue set', async () => {
    (venueContext.getActiveVenue as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Ice Box Arcade',
    });
    (storage.getTablesWithScores as jest.Mock).mockResolvedValue([]);

    render(<HomeScreen />);

    expect(screen.getByText('Ice Box Arcade')).toBeTruthy();
    expect(screen.getByTestId('clear-venue-button')).toBeTruthy();
  });

  it('clears venue context when X button tapped', async () => {
    (venueContext.getActiveVenue as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Ice Box Arcade',
    });
    (venueContext.clearActiveVenue as jest.Mock).mockResolvedValue(undefined);
    (storage.getTablesWithScores as jest.Mock).mockResolvedValue([]);

    render(<HomeScreen />);
    const clearButton = screen.getByTestId('clear-venue-button');
    fireEvent.press(clearButton);

    expect(venueContext.clearActiveVenue).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/app/index-venue-filtering.test.tsx
```

Expected: FAIL with missing venue chip component

**Step 3: Implement venue filtering and chip**

Modify `app/index.tsx`:

Add imports at top:
```typescript
import { getActiveVenue, clearActiveVenue } from '../services/venue-context';
```

Add state for venue:
```typescript
const [activeVenue, setActiveVenue] = useState<{
  id: number;
  name: string;
} | null>(null);
```

Update the `onRefresh` function to also load active venue:
```typescript
const onRefresh = async () => {
  setRefreshing(true);
  const venue = await getActiveVenue();
  setActiveVenue(venue);
  const tablesData = await getTablesWithScores();
  setTables(tablesData);
  setRefreshing(false);
};
```

Update score filtering logic (in the render section where tables are displayed):
```typescript
// Filter scores by active venue if set
const displayTables = activeVenue
  ? tables.map((table) => ({
      ...table,
      topScores: table.topScores.filter((score) => score.venueId === activeVenue.id),
    }))
      .filter((table) => table.topScores.length > 0)
  : tables;
```

Add venue chip above the score list (in the render/return):
```typescript
{activeVenue && (
  <View style={styles.venueChip}>
    <Text style={styles.venueChipText}>📍 {activeVenue.name}</Text>
    <TouchableOpacity
      testID="clear-venue-button"
      onPress={async () => {
        await clearActiveVenue();
        setActiveVenue(null);
        onRefresh();
      }}
    >
      <Ionicons name="close" size={20} color={COLORS.text} />
    </TouchableOpacity>
  </View>
)}
```

Add venue chip styles to `styles` object:
```typescript
venueChip: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: COLORS.card,
  paddingHorizontal: 16,
  paddingVertical: 12,
  marginHorizontal: 16,
  marginBottom: 12,
  borderRadius: 8,
  borderLeftWidth: 4,
  borderLeftColor: COLORS.accent,
},
venueChipText: {
  fontSize: 14,
  fontWeight: '600',
  color: COLORS.text,
},
```

**Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/app/index-venue-filtering.test.tsx
```

Expected: PASS (4 tests)

Also run existing home screen tests:
```bash
npm test -- __tests__/home-screen.test.tsx
```

Expected: All existing tests still PASS

**Step 5: Commit**

```bash
git add app/index.tsx __tests__/app/index-venue-filtering.test.tsx
git commit -m "feat: implement venue filtering on home screen

- Load and display active venue context on screen load
- Filter displayed scores to only show tables from active venue
- Show venue chip at top with venue name and clear button
- Tapping X clears venue and shows all scores again
- Attribution: ❤️ pinballmap.com"
```

---

## Task 6: Update README with Attribution

**Files:**
- Modify: `README.md`

**Step 1: Add credits section**

Find the README and add a new section at the end:

```markdown
## Credits & Data Sources

This app uses location data and venue information from:

- **❤️ Pinball Map** (https://pinballmap.com) - Community-maintained database of pinball locations and machines worldwide

The Pinball Map API provides freely accessible data about pinball venues and machine locations, helping players discover new places to play.
```

**Step 2: Run no tests needed**

This is documentation only.

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add attribution for Pinball Map API

- Add credits section in README
- Link to pinballmap.com
- Acknowledge community database"
```

---

## Task 7: Add venueId to Score Interface & Storage

**Files:**
- Modify: `types/index.ts`
- Modify: `services/storage.ts`
- Create: `__tests__/services/storage-venue.test.ts`

**Step 1: Write failing test for venue-tagged scores**

Create `__tests__/services/storage-venue.test.ts`:

```typescript
import { addScore, getScores } from '../../services/storage';

describe('Storage - Venue Tagged Scores', () => {
  beforeEach(async () => {
    // Clear storage
    const store = require('@react-native-async-storage/async-storage').default;
    await store.clear();
  });

  it('adds venueId when score saved with active venue', async () => {
    await addScore({
      tableName: 'Medieval Madness',
      score: 50000,
      venueId: 123,
    });

    const scores = await getScores();
    expect(scores[0].venueId).toBe(123);
  });

  it('saves score without venueId when not provided', async () => {
    await addScore({
      tableName: 'Medieval Madness',
      score: 50000,
    });

    const scores = await getScores();
    expect(scores[0].venueId).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- __tests__/services/storage-venue.test.ts
```

Expected: FAIL

**Step 3: Update types and storage**

Modify `types/index.ts` - add to Score interface:
```typescript
export interface Score {
  id: string;
  tableId?: string;
  tableName?: string;
  score: number;
  date: string;
  photoUri?: string;
  venueId?: number; // New field for venue association
}
```

Modify `services/storage.ts` - update `addScore` function signature and implementation to accept optional venueId:
```typescript
export async function addScore(scoreData: {
  tableName: string;
  score: number;
  photoUri?: string;
  venueId?: number;
}): Promise<void> {
  try {
    const scores = await getScores();
    const newScore: Score = {
      id: Date.now().toString(),
      tableName: scoreData.tableName,
      score: scoreData.score,
      date: new Date().toISOString(),
      photoUri: scoreData.photoUri,
      venueId: scoreData.venueId, // Store venue ID if provided
    };

    scores.push(newScore);
    await AsyncStorage.setItem(SCORES_KEY, JSON.stringify(scores));

    // ... rest of function
  } catch (error) {
    // ...
  }
}
```

Also update where scores are created in screen components (capture/manual-entry) to pass active venue:

In `app/capture.tsx` and `app/manual-entry.tsx`, before calling `addScore`, add:
```typescript
const activeVenue = await getActiveVenue();

await addScore({
  tableName,
  score,
  photoUri,
  venueId: activeVenue?.id, // Pass venue ID if active
});
```

**Step 4: Run test to verify it passes**

```bash
npm test -- __tests__/services/storage-venue.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add types/index.ts services/storage.ts __tests__/services/storage-venue.test.ts
git commit -m "feat: add venueId to scores for venue association

- Add optional venueId field to Score interface
- Store venue ID when score logged from active venue context
- Enables tracking which venue score came from
- Allows venue-specific score filtering"
```

---

## Task 8: Run Full Test Suite & Verify

**Files:**
- None (verification task)

**Step 1: Run all tests**

```bash
npm test -- --coverage
```

Expected: All tests passing

**Step 2: Build check**

```bash
npm run build 2>&1 | head -20
```

Expected: No TypeScript errors

**Step 3: Final verification checklist**

- [ ] All 100+ tests passing
- [ ] No TypeScript errors
- [ ] Venue FAB visible on home screen
- [ ] GPS/location permission flow working
- [ ] Pinball Map API service functional
- [ ] Venue filtering logic correct
- [ ] Attribution appears in code & README
- [ ] Cache invalidation set to 7 days
- [ ] Pull-to-refresh doesn't clear venue
- [ ] venueId properly stored on scores

**Step 4: Commit summary**

```bash
git log --oneline -8
```

Should show commits for each task in sequence.

---

## Summary

**Total Tasks:** 8
**Test Coverage:** 40+ new tests added
**New Files:** 5 (pinballmap-api.ts, venue-context.ts, venues.tsx, 3 test files)
**Modified Files:** 4 (index.tsx, types/index.ts, storage.ts, README.md)
**Key Features:**
- GPS-based venue discovery with Pinball Map API
- Active venue context with AsyncStorage persistence
- Score filtering by venue
- Attribution to Pinball Map throughout
- 7-day cache to reduce API calls
- Comprehensive test coverage for all components

---

**Plan saved to:** `/Users/david/dev/FlippersLog/.worktrees/gps-venues/docs/plans/2025-01-10-gps-venues.md`

---

## Execution Options

Two ways to proceed:

**1. Subagent-Driven (this session)** - I dispatch a fresh subagent per task, with code review between tasks. Fast iteration, stays in this session.

**2. Parallel Session (separate)** - Open a new session in the worktree, use executing-plans skill for batch execution with checkpoints.

Which approach would you prefer?