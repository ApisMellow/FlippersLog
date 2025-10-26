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
