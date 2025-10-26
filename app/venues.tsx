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
        setError('No pinball venues nearby within 0.5km. Try moving or expand your search.');
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
