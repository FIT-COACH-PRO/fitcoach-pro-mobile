import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, Icon, TouchableRipple } from 'react-native-paper';
import { ScreenHeader, Avatar, Card } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize, touch } from '../theme';
import { useThemeMode, THEME_MODE_LABEL, type ThemeMode } from '../theme/ThemeMode';
import { useAuth } from '../hooks/useAuth';
import { sendLocalNotification } from '../lib/notifications';
import { requestCalendarPermission } from '../lib/calendar';
import { getRenewalAlertDays, updateRenewalAlertDays } from '../api/endpoints';
import { DEFAULT_RENEWAL_ALERT_DAYS } from '../lib/renewals';
import { sampleProfile } from '../data/sample';
import type { MaisStackParamList } from '../navigation/types';

export function ConfiguracoesScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { mode, setMode } = useThemeMode();
  const navigation = useNavigation<NativeStackNavigationProp<MaisStackParamList>>();

  // Antecedência do alerta de vencimento (profiles.renewal_alert_days).
  const [alertDays, setAlertDays] = useState(DEFAULT_RENEWAL_ALERT_DAYS);

  useEffect(() => {
    let alive = true;
    getRenewalAlertDays()
      .then((days) => {
        if (alive) setAlertDays(days);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const chooseAlertDays = () => {
    const options = [3, 7, 15, 30];
    Alert.alert(
      'Alerta de vencimento',
      'Com quantos dias de antecedência avisar sobre a ficha do aluno?',
      [
        ...options.map((days) => ({
          text: `${days} dias`,
          onPress: async () => {
            try {
              setAlertDays(await updateRenewalAlertDays(days));
            } catch {
              Alert.alert('Alerta de vencimento', 'Não foi possível salvar a preferência.');
            }
          },
        })),
        { text: 'Cancelar', style: 'cancel' as const },
      ]
    );
  };

  const name = (user?.user_metadata?.full_name as string | undefined) ?? sampleProfile.name;
  const email = user?.email ?? sampleProfile.email;

  const chooseTheme = () => {
    const opts: { text: string; mode: ThemeMode }[] = [
      { text: THEME_MODE_LABEL.light, mode: 'light' },
      { text: THEME_MODE_LABEL.dark, mode: 'dark' },
      { text: THEME_MODE_LABEL.system, mode: 'system' },
    ];
    Alert.alert('Tema', 'Escolha a aparência do app', [
      ...opts.map((o) => ({ text: o.text, onPress: () => setMode(o.mode) })),
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader title="Configurações" subtitle="Conta e preferências" />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.profile}>
          <Avatar name={name} color={tokens.accent.base} size={48} />
          <View style={styles.profileText}>
            <Text style={[styles.profileName, { color: tokens.text.primary }]}>{name}</Text>
            <Text style={[styles.profileEmail, { color: tokens.text.secondary }]}>{email}</Text>
          </View>
        </Card>

        <View style={styles.list}>
          <SettingRow
            icon="account-outline"
            title="Perfil"
            subtitle="Editar dados pessoais"
            onPress={() => navigation.navigate('PerfilForm')}
          />
          <SettingRow
            icon="shield-check-outline"
            title="2FA"
            subtitle="Autenticação em duas etapas"
            onPress={() => Alert.alert('2FA', 'Configuração de 2FA em breve.')}
          />
          <SettingRow
            icon="calendar-alert"
            title="Alerta de vencimento"
            subtitle={`Avisar ${alertDays} dias antes`}
            onPress={chooseAlertDays}
          />
          <SettingRow
            icon="palette-outline"
            title="Tema"
            subtitle={THEME_MODE_LABEL[mode]}
            onPress={chooseTheme}
          />
          <SettingRow
            icon="bell-outline"
            title="Testar notificação"
            subtitle="Enviar alerta de teste"
            onPress={() =>
              sendLocalNotification('Teste', 'Notificação local funcionando ✅').catch(() => {})
            }
          />
          <SettingRow
            icon="calendar-outline"
            title="Permitir acesso à agenda"
            subtitle="Sincronizar com calendário"
            onPress={() => requestCalendarPermission().catch(() => {})}
          />
        </View>

        <TouchableRipple
          onPress={signOut}
          style={[styles.signOut, { backgroundColor: tokens.danger.subtle }]}
          borderless
        >
          <View style={styles.signOutInner}>
            <Icon source="logout" size={18} color={tokens.danger.base} />
            <Text style={[styles.signOutText, { color: tokens.danger.base }]}>Sair</Text>
          </View>
        </TouchableRipple>
      </ScrollView>
    </View>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { tokens } = useAppTheme();
  return (
    <TouchableRipple onPress={onPress} style={[styles.row, { backgroundColor: tokens.surface.card }]}>
      <View style={styles.rowInner}>
        <View style={[styles.rowIcon, { backgroundColor: tokens.surface.sunken }]}>
          <Icon source={icon} size={touch.glyph} color={tokens.accent.base} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: tokens.text.primary }]}>{title}</Text>
          <Text style={[styles.rowSubtitle, { color: tokens.text.secondary }]}>{subtitle}</Text>
        </View>
        <Icon source="chevron-right" size={touch.chevron} color={tokens.text.muted} />
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },

  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  profileText: { flex: 1, gap: 2 },
  profileName: { fontSize: fontSize.md, fontWeight: '700' },
  profileEmail: { fontSize: fontSize.sm },

  list: { gap: spacing.sm },
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

  signOut: { borderRadius: radius.md, paddingVertical: spacing.lg, minHeight: touch.min, marginTop: spacing.sm },
  signOutInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  signOutText: { fontSize: fontSize.md, fontWeight: '600' },
});
