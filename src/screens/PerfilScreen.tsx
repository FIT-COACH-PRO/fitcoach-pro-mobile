import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Text, Icon, TouchableRipple } from 'react-native-paper';
import { Avatar, StatusBadge } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import { useAuth } from '../hooks/useAuth';
import { trainerDisplayName } from '../lib/format';
import type { PerfilHubNavigationProp } from '../navigation/types';

type Row = {
  icon: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
};

function buildSections(navigation: PerfilHubNavigationProp): { label: string; rows: Row[] }[] {
  return [
    {
      label: 'CONTA',
      rows: [
        { icon: 'account-cog-outline', title: 'Configurações do Perfil', subtitle: 'Em breve' },
        {
          icon: 'cog-outline',
          title: 'Configurações Gerais',
          subtitle: 'Conta e preferências',
          onPress: () => navigation.navigate('Configuracoes'),
        },
        {
          icon: 'bell-outline',
          title: 'Notificações',
          subtitle: 'Atualizações importantes',
          onPress: () => navigation.navigate('Notificacoes'),
        },
      ],
    },
    {
      label: 'NEGÓCIO',
      rows: [
        {
          icon: 'wallet-outline',
          title: 'Financeiro',
          subtitle: 'Pagamentos e recebimentos',
          onPress: () => navigation.navigate('Financeiro'),
        },
        { icon: 'link-variant', title: 'Conexões e Integrações', subtitle: 'Em breve' },
      ],
    },
    {
      label: 'ADMINISTRATIVO',
      rows: [
        { icon: 'shield-lock-outline', title: 'Privacidade e Segurança', subtitle: 'Em breve' },
        { icon: 'help-circle-outline', title: 'Ajuda e Suporte', subtitle: 'Em breve' },
      ],
    },
  ];
}

export function PerfilScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<PerfilHubNavigationProp>();
  const { user, signOut } = useAuth();
  const name = trainerDisplayName(user) || '?';
  const email = user?.email ?? '';

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <TouchableRipple
        onPress={navigation.goBack}
        style={styles.backBtn}
        borderless
        accessibilityLabel="Voltar"
      >
        <Icon source="chevron-left" size={26} color={tokens.text.primary} />
      </TouchableRipple>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <Avatar name={name} color={tokens.accent.base} size={64} />
          <Text style={[styles.name, { color: tokens.text.primary }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.subtitle, { color: tokens.text.secondary }]}>Personal Trainer</Text>
          {!!email && (
            <Text style={[styles.email, { color: tokens.text.muted }]} numberOfLines={1}>
              {email}
            </Text>
          )}
        </View>

        {buildSections(navigation).map((section) => (
          <Section key={section.label} label={section.label} rows={section.rows} />
        ))}

        <TouchableRipple
          onPress={signOut}
          style={[styles.signOut, { backgroundColor: tokens.danger.subtle }]}
          borderless
        >
          <View style={styles.signOutInner}>
            <Icon source="logout" size={18} color={tokens.danger.base} />
            <Text style={[styles.signOutText, { color: tokens.danger.base }]}>Sair da conta</Text>
          </View>
        </TouchableRipple>
      </ScrollView>
    </View>
  );
}

function Section({ label, rows }: { label: string; rows: Row[] }) {
  const { tokens } = useAppTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: tokens.text.muted }]}>{label}</Text>
      <View style={styles.list}>
        {rows.map((row) => (
          <PerfilRow key={row.title} row={row} />
        ))}
      </View>
    </View>
  );
}

function PerfilRow({ row }: { row: Row }) {
  const { tokens } = useAppTheme();
  const onPress = row.onPress;
  return (
    <TouchableRipple onPress={onPress} disabled={!onPress} style={[styles.row, { backgroundColor: tokens.surface.card }]}>
      <View style={styles.rowInner}>
        <View style={[styles.rowIcon, { backgroundColor: tokens.surface.sunken }]}>
          <Icon source={row.icon} size={20} color={tokens.accent.base} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: tokens.text.primary }]}>{row.title}</Text>
          <Text style={[styles.rowSubtitle, { color: tokens.text.secondary }]}>{row.subtitle}</Text>
        </View>
        {!onPress && <StatusBadge label="Em breve" tone="accent" />}
        {onPress && <Icon source="chevron-right" size={20} color={tokens.text.muted} />}
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  backBtn: { borderRadius: radius.pill, padding: 2, marginLeft: spacing.lg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },

  profileHeader: { alignItems: 'center', gap: 4, paddingVertical: spacing.md },
  name: { fontSize: fontSize.lg, fontWeight: '700', marginTop: spacing.sm },
  subtitle: { fontSize: fontSize.sm },
  email: { fontSize: fontSize.xs },

  section: { gap: spacing.sm },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 0.5, marginLeft: spacing.xs },
  list: { gap: spacing.sm },
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

  signOut: { borderRadius: radius.md, paddingVertical: spacing.md, marginTop: spacing.sm },
  signOutInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  signOutText: { fontSize: fontSize.md, fontWeight: '600' },
});
