import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput, Text, TouchableRipple, ActivityIndicator } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader, ErrorState } from '../components/ui';
import { getProfile, updateProfile } from '../api/endpoints';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import type { PerfilStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<PerfilStackParamList, 'PerfilForm'>;

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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xs },
  input: { marginBottom: spacing.xs },
  multiline: { minHeight: 88 },
  row: { flexDirection: 'row', gap: spacing.md },
  cityItem: { flex: 1 },
  ufItem: { width: 88 },

  submit: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitText: { fontSize: fontSize.md, fontWeight: '700' },
});
