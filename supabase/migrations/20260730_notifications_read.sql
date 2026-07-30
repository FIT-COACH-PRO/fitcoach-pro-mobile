-- Redesign Dark UI — Fase 2: ponto de "não lida" no sino do cabeçalho.
-- Rodar manualmente no SQL Editor do Supabase (projeto de produção) ANTES
-- de considerar a Fase 2 do redesign concluída. O app mobile assume que
-- essas colunas existem a partir do momento em que o código da Fase 2 for
-- escrito.

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_notifications_trainer_read
  ON notifications(trainer_id, read);
