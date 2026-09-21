import { useState } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TextInput, Text, TouchableRipple, Icon } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader, ErrorState } from '../components/ui';
import { createAnnouncement } from '../api/endpoints';
import { useAppTheme, spacing, radius, fontSize, touch } from '../theme';
import type { ComunidadeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ComunidadeStackParamList, 'AvisoForm'>;

/**
 * Publicação de aviso no mural da comunidade. A tela só é alcançável pelo
 * admin (o FAB fica escondido para os demais) e a RLS recusa a escrita de
 * quem não é admin, então a proteção não depende da navegação.
 */
export function AvisoFormScreen({ navigation }: Props) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (publish: boolean) => {
    if (!title.trim()) return setError('Escreva um título para o aviso.');
    if (!body.trim()) return setError('Escreva o conteúdo do aviso.');

    setSaving(true);
    setError(null);
    try {
      await createAnnouncement({ title: title.trim(), body: body.trim(), pinned, publish });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível publicar o aviso.');
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: tokens.surface.page }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + spacing.lg }}>
        <ScreenHeader title="Novo aviso" subtitle="Vai para todos os personais" onBack={navigation.goBack} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          label="Título *"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          maxLength={120}
          style={styles.input}
        />
        <TextInput
          label="Aviso *"
          value={body}
          onChangeText={setBody}
          mode="outlined"
          multiline
          numberOfLines={8}
          style={[styles.input, styles.textarea]}
        />

        <TouchableRipple
          onPress={() => setPinned((p) => !p)}
          style={[styles.toggle, { backgroundColor: tokens.surface.card }]}
        >
          <View style={styles.toggleInner}>
            <Icon
              source={pinned ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={touch.glyph}
              color={pinned ? tokens.accent.base : tokens.text.muted}
            />
            <View style={styles.toggleText}>
              <Text style={[styles.toggleTitle, { color: tokens.text.primary }]}>Fixar no topo</Text>
              <Text style={[styles.toggleSubtitle, { color: tokens.text.secondary }]}>
                O aviso aparece antes dos demais no mural.
              </Text>
            </View>
          </View>
        </TouchableRipple>

        {error && <ErrorState message={error} />}

        <TouchableRipple
          onPress={() => submit(true)}
          disabled={saving}
          style={[styles.submit, { backgroundColor: tokens.accent.base, opacity: saving ? 0.7 : 1 }]}
          borderless
        >
          <Text style={[styles.submitText, { color: tokens.text.onAccent }]}>
            {saving ? 'Publicando…' : 'Publicar agora'}
          </Text>
        </TouchableRipple>

        <TouchableRipple
          onPress={() => submit(false)}
          disabled={saving}
          style={[styles.draft, { borderColor: tokens.surface.divider, backgroundColor: tokens.surface.card }]}
          borderless
        >
          <Text style={[styles.submitText, { color: tokens.text.primary }]}>Salvar como rascunho</Text>
        </TouchableRipple>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  input: { marginBottom: spacing.xs },
  textarea: { minHeight: 160 },

  toggle: { borderRadius: radius.md, marginTop: spacing.xs },
  toggleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    minHeight: touch.min,
  },
  toggleText: { flex: 1, gap: 2 },
  toggleTitle: { fontSize: fontSize.md, fontWeight: '600' },
  toggleSubtitle: { fontSize: fontSize.sm },

  submit: {
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    minHeight: touch.min,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  draft: {
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    minHeight: touch.min,
    alignItems: 'center',
    borderWidth: 1,
  },
  submitText: { fontSize: fontSize.md, fontWeight: '700' },
});
