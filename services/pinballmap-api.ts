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
          lng: parseFloat(loc.lon),
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

    // Try 0.5km radius first
    let radiusKm = 0.5;
    let venuesWithDistance = await fetchVenuesWithinRadius(
      locations,
      userLatitude,
      userLongitude,
      radiusKm
    );

    // If no results, expand to 1km
    if (venuesWithDistance.length === 0) {
      radiusKm = 1.0;
      venuesWithDistance = await fetchVenuesWithinRadius(
        locations,
        userLatitude,
        userLongitude,
        radiusKm
      );
    }

    // Sort by distance, limit to 3
    return venuesWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  } catch (error) {
    console.error('Error in getNearbyVenues:', error);
    throw error;
  }
}

async function fetchVenuesWithinRadius(
  locations: LocationData[],
  userLatitude: number,
  userLongitude: number,
  radiusKm: number
): Promise<PinballVenue[]> {
  const venuesWithDistance = await Promise.all(
    locations.map(async (loc) => {
      const distance = calculateDistance(userLatitude, userLongitude, loc.lat, loc.lng);

      if (distance <= radiusKm) {
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

  return venuesWithDistance.filter((v): v is PinballVenue => v !== null);
}

export async function searchVenuesByName(searchQuery: string): Promise<PinballVenue[]> {
  try {
    const locations = await fetchAllLocations();
    const query = searchQuery.toLowerCase().trim();

    // Filter locations by name (case-insensitive, partial match)
    const matchingLocations = locations.filter((loc) =>
      loc.name.toLowerCase().includes(query)
    );

    // Fetch machine counts for matching venues
    const venuesWithMachines = await Promise.all(
      matchingLocations.map(async (loc) => {
        const machineCount = await fetchMachineCount(loc.id);
        return {
          id: loc.id,
          name: loc.name,
          latitude: loc.lat,
          longitude: loc.lng,
          machineCount,
          distance: 0, // Distance is 0 for search results (not GPS-based)
        };
      })
    );

    return venuesWithMachines;
  } catch (error) {
    console.error('Error in searchVenuesByName:', error);
    throw error;
  }
}

export async function getMachinesAtVenue(venueId: number): Promise<string[]> {
  try {
    const machineNames: string[] = [];

    for (const region of WA_REGIONS) {
      const url = `${BASE_URL}/region/${region}/location_machine_xrefs.json`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const xrefs = data.location_machine_xrefs || [];

      // Get all machines at this venue
      const venueMachines = xrefs
        .filter((xref: MachineXref) => xref.location_id === venueId)
        .map((xref: MachineXref) => xref.machine.name);

      machineNames.push(...venueMachines);
    }

    return machineNames;
  } catch (error) {
    console.error(`Error fetching machines for venue ${venueId}:`, error);
    return [];
  }
}
