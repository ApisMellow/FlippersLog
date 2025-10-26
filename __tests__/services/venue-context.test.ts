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
