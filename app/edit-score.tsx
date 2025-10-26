import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Image, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { storage } from '@/services/storage';

export default function EditScore() {
  const params = useLocalSearchParams<{
    scoreId?: string;
    detectedScore?: string;
    detectedTableName?: string;
    photoUri?: string;
  }>();

  const router = useRouter();
  const isEditMode = !!params.scoreId;

  const [score, setScore] = useState(params.detectedScore || '');
  const [tableName, setTableName] = useState(params.detectedTableName || '');
  const [photoUri, setPhotoUri] = useState(params.photoUri);
  const [loading, setLoading] = useState(isEditMode);
  const [allTables, setAllTables] = useState<Array<{ id: string; name: string }>>([]);
  const [filteredTables, setFilteredTables] = useState<Array<{ id: string; name: string }>>([]);
  const [tableInputActive, setTableInputActive] = useState(false);

  useEffect(() => {
    if (params.scoreId) {
      loadExistingScore();
    }
    loadTables();
  }, [params.scoreId]);

  const loadExistingScore = async () => {
    try {
      const existingScore = await storage.getScoreById(params.scoreId!);
      if (existingScore) {
        setScore(existingScore.score.toString());
        setTableName(existingScore.tableName || '');
        setPhotoUri(existingScore.photoUri);
      }
      setLoading(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to load score');
      setLoading(false);
    }
  };

  const loadTables = async () => {
    try {
      const tables = await storage.getTables();
      setAllTables(tables);
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const handleSave = async () => {
    const scoreValue = parseInt(score, 10);

    // Validate score
    if (!scoreValue || scoreValue <= 0) {
      Alert.alert('Error', 'Score must be greater than 0');
      return;
    }

    // Validate table name
    if (!tableName || tableName.trim() === '') {
      Alert.alert('Error', 'Table name is required');
      return;
    }

    try {
      if (isEditMode) {
        await storage.updateScore(params.scoreId!, {
          score: scoreValue,
          tableName: tableName.trim(),
        });
      } else {
        await storage.addScore({
          score: scoreValue,
          tableName: tableName.trim(),
          date: new Date().toISOString(),
          photoUri,
        });
      }
      router.push('/');
    } catch (error) {
      Alert.alert('Error', 'Failed to save score');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleTableNameChange = (text: string) => {
    setTableName(text);

    if (text.length === 0) {
      setFilteredTables([]);
    } else {
      const filtered = allTables.filter(table =>
        table.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredTables(filtered);
    }
  };

  const handleSelectTable = (selectedTableName: string) => {
    setTableName(selectedTableName);
    setFilteredTables([]);
    setTableInputActive(false);
  };

  const handleTableNamePress = () => {
    setTableInputActive(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContentContainer}
      keyboardDismissMode="on-drag"
    >
      <View style={styles.container} testID="container">
        <Text style={styles.title}>{isEditMode ? 'Edit Score' : 'Correct Score'}</Text>

      {photoUri && (
        <Image
          source={{ uri: photoUri }}
          style={styles.photo}
          resizeMode="cover"
          testID="photo-image"
        />
      )}

      <View style={styles.form}>
        {tableInputActive ? (
          <>
            <Text style={styles.label}>Table:</Text>
            <TextInput
              style={styles.input}
              value={tableName}
              onChangeText={handleTableNameChange}
              placeholder="Enter or search table name"
              autoFocus
              testID="table-input"
            />
            {filteredTables.length > 0 && (
              <View style={styles.suggestionsContainer} testID="suggestions">
                {filteredTables.map((table, index) => (
                  <Pressable
                    key={table.id}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectTable(table.name)}
                    testID={`suggestion-item-${index}`}
                  >
                    <Text style={styles.suggestionText}>{table.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        ) : (
          <Pressable onPress={handleTableNamePress} testID="table-field">
            <Text style={styles.label}>Table: {tableName || 'Unknown'}</Text>
          </Pressable>
        )}

        <Text style={styles.label}>Score:</Text>
        <TextInput
          style={styles.input}
          value={score}
          onChangeText={setScore}
          keyboardType="number-pad"
          placeholder="Enter score"
          testID="score-input"
          onSubmitEditing={handleSave}
          returnKeyType="done"
        />
      </View>

      <View style={styles.buttonContainer} testID="button-container">
        <Pressable style={[styles.button, styles.saveButton]} onPress={handleSave} testID="save-button">
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>

        <Pressable style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#2E3E52',
  },
  scrollContentContainer: {
    paddingBottom: 200,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#2E3E52',
    minHeight: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#E8EEF5',
  },
  photo: {
    width: '100%',
    height: 350,
    borderRadius: 10,
    marginBottom: 20,
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
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#3B4F6B',
    color: '#E8EEF5',
  },
  suggestionsContainer: {
    borderWidth: 1,
    borderColor: '#495A73',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#3B4F6B',
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#495A73',
  },
  suggestionText: {
    fontSize: 14,
    color: '#E8EEF5',
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#6BA3D4',
  },
  saveButtonText: {
    color: '#2E3E52',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#495A73',
  },
  cancelButtonText: {
    color: '#E8EEF5',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
