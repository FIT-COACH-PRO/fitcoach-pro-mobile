import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme, spacing, radius, fontSize } from '../theme';

/**
 * Gráfico de barras feito só com View/StyleSheet.
 *
 * ⚠️  Proposital: o projeto NÃO tem biblioteca de gráficos instalada
 * (react-native-svg, victory-native…) e adicionar dependência não estava
 * autorizado. Para as duas telas que precisam de evolução (progresso do aluno e
 * produtividade do personal) um gráfico de colunas resolve. Se depois entrar
 * uma lib de gráficos, este componente pode ser trocado sem mexer nas telas.
 */

export type BarDatum = {
  label: string;
  value: number;
  /** Texto exibido no topo da barra; default é o valor arredondado. */
  display?: string;
};

export function BarChart({
  data,
  height = 140,
  color,
  /**
   * `true` escala pelo intervalo (mín→máx) em vez de partir do zero. Usar em
   * séries que variam pouco perto de um valor alto, como peso (68–72 kg):
   * partindo do zero todas as barras ficariam iguais.
   */
  relative = false,
  emptyLabel = 'Sem dados suficientes.',
}: {
  data: BarDatum[];
  height?: number;
  color?: string;
  relative?: boolean;
  emptyLabel?: string;
}) {
  const { tokens } = useAppTheme();
  const barColor = color ?? tokens.accent.base;

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={{ color: tokens.text.secondary, fontSize: fontSize.sm }}>{emptyLabel}</Text>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min;

  // Fração da altura de cada barra. No modo relativo a menor barra ainda
  // aparece (piso de 18%), senão a série viraria uma barra só.
  const fractionOf = (value: number): number => {
    if (max <= 0 && min >= 0 && span === 0) return 0;
    if (relative && span > 0) return 0.18 + 0.82 * ((value - min) / span);
    if (relative) return 0.6; // todos os valores iguais
    return max > 0 ? value / max : 0;
  };

  return (
    <View>
      <View style={[styles.plot, { height }]}>
        {data.map((d, i) => {
          const fraction = fractionOf(d.value);
          const isZero = d.value <= 0;
          return (
            <View key={`${d.label}-${i}`} style={styles.column}>
              <Text
                style={[styles.value, { color: tokens.text.secondary }]}
                numberOfLines={1}
              >
                {d.display ?? String(Math.round(d.value))}
              </Text>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(3, fraction * (height - 34)),
                    backgroundColor: isZero ? tokens.surface.sunken : barColor,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.axis}>
        {data.map((d, i) => (
          <Text
            key={`${d.label}-axis-${i}`}
            style={[styles.axisLabel, { color: tokens.text.muted }]}
            numberOfLines={1}
          >
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plot: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  column: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: spacing.xs },
  bar: { width: '70%', borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm },
  value: { fontSize: fontSize.xs, fontWeight: '600' },

  axis: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  axisLabel: { flex: 1, fontSize: fontSize.xs, textAlign: 'center' },

  empty: { alignItems: 'center', justifyContent: 'center' },
});
