import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput, Text, TouchableRipple, ActivityIndicator, Icon } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader, ErrorState } from '../components/ui';
import { getProfile, updateProfile } from '../api/endpoints';
import { requestCalendarPermission } from '../lib/calendar';
import { useAppTheme, spacing, radius, fontSize, touch } from '../theme';
import type { MaisStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MaisStackParamList, 'PerfilForm'>;

export function PerfilFormScreen({ navigation }: Props) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [cref, setCref] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');
  const [bio, setBio] = useState('');
  const [emailRO, setEmailRO] = useState('');
  const [connections, setConnections] = useState<Record<ConnectionId, boolean>>({
    appleCalendar: false,
    whatsapp: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await getProfile();
        if (!alive) return;
        setFullName(p.full_name ?? '');
        setWhatsapp(p.whatsapp ?? '');
        setPhone(p.phone ?? '');
        setCref(p.cref ?? '');
        setCity(p.city ?? '');
        setUf(p.state ?? '');
        setBio(p.bio ?? '');
        setEmailRO(p.email ?? '');
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Não foi possível carregar o perfil.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /**
   * Calendário Apple: a conexão é a permissão de calendário do sistema — no
   * iOS, o app do calendário é o próprio Apple Calendar.
   */
  const connectAppleCalendar = async () => {
    try {
      const granted = await requestCalendarPermission();
      setConnections((c) => ({ ...c, appleCalendar: granted }));
      if (!granted) {
        Alert.alert(
          'Calendário Apple',
          'Permissão negada. Libere o acesso ao calendário nos ajustes do aparelho.'
        );
      }
    } catch {
      Alert.alert('Calendário Apple', 'Não foi possível acessar o calendário.');
    }
  };

  /**
   * WhatsApp: habilita o envio direto de mensagem ao aluno (botão na tela do
   * aluno). Não há automação de notificação por ora — só o disparo manual.
   */
  const connectWhatsApp = () => {
    if (!whatsapp.trim()) {
      return Alert.alert('WhatsApp', 'Preencha o seu WhatsApp acima antes de conectar.');
    }
    setConnections((c) => ({ ...c, whatsapp: true }));
  };

  const onSubmit = async () => {
    const name = fullName.trim();
    const zap = whatsapp.trim();
    if (!name) return setError('Informe o nome.');
    if (!zap) return setError('Informe o WhatsApp.');

    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        full_name: name,
        whatsapp: zap,
        phone: phone.trim() || null,
        cref: cref.trim(),
        city: city.trim(),
        state: uf.trim(),
        bio: bio.trim() || null,
      });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar o perfil.');
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: tokens.surface.page }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + spacing.lg }}>
        <ScreenHeader title="Perfil" subtitle="Editar dados pessoais" onBack={navigation.goBack} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.accent.base} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextInput
            label="Nome completo *"
            value={fullName}
            onChangeText={setFullName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="E-mail"
            value={emailRO}
            editable={false}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="WhatsApp *"
            value={whatsapp}
            onChangeText={setWhatsapp}
            keyboardType="phone-pad"
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Telefone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="CREF"
            value={cref}
            onChangeText={setCref}
            autoCapitalize="characters"
            mode="outlined"
            style={styles.input}
          />
          <View style={styles.row}>
            <TextInput
              label="Cidade"
              value={city}
              onChangeText={setCity}
              mode="outlined"
              style={[styles.input, styles.cityItem]}
            />
            <TextInput
              label="UF"
              value={uf}
              onChangeText={(t) => setUf(t.toUpperCase().slice(0, 2))}
              autoCapitalize="characters"
              maxLength={2}
              mode="outlined"
              style={[styles.input, styles.ufItem]}
            />
          </View>
          <TextInput
            label="Bio"
            value={bio}
            onChangeText={setBio}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={[styles.input, styles.multiline]}
          />

          <Text style={[styles.sectionTitle, { color: tokens.text.primary }]}>Conexões</Text>

          <ConnectionRow
            icon="apple"
            name="Calendário Apple"
            description="Sincroniza a sua agenda pessoal com os compromissos do app."
            connected={connections.appleCalendar}
            onConnect={connectAppleCalendar}
          />
          <ConnectionRow
            icon="whatsapp"
            name="WhatsApp"
            description="Habilita o envio direto de mensagem ao aluno."
            connected={connections.whatsapp}
            onConnect={connectWhatsApp}
          />

          {error && <ErrorState message={error} />}

          <TouchableRipple
            onPress={onSubmit}
            disabled={saving}
            style={[styles.submit, { backgroundColor: tokens.accent.base, opacity: saving ? 0.7 : 1 }]}
            borderless
          >
            <Text style={[styles.submitText, { color: tokens.text.onAccent }]}>
              {saving ? 'Salvando…' : 'Salvar alterações'}
            </Text>
          </TouchableRipple>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

/**
 * Uma conexão externa do personal. Google Agenda foi retirado: o calendário do
 * aparelho (Apple) já cobre a sincronização da agenda pessoal.
 */
type ConnectionId = 'appleCalendar' | 'whatsapp';

function ConnectionRow({
  icon,
  name,
  description,
  connected,
  onConnect,
}: {
  icon: string;
  name: string;
  description: string;
  connected: boolean;
  onConnect: () => void;
}) {
  const { tokens } = useAppTheme();

  return (
    <View style={[styles.connection, { backgroundColor: tokens.surface.card }]}>
      <View style={[styles.connectionIcon, { backgroundColor: tokens.surface.sunken }]}>
        <Icon source={icon} size={touch.glyph} color={tokens.accent.base} />
      </View>

      <View style={styles.connectionText}>
        <Text style={[styles.connectionName, { color: tokens.text.primary }]}>{name}</Text>
        <Text style={[styles.connectionDesc, { color: tokens.text.secondary }]}>
          {description}
        </Text>
      </View>

      <TouchableRipple
        onPress={onConnect}
        disabled={connected}
        style={[
          styles.connectBtn,
          {
            backgroundColor: connected ? tokens.success.subtle : tokens.accent.base,
          },
        ]}
        borderless
        accessibilityLabel={connected ? `${name} conectado` : `Conectar ${name}`}
      >
        <Text
          style={[
            styles.connectText,
            { color: connected ? tokens.success.base : tokens.text.onAccent },
          ]}
        >
          {connected ? 'Conectado' : 'Conectar'}
        </Text>
      </TouchableRipple>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xs },
  input: { marginBottom: spacing.xs },
  multiline: { minHeight: 88 },
  row: { flexDirection: 'row', gap: spacing.md },
  cityItem: { flex: 1 },
  ufItem: { width: 88 },

  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', marginTop: spacing.lg },
  connection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    minHeight: touch.min,
  },
  connectionIcon: {
    width: touch.circle,
    height: touch.circle,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionText: { flex: 1, gap: 2 },
  connectionName: { fontSize: fontSize.md, fontWeight: '600' },
  connectionDesc: { fontSize: fontSize.sm },
  connectBtn: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    minHeight: touch.min,
  },
  connectText: { fontSize: fontSize.sm, fontWeight: '700' },

  submit: {
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    minHeight: touch.min,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitText: { fontSize: fontSize.md, fontWeight: '700' },
});
