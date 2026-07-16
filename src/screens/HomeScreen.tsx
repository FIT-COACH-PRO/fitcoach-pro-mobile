import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, ActivityIndicator, Icon, TouchableRipple } from 'react-native-paper';
import { getDashboardStats, listUpcomingRenewals } from '../api/endpoints';
import { useAuth } from '../hooks/useAuth';
import type { DashboardStats, UpcomingRenewal } from '../types/database';
import type { HomeStackParamList } from '../navigation/types';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import { sampleDashboard, sampleRenewals } from '../data/sample';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDueDate,
  formatFullDate,
  greeting,
} from '../lib/format';

/** Cor de destaque do ícone de cada métrica (ver mapeamento visual → token). */
type Accentish = 'accent' | 'success' | 'warning' | 'neutral';

export function HomeScreen() {
  const theme = useAppTheme();
  const { tokens } = theme;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [renewals, setRenewals] = useState<UpcomingRenewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextStats, nextRenewals] = await Promise.all([
        getDashboardStats(),
        listUpcomingRenewals(),
      ]);
      setStats(nextStats);
      setRenewals(nextRenewals);
    } catch {
      // Sem backend/dados ainda: cai em dados de exemplo para a tela não quebrar.
      setStats(sampleDashboard);
      setRenewals(sampleRenewals());
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

  const now = new Date();
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    '';
  const firstName = fullName.trim().split(' ')[0];

  return (
    <ScrollView
      style={{ backgroundColor: tokens.surface.page }}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + spacing.lg },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={tokens.accent.base}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.greeting, { color: tokens.text.primary }]}>
            {greeting(now)}
            {firstName ? `, ${firstName}` : ''}
          </Text>
          <Text style={[styles.date, { color: tokens.text.secondary }]}>
            {formatFullDate(now)}
          </Text>
        </View>

        <TouchableRipple
          onPress={() => navigation.navigate('Notificacoes')}
          style={[styles.bell, { backgroundColor: tokens.surface.card }]}
          borderless
          accessibilityLabel="Notificações"
        >
          <View style={styles.bellInner}>
            <Icon source="bell-outline" size={22} color={tokens.text.primary} />
            <View style={[styles.bellDot, { backgroundColor: tokens.accent.base }]} />
          </View>
        </TouchableRipple>
      </View>

      {stats && (
        <View style={styles.grid}>
          <StatCard
            value={stats.active_students}
            label="Alunos ativos"
            icon="pulse"
            tone="success"
          />
          <StatCard
            value={stats.total_students}
            label="Total de alunos"
            icon="account-group"
            tone="neutral"
          />
          <StatCard
            value={stats.total_workouts}
            label="Treinos"
            icon="dumbbell"
            tone="accent"
          />
          <StatCard
            value={formatCurrencyCompact(stats.monthly_revenue)}
            label="Receita do mês"
            icon="wallet-outline"
            tone="success"
            valueColor={tokens.success.base}
          />
          <StatCard
            value={stats.pending_payments}
            label="Pendentes"
            icon="clock-outline"
            tone="warning"
          />
          <StatCard
            value={stats.upcoming_renewals}
            label="Renovações"
            icon="calendar-refresh-outline"
            tone="accent"
          />
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: tokens.text.primary }]}>
        Renovações próximas (7 dias)
      </Text>

      {renewals.length === 0 ? (
        <View style={[styles.card, { backgroundColor: tokens.surface.card }]}>
          <Text style={{ color: tokens.text.secondary }}>
            Nenhuma renovação nos próximos 7 dias.
          </Text>
        </View>
      ) : (
        renewals.map((renewal, index) => (
          <RenewalRow key={renewal.id} renewal={renewal} index={index} />
        ))
      )}
    </ScrollView>
  );
}

function StatCard({
  value,
  label,
  icon,
  tone,
  valueColor,
}: {
  value: string | number;
  label: string;
  icon: string;
  tone: Accentish;
  valueColor?: string;
}) {
  const { tokens } = useAppTheme();

  const iconColor = {
    accent: tokens.accent.base,
    success: tokens.success.base,
    warning: tokens.warning.base,
    neutral: tokens.text.secondary,
  }[tone];

  return (
    <View style={[styles.card, styles.statCard, { backgroundColor: tokens.surface.card }]}>
      <View style={styles.statTop}>
        <Text
          style={[styles.statValue, { color: valueColor ?? tokens.text.primary }]}
          numberOfLines={1}
        >
          {value}
        </Text>
        <View
          style={[styles.iconCircle, { backgroundColor: tokens.surface.sunken }]}
        >
          <Icon source={icon} size={18} color={iconColor} />
        </View>
      </View>
      <Text style={[styles.statLabel, { color: tokens.text.secondary }]}>
        {label}
      </Text>
    </View>
  );
}

function RenewalRow({
  renewal,
  index,
}: {
  renewal: UpcomingRenewal;
  index: number;
}) {
  const { tokens } = useAppTheme();

  // Avatares alternam entre os dois tons de marca.
  const avatarColor = index % 2 === 0 ? tokens.accent.base : tokens.success.base;
  const initial = renewal.full_name.trim().charAt(0).toUpperCase();

  return (
    <View style={[styles.card, styles.renewalRow, { backgroundColor: tokens.surface.card }]}>
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={[styles.avatarText, { color: tokens.text.onDark }]}>
          {initial}
        </Text>
      </View>

      <View style={styles.renewalInfo}>
        <Text style={[styles.renewalName, { color: tokens.text.primary }]} numberOfLines={1}>
          {renewal.full_name}
        </Text>
        <Text style={[styles.renewalDate, { color: tokens.text.secondary }]}>
          {formatDueDate(renewal.subscription_end)}
        </Text>
      </View>

      <Text style={[styles.renewalValue, { color: tokens.success.base }]}>
        {formatCurrency(renewal.monthly_fee)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  headerText: { flex: 1, gap: 2 },
  greeting: { fontSize: fontSize.xl, fontWeight: '700' },
  date: { fontSize: fontSize.sm },
  bell: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
  },
  bellInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bellDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: radius.pill,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '46%',
    gap: spacing.sm,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statValue: { fontSize: fontSize.xxl, fontWeight: '700', flexShrink: 1 },
  statLabel: { fontSize: fontSize.sm },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    marginTop: spacing.sm,
  },

  renewalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: fontSize.md, fontWeight: '700' },
  renewalInfo: { flex: 1, gap: 2 },
  renewalName: { fontSize: fontSize.md, fontWeight: '600' },
  renewalDate: { fontSize: fontSize.sm },
  renewalValue: { fontSize: fontSize.md, fontWeight: '700' },
});
