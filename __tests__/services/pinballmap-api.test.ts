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
