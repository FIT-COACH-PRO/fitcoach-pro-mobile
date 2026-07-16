import { useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Searchbar, TouchableRipple, Text, Icon, FAB } from 'react-native-paper';
import { ScreenHeader, EmptyState } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import { sampleWorkouts, type SampleWorkout } from '../data/sample';
import type { TreinosStackParamList } from '../navigation/types';

export function WorkoutsScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<TreinosStackParamList>>();
  const [query, setQuery] = useState('');

  const workouts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sampleWorkouts.filter((w) => !q || w.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader title="Treinos" subtitle="Modelos e prescrições" />

      <View style={styles.controls}>
        <Searchbar
          placeholder="Buscar treino"
          value={query}
          onChangeText={setQuery}
          style={[styles.search, { backgroundColor: tokens.surface.card }]}
          inputStyle={{ color: tokens.text.primary, minHeight: 0 }}
          iconColor={tokens.text.secondary}
          placeholderTextColor={tokens.text.muted}
          elevation={0}
        />
      </View>

      <FlatList
        data={workouts}
        keyExtractor={(w) => w.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState icon="dumbbell" title="Sem treinos" subtitle="Crie um modelo no botão +." />
        }
        renderItem={({ item }) => (
          <WorkoutRow
            workout={item}
            onPress={() => navigation.navigate('TreinoDetalhe', { workoutId: item.id })}
          />
        )}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: tokens.accent.base }]}
        color={tokens.text.onAccent}
        onPress={() => Alert.alert('Novo treino', 'Criação de treino em breve.')}
      />
    </View>
  );
}

function WorkoutRow({ workout, onPress }: { workout: SampleWorkout; onPress: () => void }) {
  const { tokens } = useAppTheme();
  return (
    <TouchableRipple onPress={onPress} style={[styles.row, { backgroundColor: tokens.surface.card }]}>
      <View style={styles.rowInner}>
        <View style={[styles.rowIcon, { backgroundColor: tokens.surface.sunken }]}>
          <Icon source={workout.icon} size={20} color={tokens.accent.base} />
        </View>
        <View style={styles.rowInfo}>
          <Text style={[styles.rowName, { color: tokens.text.primary }]} numberOfLines={1}>
            {workout.name}
          </Text>
          <Text style={[styles.rowLevel, { color: tokens.text.secondary }]} numberOfLines={1}>
            {workout.level}
          </Text>
        </View>
        <Icon source="chevron-right" size={20} color={tokens.text.muted} />
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  controls: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  search: { borderRadius: radius.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 96, gap: spacing.sm },
  row: { borderRadius: radius.lg },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { fontSize: fontSize.md, fontWeight: '600' },
  rowLevel: { fontSize: fontSize.sm },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, borderRadius: radius.lg },
});
