import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, RefreshControl } from 'react-native';
import { List, ActivityIndicator, Text } from 'react-native-paper';
import { listWorkouts } from '../api/endpoints';
import type { Workout } from '../types/database';

export function WorkoutsScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setWorkouts(await listWorkouts());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) return <ActivityIndicator style={styles.center} />;
  if (error) return <Text style={styles.error}>Erro: {error}</Text>;

  return (
    <FlatList
      data={workouts}
      keyExtractor={(w) => w.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
