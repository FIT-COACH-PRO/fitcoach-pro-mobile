import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Icon, TouchableRipple, ActivityIndicator } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader, Card, ErrorState } from '../components/ui';
import { BarChart } from '../components/BarChart';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import { getProductivityData, type ProductivityData } from '../api/endpoints';
import {
  summarizeProductivity,
  weeklyBars,
  monthlyBars,
  formatHours,
} from '../lib/produtividade';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Produtividade'>;

type Range = 'week' | 'month';

const RANGE_LABEL: Record<Range, string> = { week: 'Semana', month: 'Mês' };

/**
 * Produtividade do personal: quantos treinos montou e quantas horas de aula
 * deu. Métricas internas, derivadas de workouts.created_at e da duração das
 * sessões — sem serviço externo e sem tabela nova.
 */
export function ProdutividadeScreen({ navigation }: Props) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<ProductivityData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>('week');

  const load = useCallback(async () => {
    try {
      setData(await getProductivityData(6));
      setError(null);
    } catch (e) {
      setData({ workouts: [], sessions: [] });
      setError(e instanceof Error ? e.message : 'Não foi possível carregar as métricas.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(
    () => (data ? summarizeProductivity(data.workouts, data.sessions) : null),
    [data]
  );

  const bars = useMemo(() => {
    if (!data) return [];
    const source =
      range === 'week'
        ? weeklyBars(data.workouts, data.sessions, new Date(), 6)
        : monthlyBars(data.workouts, data.sessions, new Date(), 6);
    return source;
  }, [data, range]);

  if (!data || !summary) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: tokens.surface.page }]}>
        <ActivityIndicator color={tokens.accent.base} />
      </View>
    );
  }

  const period = summary[range];

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader
        title="Produtividade"
        subtitle="Seus treinos montados e horas de aula"
        onBack={navigation.goBack}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {error && <ErrorState message={error} onRetry={load} />}

        <View style={styles.tabs}>
          {(['week', 'month'] as Range[]).map((r) => {
            const selected = r === range;
            return (
              <TouchableRipple
                key={r}
                onPress={() => setRange(r)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: selected ? tokens.accent.base : tokens.surface.card,
                    borderColor: selected ? tokens.accent.base : tokens.surface.divider,
                  },
                ]}
                borderless
              >
                <Text
                  style={[styles.tabText, { color: selected ? tokens.text.onAccent : tokens.text.secondary }]}
                >
                  {RANGE_LABEL[r]}
                </Text>
              </TouchableRipple>
            );
          })}
        </View>

        <View style={styles.grid}>
          <Metric
            value={String(period.workouts)}
            label={range === 'week' ? 'Treinos montados na semana' : 'Treinos montados no mês'}
            icon="dumbbell"
            color={tokens.accent.base}
          />
          <Metric
            value={formatHours(period.hours)}
            label={range === 'week' ? 'Horas de aula na semana' : 'Horas de aula no mês'}
            icon="clock-outline"
            color={tokens.success.base}
          />
          <Metric
            value={String(period.sessions)}
            label="Aulas no período"
            icon="calendar-check-outline"
            color={tokens.text.secondary}
          />
          <Metric
            value={period.sessions > 0 ? formatHours(period.hours / period.sessions) : '—'}
            label="Duração média da aula"
            icon="timer-sand"
            color={tokens.warning.base}
          />
        </View>

        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: tokens.text.primary }]}>
            Horas de aula — últimas 6 {range === 'week' ? 'semanas' : 'meses'}
          </Text>
          <BarChart
            data={bars.map((b) => ({
              label: b.label,
              value: b.hours,
              display: b.hours > 0 ? formatHours(b.hours) : '0',
            }))}
            color={tokens.success.base}
            emptyLabel="Nenhuma aula registrada no período."
          />
        </Card>

        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: tokens.text.primary }]}>
            Treinos montados — últimas 6 {range === 'week' ? 'semanas' : 'meses'}
          </Text>
          <BarChart
            data={bars.map((b) => ({ label: b.label, value: b.workouts }))}
            color={tokens.accent.base}
            emptyLabel="Nenhum treino montado no período."
          />
        </Card>
      </ScrollView>
    </View>
  );
}

function Metric({
  value,
  label,
  icon,
  color,
}: {
  value: string;
  label: string;
  icon: string;
  color: string;
}) {
  const { tokens } = useAppTheme();
  return (
    <View style={[styles.metric, { backgroundColor: tokens.surface.card }]}>
      <View style={styles.metricTop}>
        <Text style={[styles.metricValue, { color: tokens.text.primary }]} numberOfLines={1}>
          {value}
        </Text>
        <View style={[styles.iconCircle, { backgroundColor: tokens.surface.sunken }]}>
          <Icon source={icon} size={20} color={color} />
        </View>
      </View>
      <Text style={[styles.metricLabel, { color: tokens.text.secondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },

  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  tabText: { fontSize: fontSize.sm, fontWeight: '600' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metric: { flexGrow: 1, flexBasis: '46%', borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  metricTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  metricValue: { fontSize: fontSize.xl, fontWeight: '700', flexShrink: 1 },
  metricLabel: { fontSize: fontSize.sm },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chartCard: { gap: spacing.md },
  chartTitle: { fontSize: fontSize.md, fontWeight: '600' },
});
