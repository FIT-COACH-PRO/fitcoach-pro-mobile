import { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, FAB, ActivityIndicator } from 'react-native-paper';
import { ScreenHeader, StatusBadge, Card, EmptyState, type Tone } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import { listPayments } from '../api/endpoints';
import { samplePayments, sampleFinanceSummary } from '../data/sample';
import { formatCurrency, formatVenc } from '../lib/format';
import { computeSummary, type FinanceSummary } from '../lib/finance';
import type { Payment } from '../types/database';
import type { PerfilStackParamList } from '../navigation/types';

const PAYMENT_META: Record<Payment['status'], { label: string; tone: Tone }> = {
  paid: { label: 'Pago', tone: 'success' },
  pending: { label: 'Pendente', tone: 'warning' },
  overdue: { label: 'Atrasado', tone: 'danger' },
  cancelled: { label: 'Cancelado', tone: 'neutral' },
};

type PayRow = { id: string; studentName: string; amount: number; dueLabel: string; status: Payment['status'] };

function toRow(p: Payment): PayRow {
  return {
    id: p.id,
    studentName: p.student?.full_name ?? 'Aluno',
    amount: p.amount,
    dueLabel: formatVenc(p.due_date),
    status: p.status,
  };
}

export function FinanceiroScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<PerfilStackParamList>>();

  const [rows, setRows] = useState<PayRow[] | null>(null);
  const [summary, setSummary] = useState<FinanceSummary>({ receivedMonth: 0, pending: 0 });

  const load = useCallback(async () => {
    try {
      const list = await listPayments();
      setRows(list.map(toRow));
      setSummary(computeSummary(list));
    } catch {
      // Sem sessão/backend: cai nos dados de exemplo para a tela não quebrar.
      setRows(
        samplePayments.map((s) => ({
          id: s.id,
          studentName: s.studentName,
          amount: s.amount,
          dueLabel: s.dueLabel,
          status: s.status,
        }))
      );
      setSummary({ receivedMonth: sampleFinanceSummary.receivedMonth, pending: sampleFinanceSummary.pending });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader title="Financeiro" subtitle="Controle de pagamentos" />

      {rows === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.accent.base} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.summary}>
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryLabel, { color: tokens.text.secondary }]}>Recebido no mês</Text>
              <Text style={[styles.summaryValue, { color: tokens.success.base }]}>
                {formatCurrency(summary.receivedMonth)}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: tokens.surface.divider }]} />
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryLabel, { color: tokens.text.secondary }]}>Pendente</Text>
              <Text style={[styles.summaryValue, { color: tokens.warning.base }]}>
                {formatCurrency(summary.pending)}
              </Text>
            </View>
          </Card>

          <Text style={[styles.sectionTitle, { color: tokens.text.primary }]}>Pagamentos</Text>

          {rows.length === 0 ? (
            <EmptyState icon="cash-multiple" title="Sem lançamentos" subtitle="Registre o 1º pagamento no botão +." />
          ) : (
            rows.map((p) => <PaymentRow key={p.id} payment={p} />)
          )}
        </ScrollView>
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: tokens.accent.base }]}
        color={tokens.text.onAccent}
        onPress={() => navigation.navigate('PagamentoForm')}
      />
    </View>
  );
}

function PaymentRow({ payment }: { payment: PayRow }) {
  const { tokens } = useAppTheme();
  const meta = PAYMENT_META[payment.status];
  return (
    <View style={[styles.row, { backgroundColor: tokens.surface.card }]}>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: tokens.text.primary }]} numberOfLines={1}>
          {payment.studentName}
        </Text>
        <Text style={[styles.rowDue, { color: tokens.text.secondary }]}>{payment.dueLabel}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowAmount, { color: tokens.text.primary }]}>
          {formatCurrency(payment.amount)}
        </Text>
        <StatusBadge label={meta.label} tone={meta.tone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 96, gap: spacing.md },

  summary: { flexDirection: 'row', alignItems: 'center' },
  summaryCol: { flex: 1, gap: spacing.xs },
  summaryDivider: { width: 1, alignSelf: 'stretch', marginHorizontal: spacing.md },
  summaryLabel: { fontSize: fontSize.sm },
  summaryValue: { fontSize: fontSize.lg, fontWeight: '700' },

  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', marginTop: spacing.xs },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { fontSize: fontSize.md, fontWeight: '600' },
  rowDue: { fontSize: fontSize.sm },
  rowRight: { alignItems: 'flex-end', gap: spacing.xs },
  rowAmount: { fontSize: fontSize.md, fontWeight: '700' },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, borderRadius: radius.pill },
});
