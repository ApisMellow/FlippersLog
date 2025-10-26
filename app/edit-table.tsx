import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { storage } from '@/services/storage';
import { getActiveVenue } from '@/services/venue-context';

interface Table {
  id: string;
  name: string;
}

export default function EditTable() {
  const params = useLocalSearchParams<{
    scoreId?: string;
    detectedScore?: string;
    detectedTableName?: string;
    photoUri?: string;
  }>();

  const router = useRouter();
  const isEditMode = !!params.scoreId;

  const [tableName, setTableName] = useState(params.detectedTableName || '');
  const [score, setScore] = useState(params.detectedScore || '');
  const [photoUri, setPhotoUri] = useState(params.photoUri);
  const [existingTables, setExistingTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load existing score if in edit mode
      if (params.scoreId) {
        const existingScore = await storage.getScoreById(params.scoreId);
        if (existingScore) {
          setScore(existingScore.score.toString());
          setTableName(existingScore.tableName || '');
          setPhotoUri(existingScore.photoUri);
        }
      }

      // Load existing tables
      const tables = await storage.getTables();
      setExistingTables(tables);
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tableName.trim()) {
      Alert.alert('Error', 'Table name cannot be empty');
      return;
    }

    try {
      if (isEditMode) {
        await storage.updateScore(params.scoreId!, { tableName: tableName.trim() });
      } else {
        // Get active venue if set
        const activeVenue = await getActiveVenue();

        await storage.addScore({
          score: parseInt(score, 10),
          tableName: tableName.trim(),
          date: new Date().toISOString(),
          photoUri,
          venueId: activeVenue?.id,
        });
      }
      router.push('/');
    } catch (error) {
      Alert.alert('Error', 'Failed to save');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSelectTable = (name: string) => {
    setTableName(name);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{isEditMode ? 'Edit Table Name' : 'Correct Table Name'}</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Score: {parseInt(score, 10).toLocaleString()}</Text>

        <Text style={styles.label}>Table Name:</Text>
        <TextInput
          style={styles.input}
          value={tableName}
          onChangeText={setTableName}
          placeholder="Enter table name"
          autoCapitalize="words"
        />

        {existingTables.length > 0 && (
          <View style={styles.quickSelect}>
            <Text style={styles.quickSelectLabel}>Quick Select:</Text>
            {existingTables
              .filter(table =>
                table.name.toLowerCase().includes(tableName.toLowerCase())
              )
              .map((table) => (
                <Pressable
                  key={table.id}
                  style={styles.tableOption}
                  onPress={() => handleSelectTable(table.name)}
                >
                  <Text style={styles.tableOptionText}>{table.name}</Text>
                </Pressable>
              ))}
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#3B4F6B',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#E8EEF5',
  },
  form: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#A0AEC0',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#495A73',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    marginBottom: 15,
    backgroundColor: '#2E3E52',
    color: '#E8EEF5',
  },
  quickSelect: {
    marginTop: 10,
  },
  quickSelectLabel: {
    fontSize: 14,
    color: '#A0AEC0',
    marginBottom: 8,
  },
  tableOption: {
    backgroundColor: '#2E3E52',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableOptionText: {
    fontSize: 16,
    color: '#E8EEF5',
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 30,
  },
  saveButton: {
    backgroundColor: '#6BA3D4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#495A73',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#A0AEC0',
    fontSize: 16,
  },
});
