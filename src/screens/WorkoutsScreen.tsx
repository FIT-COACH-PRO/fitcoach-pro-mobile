import { useCallback, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { List, ActivityIndicator, Text, Icon } from 'react-native-paper';
import { listWorkouts } from '../api/endpoints';
import type { Workout } from '../types/database';
import { useAppTheme, spacing, radius } from '../theme';

export function WorkoutsScreen() {
  const { tokens } = useAppTheme();
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

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: tokens.surface.page }]}>
        <ActivityIndicator color={tokens.accent.base} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.screen, { backgroundColor: tokens.surface.page }]}>
        <View style={[styles.banner, { backgroundColor: tokens.danger.subtle }]}>
          <Text style={{ color: tokens.danger.base }}>Erro: {error}</Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: tokens.surface.page }}
      contentContainerStyle={styles.list}
      data={workouts}
      keyExtractor={(w) => w.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={tokens.accent.base}
        />
      }
      ListEmptyComponent={
        <Text style={[styles.empty, { color: tokens.text.secondary }]}>
          Nenhum treino ainda.
        </Text>
      }
      renderItem={({ item }) => (
        <List.Item
          title={item.name}
          description={item.description ?? item.goal ?? item.type}
          titleStyle={{ color: tokens.text.primary }}
          descriptionStyle={{ color: tokens.text.secondary }}
          style={[styles.item, { backgroundColor: tokens.surface.card }]}
          left={() => (
            <View
              style={[styles.iconCircle, { backgroundColor: tokens.surface.sunken }]}
            >
              <Icon source="dumbbell" size={18} color={tokens.accent.base} />
            </View>
          )}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screen: { flex: 1, padding: spacing.lg },
  list: { padding: spacing.lg, gap: spacing.md },
  item: { borderRadius: radius.lg, paddingVertical: spacing.sm },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginLeft: spacing.sm,
  },
  banner: { padding: spacing.md, borderRadius: radius.md },
  empty: { padding: spacing.lg, textAlign: 'center' },
});
