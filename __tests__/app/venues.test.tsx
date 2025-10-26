import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import VenuesScreen from '../../app/venues';
import * as pinballmapApi from '../../services/pinballmap-api';
import * as venueContext from '../../services/venue-context';
import { useRouter } from 'expo-router';

jest.mock('expo-location');
jest.mock('../../services/pinballmap-api');
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));
jest.mock('../../services/venue-context');

describe('Venues Screen', () => {
  const mockRouter = {
    back: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
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

  it('calls setActiveVenue and router.back when venue is tapped', async () => {
    const mockVenues = [
      { id: 1, name: 'Ice Box Arcade', machineCount: 5, distance: 0.2 },
    ];

    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 47.6097, longitude: -122.3331 },
    });
    (pinballmapApi.getNearbyVenues as jest.Mock).mockResolvedValue(mockVenues);
    (venueContext.setActiveVenue as jest.Mock).mockResolvedValue(undefined);

    render(<VenuesScreen />);

    await waitFor(() => {
      expect(screen.getByText('Ice Box Arcade')).toBeTruthy();
    });

    // Press the venue name - the event will bubble up to the TouchableOpacity
    const venueName = screen.getByText('Ice Box Arcade');
    fireEvent.press(venueName);

    await waitFor(() => {
      expect(venueContext.setActiveVenue).toHaveBeenCalledWith(1, 'Ice Box Arcade');
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  it('shows error message and retry button when API call fails', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 47.6097, longitude: -122.3331 },
    });
    (pinballmapApi.getNearbyVenues as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    render(<VenuesScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Could not fetch venues/i)).toBeTruthy();
      expect(screen.getByText('Try Again')).toBeTruthy();
    });
  });

  it('retries fetching venues when Try Again button is pressed', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 47.6097, longitude: -122.3331 },
    });

    // First call fails, second succeeds
    (pinballmapApi.getNearbyVenues as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce([
        { id: 1, name: 'Ice Box Arcade', machineCount: 5, distance: 0.2 },
      ]);

    render(<VenuesScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Could not fetch venues/i)).toBeTruthy();
    });

    const retryButton = screen.getByText('Try Again');
    fireEvent.press(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Ice Box Arcade')).toBeTruthy();
    });
  });
});
