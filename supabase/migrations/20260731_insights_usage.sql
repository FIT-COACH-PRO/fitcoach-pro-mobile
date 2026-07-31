-- Piloto — Fase 1: limite diário de insights de IA por personal (5/dia),
-- contado no servidor (Edge Function student-insights), não no app.
-- Rodar manualmente no SQL Editor do Supabase ANTES de fazer deploy da
-- Edge Function atualizada e ANTES de ligar INSIGHTS_ENABLED no app.

CREATE TABLE IF NOT EXISTS insights_usage (
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (trainer_id, usage_date)
);

ALTER TABLE insights_usage ENABLE ROW LEVEL SECURITY;

-- Mesmo padrão das demais tabelas do trainer (ver schema.sql): só o dono lê/escreve a própria linha.
CREATE POLICY "insights_usage_own_trainer" ON insights_usage FOR ALL USING (auth.uid() = trainer_id);
