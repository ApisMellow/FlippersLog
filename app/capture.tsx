import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { aiVision } from '@/services/ai-vision';
import { storage } from '@/services/storage';

export default function CaptureScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#999" />
          <Text style={styles.permissionText}>Camera permission required</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        setPhoto(photo.uri);
      }
    }
  };

  const pickFromLibrary = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant photo library access to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
  };

  const analyzePhoto = async () => {
    if (!photo) return;

    setAnalyzing(true);
    try {
      const result = await aiVision.analyzePhoto(photo);

      // Save the table if it doesn't exist
      const table = await storage.saveTable({
        name: result.tableName || 'Unknown Table',
        manufacturer: result.manufacturer,
      });

      // Save the score
      await storage.saveScore({
        tableId: table.id,
        score: result.score,
        date: new Date().toISOString(),
        photoUri: photo,
      });

      const message = result.isMockData
        ? `⚠️ Using Test Data\n\n${result.tableName}\nScore: ${result.score.toLocaleString()}\n\nThis is mock data. To use real AI analysis, add your API key in settings.`
        : `${result.tableName}\nScore: ${result.score.toLocaleString()}`;

      Alert.alert(
        result.isMockData ? 'Test Data Saved' : 'Score Saved!',
        message,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze photo. Please try again or enter manually.');
    } finally {
      setAnalyzing(false);
    }
  };

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View style={styles.container}>
      {!photo ? (
        <>
          <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
            <View style={styles.cameraOverlay}>
              <View style={styles.guidebox}>
                <Text style={styles.guideText}>Frame the score display</Text>
              </View>
            </View>
          </CameraView>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton} onPress={pickFromLibrary}>
              <Ionicons name="images" size={32} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
              <Ionicons name="camera-reverse" size={32} color="white" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo }} style={styles.preview} />
          {analyzing && (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.analyzingText}>
                {photo ? 'Analyzing photo with AI...' : 'Processing...'}
              </Text>
              <Text style={styles.analyzingSubtext}>
                This may take a few seconds
              </Text>
            </View>
          )}
          <View style={styles.previewControls}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={retakePhoto}
              disabled={analyzing}
            >
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={analyzePhoto}
              disabled={analyzing}
            >
              <Text style={styles.buttonText}>
                {analyzing ? 'Analyzing...' : 'Use Photo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guidebox: {
    width: '80%',
    height: 200,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 12,
    justifyContent: 'flex-end',
    padding: 16,
  },
  guideText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'black',
  },
  controlButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: 'black',
  },
  previewContainer: {
    flex: 1,
  },
  preview: {
    flex: 1,
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 16,
  },
  analyzingSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'black',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 140,
  },
  buttonSecondary: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
