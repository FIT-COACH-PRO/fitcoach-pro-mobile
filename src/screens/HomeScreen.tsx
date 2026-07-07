import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { getDashboardStats } from '../api/endpoints';
import type { DashboardStats } from '../types/database';

export function HomeScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setStats(await getDashboardStats());
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

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text variant="headlineSmall" style={styles.title}>
        Resumo
      </Text>
      {error && <Text style={styles.error}>Erro ao carregar: {error}</Text>}
      {stats && (
        <View style={styles.grid}>
          <StatCard label="Alunos ativos" value={stats.active_students} />
          <StatCard label="Total de alunos" value={stats.total_students} />
          <StatCard label="Treinos" value={stats.total_workouts} />
          <StatCard label="Receita do mês" value={`R$ ${stats.monthly_revenue}`} />
          <StatCard label="Pagamentos pendentes" value={stats.pending_payments} />
          <StatCard label="Renovações próximas" value={stats.upcoming_renewals} />
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge">{value}</Text>
        <Text variant="bodySmall">{label}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1 },
  title: { marginBottom: 8, fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%' },
  error: { color: '#d32f2f' },
});
