import { View, Text, StyleSheet, Image, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { storage } from '@/services/storage';
import { getActiveVenue } from '@/services/venue-context';

export default function ReviewScore() {
  const params = useLocalSearchParams<{
    photoUri: string;
    detectedScore: string;
    detectedTableName?: string;
    confidence: string;
  }>();

  const router = useRouter();

  const score = parseInt(params.detectedScore, 10);
  const tableName = params.detectedTableName;
  const confidence = parseFloat(params.confidence);
  const isLowConfidence = confidence < 0.5;

  const handleAccept = async () => {
    // If no table name detected, force user to enter one
    if (!tableName || !tableName.trim()) {
      router.push({
        pathname: '/edit-table',
        params: {
          detectedScore: params.detectedScore,
          detectedTableName: '',
          photoUri: params.photoUri,
        },
      });
      return;
    }

    try {
      // Get active venue if set
      const activeVenue = await getActiveVenue();

      await storage.addScore({
        score,
        tableName: tableName,
        date: new Date().toISOString(),
        photoUri: params.photoUri,
        venueId: activeVenue?.id,
      });
      router.push('/');
    } catch (error) {
      Alert.alert('Error', 'Failed to save score');
    }
  };

  const handleWrongScore = () => {
    router.push({
      pathname: '/edit-score',
      params: {
        detectedScore: params.detectedScore,
        detectedTableName: tableName,
        photoUri: params.photoUri,
      },
    });
  };

  const handleWrongName = () => {
    router.push({
      pathname: '/edit-table',
      params: {
        detectedScore: params.detectedScore,
        detectedTableName: tableName,
        photoUri: params.photoUri,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Photo */}
      <Image
        source={{ uri: params.photoUri }}
        style={styles.photo}
        resizeMode="cover"
      />

      {/* Detection Results */}
      <View style={styles.resultsCard}>
        {isLowConfidence && (
          <Text style={styles.warningText}>⚠️ Low confidence detection - please verify carefully</Text>
        )}

        <Text style={styles.label}>Detected Score:</Text>
        <Text style={styles.score}>{score.toLocaleString()}</Text>

        <Text style={styles.label}>Table:</Text>
        <Text style={styles.tableName}>
          {tableName || 'Not detected'}
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable style={styles.acceptButton} onPress={handleAccept}>
          <Text style={styles.acceptButtonText}>Accept ✓</Text>
        </Pressable>

        <View style={styles.editButtons}>
          <Pressable style={styles.editButton} onPress={handleWrongScore}>
            <Text style={styles.editButtonText}>Wrong Score</Text>
          </Pressable>

          <Pressable style={styles.editButton} onPress={handleWrongName}>
            <Text style={styles.editButtonText}>Wrong Name</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#3B4F6B',
  },
  photo: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    borderRadius: 10,
    marginVertical: 20,
  },
  resultsCard: {
    backgroundColor: '#2E3E52',
    padding: 20,
    borderRadius: 10,
    marginVertical: 10,
  },
  warningText: {
    color: '#ff6b6b',
    marginBottom: 10,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 10,
  },
  score: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E8EEF5',
  },
  tableName: {
    fontSize: 18,
    color: '#E8EEF5',
  },
  buttonContainer: {
    marginTop: 20,
  },
  acceptButton: {
    backgroundColor: '#6BA3D4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#495A73',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#A0AEC0',
    fontSize: 14,
  },
});
