import { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Icon, TouchableRipple, FAB } from 'react-native-paper';
import { ScreenHeader, StatusBadge, EmptyState, type Tone } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import { sampleSessions, type SampleSession } from '../data/sample';

// Semana 13–19 jul (bate com o mockup): S13 T14 Q15 Q16 S17 S18 D19.
const WEEK = [
  { weekday: 'S', day: 13 },
  { weekday: 'T', day: 14 },
  { weekday: 'Q', day: 15 },
  { weekday: 'Q', day: 16 },
  { weekday: 'S', day: 17 },
  { weekday: 'S', day: 18 },
  { weekday: 'D', day: 19 },
];
const TODAY_INDEX = 1; // terça, 14

const SESSION_META: Record<SampleSession['status'], { label: string; tone: Tone }> = {
  next: { label: 'Próxima', tone: 'success' },
  scheduled: { label: 'Agendada', tone: 'accent' },
};

export function AgendaScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(TODAY_INDEX);

  // Placeholder: só o dia de hoje tem aulas; os demais ilustram o estado vazio.
  const sessions = selected === TODAY_INDEX ? sampleSessions : [];

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader title="Agenda" subtitle="Semana de 13–19 jul" />

      <View style={styles.week}>
        {WEEK.map((d, i) => {
          const isSel = i === selected;
          return (
            <TouchableRipple
              key={d.day}
              onPress={() => setSelected(i)}
              style={[
                styles.dayCell,
                { backgroundColor: isSel ? tokens.accent.base : tokens.surface.card },
              ]}
              borderless
            >
              <View style={styles.dayInner}>
                <Text
                  style={[styles.dayWeekday, { color: isSel ? tokens.text.onAccent : tokens.text.secondary }]}
                >
                  {d.weekday}
                </Text>
                <Text
                  style={[styles.dayNum, { color: isSel ? tokens.text.onAccent : tokens.text.primary }]}
                >
                  {d.day}
                </Text>
              </View>
            </TouchableRipple>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {sessions.length === 0 ? (
          <EmptyState icon="calendar-blank-outline" title="Agenda vazia" subtitle="Sem aulas neste dia." />
        ) : (
          sessions.map((s) => <SessionRow key={s.id} session={s} />)
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: tokens.accent.base }]}
        color={tokens.text.onAccent}
        onPress={() => Alert.alert('Nova aula', 'Agendamento em breve.')}
      />
    </View>
  );
}

function SessionRow({ session }: { session: SampleSession }) {
  const { tokens } = useAppTheme();
  const meta = SESSION_META[session.status];
  const isNext = session.status === 'next';
  return (
    <View style={[styles.session, { backgroundColor: tokens.surface.card }]}>
      <View
        style={[
          styles.sessionBar,
          { backgroundColor: isNext ? tokens.success.base : 'transparent' },
        ]}
      />
      <Text style={[styles.sessionTime, { color: tokens.text.primary }]}>{session.time}</Text>
      <View style={styles.sessionInfo}>
        <Text style={[styles.sessionName, { color: tokens.text.primary }]} numberOfLines={1}>
          {session.studentName}
        </Text>
        <Text style={[styles.sessionDur, { color: tokens.text.secondary }]}>
          {session.durationMin} min
        </Text>
      </View>
      <StatusBadge label={meta.label} tone={meta.tone} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
