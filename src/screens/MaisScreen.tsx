import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Icon, TouchableRipple } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader, StatusBadge } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import type { MaisStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MaisStackParamList, 'MaisHub'>;

type Item = {
  route: keyof MaisStackParamList;
  icon: string;
  title: string;
  subtitle: string;
  soon?: boolean;
};

const ITEMS: Item[] = [
  { route: 'Financeiro', icon: 'wallet-outline', title: 'Financeiro', subtitle: 'Pagamentos e recebimentos' },
  { route: 'Notificacoes', icon: 'bell-outline', title: 'Notificações', subtitle: 'Atualizações importantes' },
  { route: 'Configuracoes', icon: 'cog-outline', title: 'Configurações', subtitle: 'Conta e preferências' },
  { route: 'Comunidade', icon: 'account-group-outline', title: 'Comunidade', subtitle: 'Rede dos personais', soon: true },
];

export function MaisScreen({ navigation }: Props) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader title="Mais" subtitle="Ferramentas e conta" />

      <ScrollView contentContainerStyle={styles.content}>
        {ITEMS.map((item) => (
          <TouchableRipple
            key={item.route}
            onPress={() => navigation.navigate(item.route)}
            style={[styles.row, { backgroundColor: tokens.surface.card }]}
          >
            <View style={styles.rowInner}>
              <View style={[styles.rowIcon, { backgroundColor: tokens.surface.sunken }]}>
                <Icon source={item.icon} size={20} color={tokens.accent.base} />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: tokens.text.primary }]}>{item.title}</Text>
                <Text style={[styles.rowSubtitle, { color: tokens.text.secondary }]}>
                  {item.subtitle}
                </Text>
              </View>
              {item.soon && <StatusBadge label="Em breve" tone="accent" />}
              <Icon source="chevron-right" size={20} color={tokens.text.muted} />
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
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: fontSize.md, fontWeight: '600' },
  rowSubtitle: { fontSize: fontSize.sm },
});
