import { ReactNode } from 'react';
import { View, StyleSheet, ScrollView, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Icon, TouchableRipple } from 'react-native-paper';
import { useAppTheme, spacing, radius, fontSize } from '../theme';

/** Container de tela: fundo do tema + respeito ao safe-area no topo. */
export function Screen({
  children,
  scroll = false,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: insets.top + spacing.lg };

  if (scroll) {
    return (
      <ScrollView
        style={{ backgroundColor: tokens.surface.page }}
        contentContainerStyle={[styles.screenContent, pad, contentStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }
  return (
    <View style={[styles.screenFlex, pad, { backgroundColor: tokens.surface.page }]}>
      {children}
    </View>
  );
}

/** Cabeçalho grande com título + subtítulo, ação à direita e voltar opcional. */
export function ScreenHeader({
  title,
  subtitle,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onBack?: () => void;
}) {
  const { tokens } = useAppTheme();
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {onBack && (
          <TouchableRipple
            onPress={onBack}
            style={styles.backBtn}
            borderless
            accessibilityLabel="Voltar"
          >
            <Icon source="chevron-left" size={26} color={tokens.text.primary} />
          </TouchableRipple>
        )}
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: tokens.text.primary }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.headerSubtitle, { color: tokens.text.secondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {right}
    </View>
  );
}

/** Círculo com inicial (avatar de aluno). */
export function Avatar({
  name,
  color,
  size = 40,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  const { tokens } = useAppTheme();
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    >
      <Text style={[styles.avatarText, { color: tokens.text.onDark, fontSize: size * 0.4 }]}>
        {initial}
      </Text>
    </View>
  );
}

export type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

/** Cores de fill/texto por tom, a partir dos tokens do tema. */
export function useToneColors() {
  const { tokens } = useAppTheme();
  return (tone: Tone): { fill: string; fg: string } => {
    switch (tone) {
      case 'success':
        return { fill: tokens.success.subtle, fg: tokens.success.base };
      case 'warning':
        return { fill: tokens.warning.subtle, fg: tokens.warning.base };
      case 'danger':
        return { fill: tokens.danger.subtle, fg: tokens.danger.base };
      case 'accent':
        return { fill: tokens.accent.subtle, fg: tokens.accent.base };
      default:
        return { fill: tokens.surface.sunken, fg: tokens.text.secondary };
    }
  };
}

/** Badge de status (Ativo, Pausado, Pago…). */
export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  const colorsFor = useToneColors();
  const { fill, fg } = colorsFor(tone);
  return (
    <View style={[styles.badge, { backgroundColor: fill }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

/** Cartão base (superfície elevada). */
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { tokens } = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: tokens.surface.card }, style]}>{children}</View>
  );
}

export function EmptyState({
  icon = 'inbox-outline',
  title,
  subtitle,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
}) {
  const { tokens } = useAppTheme();
  return (
    <View style={styles.stateBox}>
      <View style={[styles.stateIcon, { backgroundColor: tokens.surface.sunken }]}>
        <Icon source={icon} size={24} color={tokens.text.secondary} />
      </View>
      <Text style={[styles.stateTitle, { color: tokens.text.primary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.stateSubtitle, { color: tokens.text.secondary }]}>{subtitle}</Text>
      )}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { tokens } = useAppTheme();
  return (
    <View style={[styles.errorBox, { backgroundColor: tokens.danger.subtle }]}>
      <Icon source="alert-circle-outline" size={20} color={tokens.danger.base} />
      <Text style={[styles.errorText, { color: tokens.danger.base }]}>{message}</Text>
      {onRetry && (
        <TouchableRipple onPress={onRetry} style={styles.retryBtn} borderless>
          <Text style={[styles.retryText, { color: tokens.danger.base }]}>Tentar de novo</Text>
        </TouchableRipple>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenFlex: { flex: 1 },
  screenContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.xs },
  backBtn: { borderRadius: radius.pill, padding: 2, marginLeft: -4 },
  headerText: { flex: 1, gap: 2 },
  headerTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  headerSubtitle: { fontSize: fontSize.sm },

  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700' },

  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: '600' },

  card: { borderRadius: radius.lg, padding: spacing.lg },

  stateBox: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  stateIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: { fontSize: fontSize.md, fontWeight: '600' },
  stateSubtitle: { fontSize: fontSize.sm, textAlign: 'center' },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  errorText: { flex: 1, fontSize: fontSize.sm },
  retryBtn: { paddingHorizontal: spacing.sm, paddingVertical: 2 },
  retryText: { fontSize: fontSize.sm, fontWeight: '600' },
});
