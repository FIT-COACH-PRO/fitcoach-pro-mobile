-- ============================================================
-- FITCOACH PRO - Programas, progresso, cargas, agenda e comunidade
-- ============================================================
--
-- NÃO APLICADA AUTOMATICAMENTE. Rode no SQL Editor do Supabase depois de ler.
-- O único comando que remove algo é o DROP da constraint EXCLUDE de `sessions`
-- (seção 4), recriada logo em seguida como parcial — nenhuma linha é apagada.
--
-- Observações de adaptação ao schema existente (001-005):
-- - Treino != Exercício JÁ está modelado: workouts -> workout_days ->
--   workout_exercises, com o catálogo em exercise_library. Nada foi recriado.
--   A única lacuna era workout_exercises.exercise_name ser texto solto, sem
--   ligação com o catálogo — resolvida abaixo com uma FK OPCIONAL (seção 0),
--   sem quebrar os treinos que já existem.
-- - O vínculo treino<->aluno já existe em student_workout_schedules; os
--   programas (seção 1) reaproveitam essa tabela em vez de criar um vínculo
--   paralelo.
-- - O campo de vencimento do aluno já existe (students.subscription_end); a
--   seção 7 só torna a janela do alerta parametrizável por personal.

-- ============================================================
-- 0. LIGAÇÃO COM O CATÁLOGO DE EXERCÍCIOS (pré-requisito das seções 3 e 5)
-- ============================================================
-- Coluna opcional: treinos antigos continuam válidos com exercise_name solto.
ALTER TABLE workout_exercises
  ADD COLUMN IF NOT EXISTS exercise_id UUID REFERENCES exercise_library(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id
  ON workout_exercises(exercise_id);

-- ============================================================
-- 1. PROGRAMAS / MESOCICLOS (bundle de treinos)
-- ============================================================
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INT CHECK (duration_weeks > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sequência de treinos dentro do programa. `weekday` alimenta o dia da semana
-- de student_workout_schedules na hora de atribuir o programa a um aluno.
CREATE TABLE IF NOT EXISTS program_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  weekday INT NOT NULL DEFAULT 1 CHECK (weekday BETWEEN 0 AND 6),
  workout_label TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (program_id, position)
);

-- Reaproveita o vínculo treino<->aluno existente: atribuir um programa cria
-- uma linha por treino ali, marcada com o programa de origem.
ALTER TABLE student_workout_schedules
  ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_programs_trainer_id ON programs(trainer_id);
CREATE INDEX IF NOT EXISTS idx_program_workouts_program_id ON program_workouts(program_id);
CREATE INDEX IF NOT EXISTS idx_schedules_program_id ON student_workout_schedules(program_id);

-- ============================================================
-- 2. HISTÓRICO DE PROGRESSO DO ALUNO (snapshots)
-- ============================================================
-- Cada atualização é uma linha nova — nada é sobrescrito, para dar série
-- temporal ao gráfico de evolução. `evaluations` continua sendo a avaliação
-- física completa; aqui é só o acompanhamento rápido de peso/IMC.
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recorded_on DATE NOT NULL DEFAULT CURRENT_DATE,
  weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
  -- Altura aceita metros (1.68) ou centímetros (168), como o resto do app.
  height DECIMAL(5,2) CHECK (height > 0),
  bmi DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN height IS NULL OR height <= 0 THEN NULL
      WHEN height > 3 THEN weight / ((height / 100) * (height / 100))
      ELSE weight / (height * height)
    END
  ) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_progress_student
  ON student_progress(student_id, recorded_on DESC);

-- ============================================================
-- 3. HISTÓRICO DE CARGAS POR EXERCÍCIO
-- ============================================================
-- Uma linha por série executada. exercise_name é gravado junto de propósito:
-- se o treino for apagado, o histórico continua legível.
CREATE TABLE IF NOT EXISTS exercise_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE SET NULL,
  exercise_id UUID REFERENCES exercise_library(id) ON DELETE SET NULL,
  exercise_name TEXT NOT NULL,
  performed_on DATE NOT NULL DEFAULT CURRENT_DATE,
  set_number INT NOT NULL DEFAULT 1 CHECK (set_number > 0),
  reps INT CHECK (reps >= 0),
  weight_kg DECIMAL(6,2) CHECK (weight_kg >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_student
  ON exercise_logs(student_id, performed_on DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise
  ON exercise_logs(student_id, exercise_name, performed_on DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout_exercise
  ON exercise_logs(workout_exercise_id);

-- ============================================================
-- 4. CONFLITO DE HORÁRIO SÓ ENTRE AULAS PRESENCIAIS
-- ============================================================
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS modalidade TEXT NOT NULL DEFAULT 'presencial'
  CHECK (modalidade IN ('presencial', 'online'));

-- A migration 002 criou uma EXCLUDE sem nome explícito (o Postgres gerou algo
-- como sessions_trainer_id_tstzrange_excl). Remove qualquer constraint de
-- exclusão em sessions e recria restrita a 'presencial'. Só a constraint é
-- derrubada — as aulas já agendadas permanecem.
DO $$
DECLARE
  c text;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.sessions'::regclass AND contype = 'x'
  LOOP
    EXECUTE format('ALTER TABLE public.sessions DROP CONSTRAINT %I;', c);
  END LOOP;
END $$;

-- Online não conflita com nada (nem com outra online, nem com presencial).
ALTER TABLE sessions
  ADD CONSTRAINT sessions_presencial_no_overlap
  EXCLUDE USING gist (
    trainer_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  ) WHERE (modalidade = 'presencial');

CREATE INDEX IF NOT EXISTS idx_sessions_modalidade ON sessions(modalidade);

-- ============================================================
-- 5. EXERCÍCIO SUBSTITUTO (relação estática, sem IA)
-- ============================================================
CREATE TABLE IF NOT EXISTS exercise_substitutes (
  exercise_id UUID NOT NULL REFERENCES exercise_library(id) ON DELETE CASCADE,
  substitute_id UUID NOT NULL REFERENCES exercise_library(id) ON DELETE CASCADE,
  -- Dono da relação; NULL = sugestão global (mesma ideia de exercise_library).
  trainer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (exercise_id, substitute_id),
  CHECK (exercise_id <> substitute_id)
);

CREATE INDEX IF NOT EXISTS idx_exercise_substitutes_substitute
  ON exercise_substitutes(substitute_id);

-- ============================================================
-- 7. JANELA DO ALERTA DE VENCIMENTO (parametrizável por personal)
-- ============================================================
-- O campo de vencimento já existe: students.subscription_end. Aqui só entra
-- com quantos dias de antecedência o personal quer ser avisado.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS renewal_alert_days INT NOT NULL DEFAULT 7
  CHECK (renewal_alert_days BETWEEN 1 AND 90);

-- ============================================================
-- 9. COMUNIDADE - CANAL DE AVISOS DO ADMIN (mural somente leitura)
-- ============================================================
CREATE TABLE IF NOT EXISTS community_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_announcements_published
  ON community_announcements(published_at DESC) WHERE published_at IS NOT NULL;

-- Checa is_admin sem depender da RLS de profiles dentro da policy.
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM profiles WHERE id = auth.uid()), false);
$$;

REVOKE ALL ON FUNCTION public.is_app_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_app_admin() TO authenticated;

-- ============================================================
-- TRIGGERS de updated_at (função criada na migration 001)
-- ============================================================
DROP TRIGGER IF EXISTS update_programs_updated_at ON programs;
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_announcements_updated_at ON community_announcements;
CREATE TRIGGER update_community_announcements_updated_at BEFORE UPDATE ON community_announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_substitutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "programs_own_trainer" ON programs;
CREATE POLICY "programs_own_trainer" ON programs
  FOR ALL USING (auth.uid() = trainer_id);

-- program_workouts não tem trainer_id: o dono vem do programa (mesmo padrão
-- de workout_days/workout_exercises na migration 001).
DROP POLICY IF EXISTS "program_workouts_own_trainer" ON program_workouts;
CREATE POLICY "program_workouts_own_trainer" ON program_workouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM programs p WHERE p.id = program_id AND p.trainer_id = auth.uid())
  );

DROP POLICY IF EXISTS "student_progress_own_trainer" ON student_progress;
CREATE POLICY "student_progress_own_trainer" ON student_progress
  FOR ALL USING (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "exercise_logs_own_trainer" ON exercise_logs;
CREATE POLICY "exercise_logs_own_trainer" ON exercise_logs
  FOR ALL USING (auth.uid() = trainer_id);

-- Leitura: sugestões próprias ou globais (espelha exercise_library_own_or_global).
DROP POLICY IF EXISTS "exercise_substitutes_own_or_global" ON exercise_substitutes;
CREATE POLICY "exercise_substitutes_own_or_global" ON exercise_substitutes
  FOR SELECT USING (trainer_id = auth.uid() OR trainer_id IS NULL);

DROP POLICY IF EXISTS "exercise_substitutes_manage_own" ON exercise_substitutes;
CREATE POLICY "exercise_substitutes_manage_own" ON exercise_substitutes
  FOR ALL USING (trainer_id = auth.uid()) WITH CHECK (trainer_id = auth.uid());

-- Mural: todo personal autenticado lê o que está publicado; só o admin escreve.
DROP POLICY IF EXISTS "announcements_read_published" ON community_announcements;
CREATE POLICY "announcements_read_published" ON community_announcements
  FOR SELECT TO authenticated
  USING (published_at IS NOT NULL OR public.is_app_admin());

DROP POLICY IF EXISTS "announcements_admin_writes" ON community_announcements;
CREATE POLICY "announcements_admin_writes" ON community_announcements
  FOR ALL TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin() AND author_id = auth.uid());

-- Defesa em profundidade, no mesmo espírito da migration 005.
REVOKE ALL ON programs, program_workouts, student_progress, exercise_logs,
  exercise_substitutes, community_announcements FROM anon;
