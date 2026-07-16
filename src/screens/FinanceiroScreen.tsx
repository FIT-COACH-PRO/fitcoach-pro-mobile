import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, FAB } from 'react-native-paper';
import { ScreenHeader, StatusBadge, Card, EmptyState, type Tone } from '../components/ui';
import { useAppTheme, spacing, radius, fontSize } from '../theme';
import { samplePayments, sampleFinanceSummary, type SamplePayment } from '../data/sample';
import { formatCurrency } from '../lib/format';

const PAYMENT_META: Record<SamplePayment['status'], { label: string; tone: Tone }> = {
  paid: { label: 'Pago', tone: 'success' },
  pending: { label: 'Pendente', tone: 'warning' },
  overdue: { label: 'Atrasado', tone: 'danger' },
};

export function FinanceiroScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const payments = samplePayments;

  return (
    <View style={[styles.screen, { backgroundColor: tokens.surface.page, paddingTop: insets.top + spacing.lg }]}>
      <ScreenHeader title="Financeiro" subtitle="Controle de pagamentos" />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.summary}>
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryLabel, { color: tokens.text.secondary }]}>Recebido no mês</Text>
            <Text style={[styles.summaryValue, { color: tokens.success.base }]}>
              {formatCurrency(sampleFinanceSummary.receivedMonth)}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: tokens.surface.divider }]} />
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryLabel, { color: tokens.text.secondary }]}>Pendente</Text>
            <Text style={[styles.summaryValue, { color: tokens.warning.base }]}>
              {formatCurrency(sampleFinanceSummary.pending)}
            </Text>
          </View>
        </Card>

        <Text style={[styles.sectionTitle, { color: tokens.text.primary }]}>Pagamentos</Text>

        {payments.length === 0 ? (
          <EmptyState icon="cash-multiple" title="Sem lançamentos" subtitle="Nada para exibir." />
        ) : (
          payments.map((p) => <PaymentRow key={p.id} payment={p} />)
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: tokens.accent.base }]}
        color={tokens.text.onAccent}
        onPress={() => Alert.alert('Novo lançamento', 'Registro de pagamento em breve.')}
      />
    </View>
  );
}

function PaymentRow({ payment }: { payment: SamplePayment }) {
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
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, borderRadius: radius.lg },
});
