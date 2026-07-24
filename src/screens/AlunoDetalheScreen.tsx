import { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Text, Icon, TouchableRipple, ActivityIndicator } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenHeader, StatusBadge, Card, EmptyState, type Tone } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import { getStudent } from '../api/endpoints';
import { sampleStudents, type SampleStudent, type StudentStatus } from '../data/sample';
import type { Student } from '../types/database';
import type { AlunosStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AlunosStackParamList, 'AlunoDetalhe'>;

const STATUS_META: Record<StudentStatus, { label: string; tone: Tone }> = {
  active: { label: 'Ativo', tone: 'success' },
  paused: { label: 'Pausado', tone: 'warning' },
  inactive: { label: 'Inativo', tone: 'neutral' },
};

const ACTIONS = [
  { key: 'anamnese', label: 'Anamnese', icon: 'clipboard-text-outline' },
  { key: 'avaliacoes', label: 'Avaliações', icon: 'chart-box-outline' },
  { key: 'fotos', label: 'Fotos', icon: 'image-multiple-outline' },
  { key: 'treinos', label: 'Treinos', icon: 'dumbbell' },
] as const;

/** Forma que a tela de detalhe consome, alimentada por dado real ou exemplo. */
type DetailView = {
  name: string;
  status: StudentStatus;
  weightKg?: number;
  heightM?: number;
  bmi?: number;
  age?: number;
  email?: string;
  phone?: string;
  objective?: string;
  restrictions?: string;
};

function ageFrom(birth: string | null): number | undefined {
  if (!birth) return undefined;
  const d = new Date(birth);
  if (Number.isNaN(d.getTime())) return undefined;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a >= 0 ? a : undefined;
}

function fromStudent(s: Student): DetailView {
  // altura pode vir em metros (1.68) ou centímetros (168); normaliza para metros.
  const heightM = s.height != null ? (s.height > 3 ? s.height / 100 : s.height) : undefined;
  const weightKg = s.weight ?? undefined;
  const bmi = weightKg != null && heightM ? weightKg / (heightM * heightM) : undefined;
  return {
    name: s.full_name,
    status: s.status,
    weightKg,
    heightM,
    bmi,
    age: ageFrom(s.birth_date),
    email: s.email ?? undefined,
    phone: s.whatsapp || undefined,
    objective: s.objective ?? undefined,
    restrictions: s.restrictions ?? s.injuries ?? undefined,
  };
}

function fromSample(s: SampleStudent): DetailView {
  return {
    name: s.name,
    status: s.status,
    weightKg: s.weightKg,
    heightM: s.heightM,
    bmi: s.bmi,
    age: s.age,
    email: s.email,
    phone: s.phone,
    objective: s.objective,
    restrictions: s.restrictions,
  };
}

export function AlunoDetalheScreen({ route, navigation }: Props) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { studentId } = route.params;

  const [student, setStudent] = useState<DetailView | null>(null);
  const [loading, setLoading] = useState(true);

  // Recarrega ao focar (reflete edições ao voltar do formulário).
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        try {
          const real = await getStudent(studentId);
          if (alive) setStudent(fromStudent(real));
        } catch {
          // Offline/demo: tenta os dados de exemplo pelo mesmo id.
          const sample = sampleStudents.find((s) => s.id === studentId);
          if (alive) setStudent(sample ? fromSample(sample) : null);
        } finally {
          if (alive) setLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, [studentId])
  );

  if (loading) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: tokens.surface.page }]}>
        <ActivityIndicator color={tokens.accent.base} />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
        <ScreenHeader title="Aluno" onBack={navigation.goBack} />
        <EmptyState icon="account-off-outline" title="Aluno não encontrado" />
      </View>
    );
  }

  const meta = STATUS_META[student.status];
  const openWhatsApp = () => {
    const num = (student.phone ?? '').replace(/\D/g, '');
    if (!num) return Alert.alert('WhatsApp', 'Sem número cadastrado.');
    Linking.openURL(`https://wa.me/55${num}`).catch(() =>
      Alert.alert('WhatsApp', 'Não foi possível abrir o WhatsApp.')
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader
        title={student.name}
        onBack={navigation.goBack}
        right={<StatusBadge label={meta.label} tone={meta.tone} />}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.actionsTop}>
          <TouchableRipple
            onPress={openWhatsApp}
            style={[styles.primaryBtn, { backgroundColor: tokens.success.base }]}
            borderless
          >
            <View style={styles.btnInner}>
              <Icon source="whatsapp" size={18} color={tokens.text.onDark} />
              <Text style={[styles.btnText, { color: tokens.text.onDark }]}>WhatsApp</Text>
            </View>
          </TouchableRipple>
          <TouchableRipple
            onPress={() => navigation.navigate('AlunoForm', { studentId })}
            style={[styles.outlineBtn, { borderColor: tokens.surface.divider, backgroundColor: tokens.surface.card }]}
            borderless
          >
            <View style={styles.btnInner}>
              <Icon source="pencil-outline" size={18} color={tokens.text.primary} />
              <Text style={[styles.btnText, { color: tokens.text.primary }]}>Editar</Text>
            </View>
          </TouchableRipple>
        </View>

        <View style={styles.statsRow}>
          <Stat value={student.weightKg != null ? `${student.weightKg} kg` : '—'} label="Peso" />
          <Stat value={student.heightM != null ? `${student.heightM.toFixed(2)} m` : '—'} label="Altura" />
          <Stat value={student.bmi != null ? student.bmi.toFixed(1) : '—'} label="IMC" />
          <Stat value={student.age != null ? String(student.age) : '—'} label="Idade" />
        </View>

        <InfoCard icon="email-outline" title="Contato" tone="accent">
          {`${student.email ?? '—'}${student.phone ? `\n${student.phone}` : ''}`}
        </InfoCard>
        <InfoCard icon="target" title="Objetivo" tone="success">
          {student.objective ?? '—'}
        </InfoCard>
        <InfoCard icon="shield-alert-outline" title="Lesões/Restrições" tone="warning">
          {student.restrictions ?? 'Nenhuma restrição registrada.'}
        </InfoCard>

        <View style={styles.grid}>
          {ACTIONS.map((a) => (
            <TouchableRipple
              key={a.key}
              onPress={() => Alert.alert(a.label, 'Seção em breve.')}
              style={[styles.gridItem, { backgroundColor: tokens.surface.card }]}
              borderless
            >
              <View style={styles.gridInner}>
                <View style={[styles.gridIcon, { backgroundColor: tokens.surface.sunken }]}>
                  <Icon source={a.icon} size={20} color={tokens.accent.base} />
                </View>
                <Text style={[styles.gridLabel, { color: tokens.text.primary }]}>{a.label}</Text>
              </View>
            </TouchableRipple>
          ))}
        </View>

        <Card style={styles.iaCard}>
          <View style={styles.iaHeader}>
            <View style={[styles.gridIcon, { backgroundColor: tokens.surface.sunken }]}>
              <Icon source="robot-outline" size={20} color={tokens.accent.base} />
            </View>
            <View style={styles.iaText}>
              <Text style={[styles.iaTitle, { color: tokens.text.primary }]}>Insights com IA</Text>
              <Text style={[styles.iaSubtitle, { color: tokens.text.secondary }]}>
                Resumo de evolução e risco
              </Text>
            </View>
          </View>
          <TouchableRipple
            onPress={() => Alert.alert('Insights com IA', 'Geração de insights em breve.')}
            style={[styles.iaBtn, { backgroundColor: tokens.accent.base }]}
            borderless
          >
            <Text style={[styles.btnText, { color: tokens.text.onAccent }]}>Gerar insights</Text>
          </TouchableRipple>
        </Card>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const { tokens } = useAppTheme();
  return (
    <View style={[styles.stat, { backgroundColor: tokens.surface.card }]}>
      <Text style={[styles.statValue, { color: tokens.text.primary }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: tokens.text.secondary }]}>{label}</Text>
    </View>
  );
}

function InfoCard({
  icon,
  title,
  tone,
  children,
}: {
  icon: string;
  title: string;
  tone: Tone;
  children: string;
}) {
  const { tokens } = useAppTheme();
  const iconColor =
    tone === 'success' ? tokens.success.base : tone === 'warning' ? tokens.warning.base : tokens.accent.base;
  return (
    <Card style={styles.infoCard}>
      <View style={[styles.gridIcon, { backgroundColor: tokens.surface.sunken }]}>
        <Icon source={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.infoText}>
        <Text style={[styles.infoTitle, { color: tokens.text.primary }]}>{title}</Text>
        <Text style={[styles.infoBody, { color: tokens.text.secondary }]}>{children}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },

  actionsTop: { flexDirection: 'row', gap: spacing.sm },
  primaryBtn: { flex: 1, borderRadius: radius.md, paddingVertical: spacing.md },
  outlineBtn: { flex: 1, borderRadius: radius.md, paddingVertical: spacing.md, borderWidth: 1 },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  btnText: { fontSize: fontSize.md, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', gap: 2 },
  statValue: { fontSize: fontSize.lg, fontWeight: '700' },
  statLabel: { fontSize: fontSize.xs },

  infoCard: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  infoText: { flex: 1, gap: 2 },
  infoTitle: { fontSize: fontSize.md, fontWeight: '600' },
  infoBody: { fontSize: fontSize.sm, lineHeight: 20 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridItem: { flexGrow: 1, flexBasis: '47%', borderRadius: radius.md },
  gridInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  gridIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLabel: { fontSize: fontSize.md, fontWeight: '600' },

  iaCard: { gap: spacing.md },
  iaHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iaText: { flex: 1, gap: 2 },
  iaTitle: { fontSize: fontSize.md, fontWeight: '600' },
  iaSubtitle: { fontSize: fontSize.sm },
  iaBtn: { borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
});
