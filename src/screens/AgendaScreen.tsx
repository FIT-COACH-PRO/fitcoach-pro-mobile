import { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, TouchableRipple, FAB, ActivityIndicator } from 'react-native-paper';
import { ScreenHeader, StatusBadge, EmptyState, type Tone } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import { listSessions } from '../api/endpoints';
import { sampleSessions } from '../data/sample';
import type { Session } from '../types/database';
import type { AgendaStackParamList } from '../navigation/types';

const WEEKDAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']; // Dom → Sáb
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const pad = (n: number) => String(n).padStart(2, '0');

type SessionRowData = { id: string; time: string; studentName: string; durationMin: number; isNext: boolean };

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function AgendaScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AgendaStackParamList>>();

  // Semana atual (domingo → sábado) com base em hoje.
  const week = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, []);
  const todayIndex = useMemo(() => new Date().getDay(), []);

  const [selected, setSelected] = useState(todayIndex);
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [useSample, setUseSample] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await listSessions();
      setSessions(list);
      setUseSample(false);
    } catch {
      setSessions([]);
      setUseSample(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Próxima aula futura (destaque verde), entre todas as sessões reais.
  const nextId = useMemo(() => {
    if (!sessions) return null;
    const now = Date.now();
    let best: { id: string; t: number } | null = null;
    for (const s of sessions) {
      const t = new Date(s.starts_at).getTime();
      if (t >= now && (!best || t < best.t)) best = { id: s.id, t };
    }
    return best?.id ?? null;
  }, [sessions]);

  const dayRows = useMemo<SessionRowData[]>(() => {
    if (useSample) {
      // Demo/offline: só o dia de hoje ilustra aulas.
      return selected === todayIndex
        ? sampleSessions.map((s) => ({
            id: s.id,
            time: s.time,
            studentName: s.studentName,
            durationMin: s.durationMin,
            isNext: s.status === 'next',
          }))
        : [];
    }
    if (!sessions) return [];
    const day = week[selected];
    return sessions
      .filter((s) => sameDay(new Date(s.starts_at), day))
      .map((s) => {
        const start = new Date(s.starts_at);
        const end = new Date(s.ends_at);
        return {
          id: s.id,
          time: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
          studentName: s.student?.full_name ?? 'Aluno',
          durationMin: Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)),
          isNext: s.id === nextId,
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [useSample, sessions, selected, week, todayIndex, nextId]);

  const subtitle = `Semana de ${week[0].getDate()}–${week[6].getDate()} ${MONTHS[week[6].getMonth()]}`;

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader title="Agenda" subtitle={subtitle} />

      <View style={styles.week}>
        {week.map((d, i) => {
          const isSel = i === selected;
          return (
            <TouchableRipple
              key={d.toISOString()}
              onPress={() => setSelected(i)}
              style={[styles.dayCell, { backgroundColor: isSel ? tokens.accent.base : tokens.surface.card }]}
              borderless
            >
              <View style={styles.dayInner}>
                <Text style={[styles.dayWeekday, { color: isSel ? tokens.text.onAccent : tokens.text.secondary }]}>
                  {WEEKDAY_LETTERS[i]}
                </Text>
                <Text style={[styles.dayNum, { color: isSel ? tokens.text.onAccent : tokens.text.primary }]}>
                  {d.getDate()}
                </Text>
              </View>
            </TouchableRipple>
          );
        })}
      </View>

      {sessions === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.accent.base} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {dayRows.length === 0 ? (
            <EmptyState icon="calendar-blank-outline" title="Agenda vazia" subtitle="Sem aulas neste dia." />
          ) : (
            dayRows.map((s) => <SessionRow key={s.id} session={s} />)
          )}
        </ScrollView>
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: tokens.accent.base }]}
        color={tokens.text.onAccent}
        onPress={() => navigation.navigate('AgendaForm')}
      />
    </View>
  );
}

function SessionRow({ session }: { session: SessionRowData }) {
  const { tokens } = useAppTheme();
  const meta: { label: string; tone: Tone } = session.isNext
    ? { label: 'Próxima', tone: 'success' }
    : { label: 'Agendada', tone: 'accent' };
  return (
    <View style={[styles.session, { backgroundColor: tokens.surface.card }]}>
      <View
        style={[styles.sessionBar, { backgroundColor: session.isNext ? tokens.success.base : 'transparent' }]}
      />
      <Text style={[styles.sessionTime, { color: tokens.text.primary }]}>{session.time}</Text>
      <View style={styles.sessionInfo}>
        <Text style={[styles.sessionName, { color: tokens.text.primary }]} numberOfLines={1}>
          {session.studentName}
        </Text>
        <Text style={[styles.sessionDur, { color: tokens.text.secondary }]}>{session.durationMin} min</Text>
      </View>
      <StatusBadge label={meta.label} tone={meta.tone} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  week: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  dayCell: { flex: 1, borderRadius: radius.md },
  dayInner: { alignItems: 'center', paddingVertical: spacing.sm, gap: 2 },
  dayWeekday: { fontSize: fontSize.xs, fontWeight: '600' },
  dayNum: { fontSize: fontSize.md, fontWeight: '700' },

  list: { paddingHorizontal: spacing.lg, paddingBottom: 96, gap: spacing.sm },
  session: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
    overflow: 'hidden',
  },
  sessionBar: { width: 3, alignSelf: 'stretch', borderRadius: radius.pill, marginVertical: -spacing.md, marginLeft: -spacing.md + 2 },
  sessionTime: { fontSize: fontSize.md, fontWeight: '700', width: 52 },
  sessionInfo: { flex: 1, gap: 2 },
  sessionName: { fontSize: fontSize.md, fontWeight: '600' },
  sessionDur: { fontSize: fontSize.sm },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, borderRadius: radius.lg },
});
