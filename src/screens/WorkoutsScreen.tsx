import { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { List, ActivityIndicator, Text } from 'react-native-paper';
import { listWorkouts } from '../api/endpoints';
import type { Workout } from '../types/database';

export function WorkoutsScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listWorkouts()
      .then(setWorkouts)
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={styles.center} />;
  if (error) return <Text style={styles.error}>Erro: {error}</Text>;

  return (
    <FlatList
      data={workouts}
      keyExtractor={(w) => w.id}
      ListEmptyComponent={<Text style={styles.empty}>Nenhum treino ainda.</Text>}
      renderItem={({ item }) => (
        <List.Item
          title={item.name}
          description={item.description ?? item.goal ?? item.type}
          left={(p) => <List.Icon {...p} icon="dumbbell" />}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1 },
  error: { color: '#d32f2f', padding: 16 },
  empty: { padding: 16, textAlign: 'center' },
});
