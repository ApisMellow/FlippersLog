import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { storage } from '@/services/storage';
import { Table } from '@/types';

export default function ManualEntryScreen() {
  const router = useRouter();
  const [tableName, setTableName] = useState('');
  const [tableInputValue, setTableInputValue] = useState('');
  const [score, setScore] = useState('');
  const [sampleTables, setSampleTables] = useState<Table[]>([]);

  const loadTablesForQuickSelect = useCallback(async () => {
    try {
      // Try to load user's actual saved tables
      const userTables = await storage.getTables();

      if (userTables.length > 0) {
        // Sort by lastUsedDate (most recent first), limit to 10
        const sortedTables = userTables
          .sort((a, b) => {
            const dateA = new Date(a.lastUsedDate || 0).getTime();
            const dateB = new Date(b.lastUsedDate || 0).getTime();
            return dateB - dateA; // Most recent first
          })
          .slice(0, 10); // Take only first 10

        setSampleTables(sortedTables);
      } else {
        // Fallback: show sample tables for new users with no saved tables
        const samples = await storage.getSampleTables();
        setSampleTables(samples);
      }
    } catch (error) {
      console.error('Error loading tables for quick select:', error);
      // On error, fall back to sample tables
      const samples = await storage.getSampleTables();
      setSampleTables(samples);
    }
  }, []);

  // Load tables when screen mounts and whenever it regains focus
  useFocusEffect(
    useCallback(() => {
      loadTablesForQuickSelect();
    }, [loadTablesForQuickSelect])
  );

  const selectTable = (table: Table) => {
    setTableName(table.name);
    setTableInputValue(table.name);
  };

  const handleTableNameInputChange = (text: string) => {
    setTableInputValue(text);
    setTableName(text);
  };

  const formatScoreInput = (text: string) => {
    // Remove non-numeric characters
    const numeric = text.replace(/[^0-9]/g, '');
    // Format with commas
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleScoreChange = (text: string) => {
    setScore(formatScoreInput(text));
  };

  const handleSave = async () => {
    if (!tableName.trim()) {
      Alert.alert('Error', 'Please enter a table name');
      return;
    }

    if (!score.trim()) {
      Alert.alert('Error', 'Please enter a score');
      return;
    }

    const numericScore = parseInt(score.replace(/,/g, ''), 10);
    if (isNaN(numericScore) || numericScore <= 0) {
      Alert.alert('Error', 'Please enter a valid score');
      return;
    }

    try {
      // Save the score with tableName (new preferred method)
      await storage.addScore({
        score: numericScore,
        tableName: tableName.trim(),
        date: new Date().toISOString(),
      });

      Alert.alert(
        'Score Saved!',
        `${tableName}\nScore: ${score}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save score. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Image
              testID="flipper-icon"
              source={require('@/assets/pinball-flippers.png')}
              style={{ width: 120, height: 120 }}
            />
          </View>

          <View style={styles.form}>
            {/* Sample Tables Quick Select / Autocomplete Suggestions */}
            {sampleTables.length > 0 && tableInputValue === '' && (
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Quick Select</Text>
                <View style={styles.sampleTablesContainer}>
                  {sampleTables.map((table) => (
                    <TouchableOpacity
                      key={table.id}
                      style={styles.sampleTableChip}
                      onPress={() => selectTable(table)}
                    >
                      <Text style={styles.sampleTableText}>{table.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Table Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Medieval Madness"
                value={tableInputValue}
                onChangeText={handleTableNameInputChange}
                autoCapitalize="words"
                autoFocus={!sampleTables.length}
              />
              {tableName && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    setTableName('');
                    setTableInputValue('');
                  }}
                >
                  <Text style={styles.clearButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Score</Text>
              <TextInput
                style={[styles.input, styles.scoreInput]}
                placeholder="0"
                value={score}
                onChangeText={handleScoreChange}
                keyboardType="number-pad"
                onSubmitEditing={handleSave}
                returnKeyType="done"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E3E52',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  form: {
    gap: 20,
  },
  fieldContainer: {
    gap: 8,
    position: 'relative',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8EEF5',
  },
  sampleTablesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sampleTableChip: {
    backgroundColor: '#6BA3D4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sampleTableText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 40,
  },
  clearButtonText: {
    fontSize: 24,
    color: '#A0AEC0',
    fontWeight: '300',
  },
  input: {
    backgroundColor: '#3B4F6B',
    borderWidth: 1,
    borderColor: '#495A73',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#E8EEF5',
  },
  scoreInput: {
    fontSize: 24,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
