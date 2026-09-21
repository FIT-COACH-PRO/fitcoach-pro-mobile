import { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, Icon, ActivityIndicator, FAB } from 'react-native-paper';
import { ScreenHeader, Card, EmptyState, ErrorState, StatusBadge } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import { listAnnouncements, isAppAdmin } from '../api/endpoints';
import { formatFullDate } from '../lib/format';
import type { CommunityAnnouncement } from '../types/extras';
import type { ComunidadeStackParamList } from '../navigation/types';

/**
 * Comunidade — versão inicial: canal de avisos do administrador do app para os
 * personais. Mural somente leitura; só o admin publica (RLS em
 * community_announcements, migration 006). Fórum, rotas, vagas e eventos ficam
 * para depois.
 */
export function ComunidadeScreen({ onBack }: { onBack?: () => void }) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<ComunidadeStackParamList>>();

  const [items, setItems] = useState<CommunityAnnouncement[] | null>(null);
  const [admin, setAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, isAdmin] = await Promise.all([listAnnouncements(), isAppAdmin()]);
      setItems(list);
      setAdmin(isAdmin);
      setError(null);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : 'Não foi possível carregar os avisos.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader
        title="Comunidade"
        subtitle="Avisos do FitCoach para os personais"
        onBack={onBack}
      />

      {items === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.accent.base} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.accent.base} />
          }
        >
          {error && <ErrorState message={error} onRetry={load} />}

          {items.length === 0 && !error ? (
            <EmptyState
              icon="bullhorn-outline"
              title="Nenhum aviso ainda"
              subtitle="Quando a equipe do FitCoach publicar um comunicado, ele aparece aqui."
            />
          ) : (
            items.map((a) => <AnnouncementCard key={a.id} announcement={a} />)
          )}
        </ScrollView>
      )}

      {/* Só o admin publica — o botão nem aparece para o personal comum. */}
      {admin && (
        <FAB
          icon="plus"
          label="Publicar"
          style={[styles.fab, { backgroundColor: tokens.accent.base }]}
          color={tokens.text.onAccent}
          onPress={() => navigation.navigate('AvisoForm')}
        />
      )}
    </View>
  );
}

function AnnouncementCard({ announcement }: { announcement: CommunityAnnouncement }) {
  const { tokens } = useAppTheme();
  const published = announcement.published_at;

  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: tokens.accent.subtle }]}>
          <Icon
            source={announcement.pinned ? 'pin' : 'bullhorn-outline'}
            size={20}
            color={tokens.accent.base}
          />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={[styles.title, { color: tokens.text.primary }]}>{announcement.title}</Text>
          <Text style={[styles.date, { color: tokens.text.secondary }]}>
            {published ? formatFullDate(new Date(published)) : 'Rascunho — não publicado'}
          </Text>
        </View>
        {announcement.pinned && <StatusBadge label="Fixado" tone="accent" />}
        {!published && <StatusBadge label="Rascunho" tone="warning" />}
      </View>

      <Text style={[styles.body, { color: tokens.text.secondary }]}>{announcement.body}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 96, gap: spacing.md },

  card: { gap: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardHeaderText: { flex: 1, gap: 2 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: fontSize.md, fontWeight: '700' },
  date: { fontSize: fontSize.xs },
  body: { fontSize: fontSize.sm, lineHeight: 21 },

  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, borderRadius: radius.lg },
});
