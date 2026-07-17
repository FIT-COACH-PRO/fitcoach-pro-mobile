import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Icon } from 'react-native-paper';
import { ScreenHeader, EmptyState, useToneColors, type Tone } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import { sampleNotifications, type SampleNotification, type SampleNotificationKind } from '../data/sample';

const KIND_META: Record<SampleNotificationKind, { icon: string; tone: Tone }> = {
  payment_received: { icon: 'cash-check', tone: 'success' },
  renewal: { icon: 'calendar-refresh-outline', tone: 'accent' },
  workout_shared: { icon: 'dumbbell', tone: 'accent' },
  sync_failed: { icon: 'sync-alert', tone: 'danger' },
};

export function NotificacoesScreen({ onBack }: { onBack?: () => void }) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const items = sampleNotifications;

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader title="Notificações" subtitle="Atualizações importantes" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.content}>
        {items.length === 0 ? (
          <EmptyState icon="bell-outline" title="Sem novas" subtitle="Tudo em dia." />
        ) : (
          items.map((n) => <NotificationRow key={n.id} notification={n} />)
        )}
      </ScrollView>
    </View>
  );
}

function NotificationRow({ notification }: { notification: SampleNotification }) {
  const { tokens } = useAppTheme();
  const colorsFor = useToneColors();
  const meta = KIND_META[notification.kind];
  const { fill, fg } = colorsFor(meta.tone);

  return (
    <View style={[styles.row, { backgroundColor: tokens.surface.card }]}>
      <View style={[styles.icon, { backgroundColor: fill }]}>
        <Icon source={meta.icon} size={20} color={fg} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: tokens.text.primary }]}>{notification.title}</Text>
        <Text style={[styles.desc, { color: tokens.text.secondary }]} numberOfLines={2}>
          {notification.description}
        </Text>
      </View>
      <View style={styles.meta}>
        <Text style={[styles.time, { color: tokens.text.muted }]}>{notification.timeLabel}</Text>
        {notification.unread && <View style={[styles.dot, { backgroundColor: tokens.accent.base }]} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  title: { fontSize: fontSize.md, fontWeight: '600' },
  desc: { fontSize: fontSize.sm },
  meta: { alignItems: 'flex-end', gap: spacing.xs },
  time: { fontSize: fontSize.xs },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
});
