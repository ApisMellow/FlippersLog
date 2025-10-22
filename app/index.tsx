import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Pressable, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { storage } from '@/services/storage';
import { TableWithScores } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { formatScoreDate } from '@/utils/date-format';
import { Swipeable } from 'react-native-gesture-handler';

export default function HomeScreen() {
  const router = useRouter();
  const [tables, setTables] = useState<TableWithScores[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTables = async () => {
    const data = await storage.getTablesWithScores();
    setTables(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTables();
    setRefreshing(false);
  };

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTables();
    }, [])
  );

  const formatScore = (score: number) => {
    return score.toLocaleString();
  };

  const handleEditScore = (scoreId: string) => {
    router.push({
      pathname: '/edit-score',
      params: { scoreId },
    });
  };

  const handleDeleteScore = async (scoreId: string) => {
    try {
      await storage.deleteScore(scoreId);
      // Reload scores
      await loadTables();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete score');
    }
  };

  const renderRightActions = (scoreId: string) => {
    return (
      <Pressable
        testID={`swipe-delete-${scoreId}`}
        onPress={() => handleDeleteScore(scoreId)}
        style={styles.swipeDeleteButton}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
        <Text style={styles.swipeDeleteText}>Delete</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {tables.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="game-controller-outline" size={64} color="#999" />
          <Text style={styles.emptyText}>No scores yet!</Text>
          <Text style={styles.emptySubtext}>Tap the + button to add your first score</Text>
        </View>
      ) : (
        <FlatList
          data={tables}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableName}>{item.name}</Text>
                {item.manufacturer && (
                  <Text style={styles.manufacturer}>{item.manufacturer}</Text>
                )}
              </View>

              <View style={styles.scoresContainer}>
                {item.topScores.map((score, index) => (
                  <Swipeable
                    key={score.id}
                    renderRightActions={() => renderRightActions(score.id)}
                  >
                    <View style={styles.scoreRow}>
                      <View style={styles.scoreRank}>
                        <Text style={[
                          styles.rankText,
                          index === 0 && styles.rankTextFirst
                        ]}>
                          #{index + 1}
                        </Text>
                      </View>
                      <View style={styles.scoreDetails}>
                        <Text style={[
                          styles.scoreText,
                          index === 0 && styles.scoreTextFirst
                        ]}>
                          {formatScore(score.score)}
                        </Text>
                        <Text style={styles.dateText}>{formatScoreDate(score.date)}</Text>
                      </View>
                      <View style={styles.scoreActions}>
                        <Pressable
                          testID={`edit-score-${score.id}`}
                          onPress={() => handleEditScore(score.id)}
                          style={styles.actionButton}
                        >
                          <Text style={styles.actionButtonText}>Edit</Text>
                        </Pressable>
                        <Pressable
                          testID={`delete-score-${score.id}`}
                          onPress={() => handleDeleteScore(score.id)}
                          style={styles.actionButton}
                        >
                          <Text style={styles.actionButtonText}>Delete</Text>
                        </Pressable>
                      </View>
                      {score.photoUri && (
                        <Ionicons name="camera" size={16} color="#999" style={styles.cameraIcon} />
                      )}
                    </View>
                  </Swipeable>
                ))}
              </View>
            </View>
          )}
        />
      )}

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, styles.fabSecondary]}
          onPress={() => router.push('/manual-entry')}
        >
          <Ionicons name="create-outline" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/capture')}
        >
          <Ionicons name="camera" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  tableCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  tableName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  manufacturer: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scoresContainer: {
    gap: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  scoreRank: {
    width: 40,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  rankTextFirst: {
    fontSize: 18,
    color: '#FFD700',
  },
  scoreDetails: {
    flex: 1,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scoreTextFirst: {
    fontSize: 20,
    color: '#007AFF',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  scoreActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#333',
  },
  cameraIcon: {
    marginLeft: 8,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabSecondary: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#5AC8FA',
  },
  swipeDeleteButton: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  swipeDeleteText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
