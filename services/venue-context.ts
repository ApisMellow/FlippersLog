/**
 * Venue Context Management
 * Handles active venue state and persistence via AsyncStorage
 * ❤️ pinballmap.com
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMachinesAtVenue } from './pinballmap-api';

const VENUE_CONTEXT_KEY = '@flipperslog:active_venue';

export interface ActiveVenue {
  id: number;
  name: string;
  machines: string[]; // List of machine names at this venue
}

export async function setActiveVenue(venueId: number, venueName: string): Promise<void> {
  try {
    // Fetch the list of machines at this venue
    const machines = await getMachinesAtVenue(venueId);
    const venue: ActiveVenue = { id: venueId, name: venueName, machines };
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
