import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Icon, TouchableRipple } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize, touch } from '../theme';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'MaisHub'>;

type Item = {
  route: keyof HomeStackParamList;
  icon: string;
  title: string;
  subtitle: string;
};

// Comunidade saiu daqui: virou aba própria (botão central da barra inferior).
const ITEMS: Item[] = [
  { route: 'Financeiro', icon: 'wallet-outline', title: 'Financeiro', subtitle: 'Pagamentos e recebimentos' },
  { route: 'Notificacoes', icon: 'bell-outline', title: 'Notificações', subtitle: 'Atualizações importantes' },
  { route: 'Configuracoes', icon: 'cog-outline', title: 'Configurações', subtitle: 'Conta e preferências' },
];

export function MaisScreen({ navigation }: Props) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader title="Mais" subtitle="Ferramentas e conta" onBack={navigation.goBack} />

      <ScrollView contentContainerStyle={styles.content}>
        {ITEMS.map((item) => (
          <TouchableRipple
            key={item.route}
            onPress={() => navigation.navigate(item.route)}
            style={[styles.row, { backgroundColor: tokens.surface.card }]}
          >
            <View style={styles.rowInner}>
              <View style={[styles.rowIcon, { backgroundColor: tokens.surface.sunken }]}>
                <Icon source={item.icon} size={touch.glyph} color={tokens.accent.base} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: tokens.text.primary }]}>{item.title}</Text>
                <Text style={[styles.rowSubtitle, { color: tokens.text.secondary }]}>
                  {item.subtitle}
                </Text>
              </View>
              <Icon source="chevron-right" size={touch.chevron} color={tokens.text.muted} />
            </View>
          </TouchableRipple>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  row: { borderRadius: radius.md },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    minHeight: touch.min,
  },
  rowIcon: {
    width: touch.circle,
    height: touch.circle,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: fontSize.md, fontWeight: '600' },
  rowSubtitle: { fontSize: fontSize.sm },
});
