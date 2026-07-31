import { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Text, Icon, ActivityIndicator } from 'react-native-paper';
import { ScreenHeader, EmptyState, useToneColors, type Tone } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import { listNotifications, markAllNotificationsRead } from '../api/endpoints';
import { formatTimeAgo } from '../lib/format';
import type { Notification } from '../types/database';

const KIND_META: Record<Notification['type'], { icon: string; tone: Tone }> = {
  payment_received: { icon: 'cash-check', tone: 'success' },
  payment_due: { icon: 'cash-clock', tone: 'warning' },
  renewal_reminder: { icon: 'calendar-refresh-outline', tone: 'accent' },
  workout_reminder: { icon: 'dumbbell', tone: 'accent' },
  inactivity_alert: { icon: 'alert-circle-outline', tone: 'warning' },
  general: { icon: 'bell-outline', tone: 'neutral' },
};

export function NotificacoesScreen({ onBack }: { onBack?: () => void }) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Notification[] | null>(null);

  // Snapshot do que estava não lido na abertura (para o ponto por item) —
  // marca tudo como lido em seguida, sem esperar nem re-renderizar por isso.
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      listNotifications()
        .then((list) => {
          if (!alive) return;
          setItems(list);
          if (list.some((n) => !n.read)) markAllNotificationsRead().catch(() => {});
        })
        .catch(() => alive && setItems([]));
      return () => {
        alive = false;
      };
    }, [])
  );

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader title="Notificações" subtitle="Atualizações importantes" onBack={onBack} />

      {items === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.accent.base} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {items.length === 0 ? (
            <EmptyState icon="bell-outline" title="Tudo em dia" subtitle="Sem notificações por aqui." />
          ) : (
            items.map((n) => <NotificationRow key={n.id} notification={n} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}

function NotificationRow({ notification }: { notification: Notification }) {
  const { tokens } = useAppTheme();
  const colorsFor = useToneColors();
  const meta = KIND_META[notification.type];
  const { fill, fg } = colorsFor(meta.tone);

  return (
    <View style={[styles.row, { backgroundColor: tokens.surface.card }]}>
      <View style={[styles.icon, { backgroundColor: fill }]}>
        <Icon source={meta.icon} size={20} color={fg} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: tokens.text.primary }]}>{notification.title}</Text>
        <Text style={[styles.desc, { color: tokens.text.secondary }]} numberOfLines={2}>
          {notification.message}
        </Text>
      </View>
      <View style={styles.meta}>
        <Text style={[styles.time, { color: tokens.text.muted }]}>
          {formatTimeAgo(notification.created_at)}
        </Text>
        {!notification.read && <View style={[styles.dot, { backgroundColor: tokens.accent.base }]} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
