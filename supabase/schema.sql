-- FitCoach — schema completo (gerado das migrations do fitcoach-pro)
-- Rode inteiro no SQL Editor do Supabase, uma vez, num projeto vazio.


-- ============================================================
-- ARQUIVO: 001_initial_schema.sql
-- ============================================================
-- ============================================================
-- FITCOACH PRO - Schema Inicial
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABELA: profiles (Personal Trainers)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  cref TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  whatsapp TEXT NOT NULL,
  phone TEXT,
  birth_date DATE NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: students (Alunos)
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  objective TEXT,
  injuries TEXT,
  restrictions TEXT,
  observations TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused')),
  subscription_start DATE,
  subscription_end DATE,
  monthly_fee DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: anamnese (Ficha de Anamnese)
-- ============================================================
CREATE TABLE IF NOT EXISTS anamnese (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  health_history TEXT,
  injuries TEXT,
  surgeries TEXT,
  medications TEXT,
  objectives TEXT,
  physical_activity_history TEXT,
  smoker BOOLEAN DEFAULT false,
  alcohol BOOLEAN DEFAULT false,
  sleep_hours INT,
  stress_level INT CHECK (stress_level BETWEEN 1 AND 10),
  additional_info TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: evaluations (Avaliações Físicas)
-- ============================================================
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  body_fat DECIMAL(5,2),
  lean_mass DECIMAL(5,2),
  bmi DECIMAL(5,2),
  -- Circunferências
  neck DECIMAL(5,2),
  chest DECIMAL(5,2),
  waist DECIMAL(5,2),
  abdomen DECIMAL(5,2),
  hip DECIMAL(5,2),
  right_arm DECIMAL(5,2),
  left_arm DECIMAL(5,2),
  right_forearm DECIMAL(5,2),
  left_forearm DECIMAL(5,2),
  right_thigh DECIMAL(5,2),
  left_thigh DECIMAL(5,2),
  right_calf DECIMAL(5,2),
  left_calf DECIMAL(5,2),
  -- Dobras cutâneas
  tricep_fold DECIMAL(5,2),
  subscapular_fold DECIMAL(5,2),
  suprailiac_fold DECIMAL(5,2),
  abdominal_fold DECIMAL(5,2),
  thigh_fold DECIMAL(5,2),
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: photos (Fotos de Evolução)
-- ============================================================
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT CHECK (photo_type IN ('front', 'back', 'side_left', 'side_right')),
  taken_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: exercise_library (Biblioteca de Exercícios)
-- ============================================================
CREATE TABLE IF NOT EXISTS exercise_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  muscle_group TEXT,
  equipment TEXT,
  description TEXT,
  video_url TEXT,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: workouts (Treinos)
-- ============================================================
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'custom' CHECK (type IN ('custom', 'template', 'ai_generated')),
  goal TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_weeks INT,
  days_per_week INT,
  is_template BOOLEAN DEFAULT false,
  template_category TEXT,
  ai_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: workout_days (Dias do Treino)
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  day_label TEXT NOT NULL,
  day_order INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: workout_exercises (Exercícios do Treino)
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_day_id UUID NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets INT,
  reps TEXT,
  rest_seconds INT,
  weight TEXT,
  tempo TEXT,
  notes TEXT,
  exercise_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: student_workout_schedules (Agenda de Treinos)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_workout_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  weekday INT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  workout_label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: payments (Pagamentos)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('pix', 'cash', 'transfer', 'card', 'other')),
  reference_month DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: notifications (Notificações/Automações)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'workout_reminder', 'inactivity_alert', 'renewal_reminder',
    'payment_due', 'payment_received', 'general'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channel TEXT DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'email', 'push')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: two_factor_codes (Códigos 2FA)
-- ============================================================
CREATE TABLE IF NOT EXISTS two_factor_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  device_fingerprint TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: audit_logs (Auditoria)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: trusted_devices (Dispositivos Confiáveis)
-- ============================================================
CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_fingerprint)
);

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON workouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workout_exercises_updated_at BEFORE UPDATE ON workout_exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_anamnese_updated_at BEFORE UPDATE ON anamnese FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNÇÃO: criar profile ao registrar usuário
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, cpf, cref, whatsapp, birth_date, city, state)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
    COALESCE(NEW.raw_user_meta_data->>'cref', ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
    COALESCE((NEW.raw_user_meta_data->>'birth_date')::DATE, CURRENT_DATE),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'state', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnese ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_workout_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;

-- profiles: cada trainer acessa apenas seu próprio perfil
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

-- students: trainer acessa apenas seus alunos
CREATE POLICY "students_own_trainer" ON students FOR ALL USING (auth.uid() = trainer_id);

-- anamnese
CREATE POLICY "anamnese_own_trainer" ON anamnese FOR ALL USING (auth.uid() = trainer_id);

-- evaluations
CREATE POLICY "evaluations_own_trainer" ON evaluations FOR ALL USING (auth.uid() = trainer_id);

-- photos
CREATE POLICY "photos_own_trainer" ON photos FOR ALL USING (auth.uid() = trainer_id);

-- exercise_library: trainer vê sua biblioteca + globais
CREATE POLICY "exercise_library_own_or_global" ON exercise_library
  FOR SELECT USING (auth.uid() = trainer_id OR is_global = true);
CREATE POLICY "exercise_library_manage_own" ON exercise_library
  FOR ALL USING (auth.uid() = trainer_id);

-- workouts
CREATE POLICY "workouts_own_trainer" ON workouts FOR ALL USING (auth.uid() = trainer_id);

-- workout_days via workout
CREATE POLICY "workout_days_own_trainer" ON workout_days
  FOR ALL USING (
    workout_id IN (SELECT id FROM workouts WHERE trainer_id = auth.uid())
  );

-- workout_exercises via workout
CREATE POLICY "workout_exercises_own_trainer" ON workout_exercises
  FOR ALL USING (
    workout_id IN (SELECT id FROM workouts WHERE trainer_id = auth.uid())
  );

-- student_workout_schedules
CREATE POLICY "schedules_own_trainer" ON student_workout_schedules FOR ALL USING (auth.uid() = trainer_id);

-- payments
CREATE POLICY "payments_own_trainer" ON payments FOR ALL USING (auth.uid() = trainer_id);

-- notifications
CREATE POLICY "notifications_own_trainer" ON notifications FOR ALL USING (auth.uid() = trainer_id);

-- two_factor_codes: apenas o próprio usuário
CREATE POLICY "2fa_own_user" ON two_factor_codes FOR ALL USING (auth.uid() = user_id);

-- audit_logs: apenas leitura pelo próprio usuário
CREATE POLICY "audit_logs_own_user" ON audit_logs FOR SELECT USING (auth.uid() = user_id);

-- trusted_devices
CREATE POLICY "trusted_devices_own_user" ON trusted_devices FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_students_trainer_id ON students(trainer_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_workouts_trainer_id ON workouts(trainer_id);
CREATE INDEX IF NOT EXISTS idx_workouts_student_id ON workouts(student_id);
CREATE INDEX IF NOT EXISTS idx_workout_days_workout_id ON workout_days(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_day_id ON workout_exercises(workout_day_id);
CREATE INDEX IF NOT EXISTS idx_payments_trainer_id ON payments(trainer_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_notifications_trainer_id ON notifications(trainer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_evaluations_student_id ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_photos_student_id ON photos(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_codes_user_id ON two_factor_codes(user_id);

-- ============================================================
-- DADOS INICIAIS: Biblioteca de Exercícios Global
-- ============================================================
INSERT INTO exercise_library (name, category, muscle_group, equipment, is_global) VALUES
('Supino Reto com Barra', 'Força', 'Peito', 'Barra + Banco', true),
('Supino Inclinado com Halteres', 'Força', 'Peito Superior', 'Halteres + Banco', true),
('Crossover', 'Isolamento', 'Peito', 'Cabos', true),
('Peck Deck', 'Isolamento', 'Peito', 'Máquina', true),
('Puxada Frontal', 'Força', 'Costas', 'Máquina', true),
('Remada Curvada', 'Força', 'Costas', 'Barra', true),
('Remada Unilateral', 'Força', 'Costas', 'Halter', true),
('Levantamento Terra', 'Força', 'Posterior', 'Barra', true),
('Desenvolvimento com Barra', 'Força', 'Ombros', 'Barra', true),
('Desenvolvimento com Halteres', 'Força', 'Ombros', 'Halteres', true),
('Elevação Lateral', 'Isolamento', 'Ombros', 'Halteres', true),
('Rosca Direta', 'Isolamento', 'Bíceps', 'Barra', true),
('Rosca Alternada', 'Isolamento', 'Bíceps', 'Halteres', true),
('Tríceps Pulley', 'Isolamento', 'Tríceps', 'Cabo', true),
('Tríceps Francês', 'Isolamento', 'Tríceps', 'Halter', true),
('Agachamento Livre', 'Força', 'Quadríceps', 'Barra', true),
('Leg Press 45°', 'Força', 'Quadríceps', 'Máquina', true),
('Extensão de Pernas', 'Isolamento', 'Quadríceps', 'Máquina', true),
('Cadeira Flexora', 'Isolamento', 'Posterior', 'Máquina', true),
('Stiff', 'Força', 'Posterior', 'Barra', true),
('Panturrilha em Pé', 'Isolamento', 'Panturrilha', 'Máquina', true),
('Abdominal Crunch', 'Core', 'Abdômen', 'Peso Corporal', true),
('Prancha', 'Core', 'Core', 'Peso Corporal', true),
('Cardio - Esteira', 'Cardio', 'Geral', 'Esteira', true),
('Cardio - Bicicleta', 'Cardio', 'Geral', 'Bicicleta', true),
('Cardio - Elíptico', 'Cardio', 'Geral', 'Elíptico', true)
ON CONFLICT DO NOTHING;


-- ============================================================
-- ARQUIVO: 002_admin.sql
-- ============================================================
-- ============================================================
-- FITCOACH PRO - Acesso Admin
-- ============================================================

-- Adiciona coluna is_admin na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- ============================================================
-- PASSO 2: Após criar o usuário no Supabase Auth Dashboard,
-- execute o comando abaixo para marcar como admin:
-- ============================================================
-- UPDATE profiles SET is_admin = true WHERE email = 'matheusfrattinids@gmail.com';


-- ============================================================
-- ARQUIVO: 002_launch_features.sql
-- ============================================================
-- ============================================================
-- FITCOACH PRO - Funcionalidades de Lançamento
-- 2FA por SMS, WhatsApp Business API, Google Calendar, Vídeos
-- ============================================================
--
-- Observações de adaptação ao schema existente:
-- - A tabela de trainers já existe como "profiles" (não "trainers").
-- - "profiles" já tem uma coluna "phone" (contato geral, opcional).
--   phone_number/phone_verified são novos, dedicados ao 2FA por SMS.
-- - "students" já tem uma coluna "whatsapp" (obrigatória) com o número
--   de contato — reaproveitada como o número de envio. Não foi criada
--   whatsapp_number duplicada, apenas as colunas de opt-in.
-- - Não existe tabela de agendamento de aulas (student_workout_schedules
--   é só a grade semanal de treino, sem horário/hora); "sessions" é
--   criada como tabela nova.

CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================================
-- PROFILES: 2FA por SMS
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS two_factor_channel TEXT DEFAULT 'email'
  CHECK (two_factor_channel IN ('email', 'sms'));

-- ============================================================
-- STUDENTS: opt-in de WhatsApp
-- ============================================================
ALTER TABLE students ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS whatsapp_opt_in_at TIMESTAMPTZ;

-- ============================================================
-- TABELA: whatsapp_messages (log de envios)
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  message_sid TEXT UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('workout_pdf', 'reminder', 'video', 'generic')),
  status TEXT NOT NULL DEFAULT 'queued',
  error_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_trainer_id ON whatsapp_messages(trainer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_student_id ON whatsapp_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_message_sid ON whatsapp_messages(message_sid);

-- ============================================================
-- TABELA: calendar_connections (OAuth Google Calendar)
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_connections (
  trainer_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google',
  refresh_token TEXT NOT NULL,
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  connected_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: sessions (aulas agendadas)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  google_event_id TEXT,
  recurrence_rule TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (ends_at > starts_at),
  EXCLUDE USING gist (
    trainer_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  )
);

CREATE INDEX IF NOT EXISTS idx_sessions_trainer_id ON sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student_id ON sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_starts_at ON sessions(starts_at);
CREATE INDEX IF NOT EXISTS idx_sessions_reminder_pending ON sessions(starts_at) WHERE reminder_sent = false;

-- ============================================================
-- TABELA: workout_videos (biblioteca de vídeos)
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_seconds INT,
  size_bytes BIGINT,
  shared_to_library BOOLEAN DEFAULT false,
  library_status TEXT NOT NULL DEFAULT 'private'
    CHECK (library_status IN ('private', 'pending_review', 'published', 'rejected')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_videos_trainer_id ON workout_videos(trainer_id);
CREATE INDEX IF NOT EXISTS idx_workout_videos_workout_id ON workout_videos(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_videos_library_status ON workout_videos(library_status);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_messages_own_trainer" ON whatsapp_messages
  FOR ALL USING (auth.uid() = trainer_id);

CREATE POLICY "calendar_connections_own_trainer" ON calendar_connections
  FOR ALL USING (auth.uid() = trainer_id);

CREATE POLICY "sessions_own_trainer" ON sessions
  FOR ALL USING (auth.uid() = trainer_id);

CREATE POLICY "workout_videos_own_trainer" ON workout_videos
  FOR ALL USING (auth.uid() = trainer_id);

CREATE POLICY "workout_videos_published_readable" ON workout_videos
  FOR SELECT USING (library_status = 'published');

-- ============================================================
-- STORAGE: bucket privado para vídeos de treino
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('workout-videos', 'workout-videos', false, 209715200)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- ARQUIVO: 003_push_token.sql
-- ============================================================
-- ============================================================
-- FITCOACH PRO - App Mobile: token de push (Expo)
-- ============================================================
--
-- Adiciona profiles.push_token, usado pelo app mobile para receber
-- lembretes de aula. O token é gravado por POST /api/notifications/
-- register-token (o trainer só atualiza o próprio perfil, via policy
-- "profiles_own"). Coluna opcional; não afeta nada do web.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;


-- ============================================================
-- ARQUIVO: 004_video_storage_security.sql
-- ============================================================
-- ============================================================
-- FITCOACH PRO - Segurança do storage de vídeos
-- ============================================================
--
-- Bucket privado 'workout-videos' + RLS em storage.objects.
-- Path dos objetos: {trainer_id}/{uuid}-{arquivo}. O primeiro folder
-- do path é o dono (auth.uid()), o que permite policies por dono.
--
-- Observação: as policies da TABELA public.workout_videos já existem na
-- migration 002 (workout_videos_own_trainer = FOR ALL com auth.uid() =
-- trainer_id, e workout_videos_published_readable = SELECT dos publicados).
-- Esse modelo é mais restritivo/privado que "SELECT para todos" e é mantido
-- de propósito (vídeos não publicados não vazam metadados). Aqui só
-- garantimos o RLS ligado e configuramos o storage.

-- Bucket privado com limite de 200 MB e MIME types de vídeo permitidos.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workout-videos',
  'workout-videos',
  false,
  209715200, -- 200 MB
  ARRAY['video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 209715200,
  allowed_mime_types = ARRAY['video/mp4', 'video/quicktime', 'video/webm'];

-- RLS na tabela (idempotente; policies vêm da 002).
ALTER TABLE public.workout_videos ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Policies do storage.objects para o bucket 'workout-videos'
-- (storage.foldername(name))[1] = primeiro folder = trainer_id.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "wv_objects_insert_own" ON storage.objects;
CREATE POLICY "wv_objects_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'workout-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT para authenticated: necessário para gerar signed URLs dos vídeos
-- publicados na biblioteca colaborativa (o path só é conhecido via a linha
-- publicada em workout_videos).
DROP POLICY IF EXISTS "wv_objects_select_auth" ON storage.objects;
CREATE POLICY "wv_objects_select_auth" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'workout-videos');

DROP POLICY IF EXISTS "wv_objects_update_own" ON storage.objects;
CREATE POLICY "wv_objects_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'workout-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'workout-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "wv_objects_delete_own" ON storage.objects;
CREATE POLICY "wv_objects_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'workout-videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ============================================================
-- ARQUIVO: 005_rls_hardening.sql
-- ============================================================
-- ============================================================
-- FITCOACH PRO - Hardening de RLS e privilégios
-- ============================================================
--
-- Auditoria (2026-07-09): todas as tabelas públicas já têm RLS habilitado
-- e as policies de escrita (INSERT/UPDATE/DELETE) usam auth.uid() = dono —
-- nenhuma usa `using (true)`. Os únicos SELECT amplos são intencionais:
--   - exercise_library: própria OU global
--   - workout_videos_published_readable: vídeos publicados (biblioteca)
--   - storage.objects (bucket workout-videos): SELECT autenticado (migration 004)
-- Esta migration reforça o RLS (idempotente) e revoga privilégios do role
-- anon nas tabelas que exigem autenticação.

-- 1) Garante RLS ligado em todas as tabelas públicas (idempotente).
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
  END LOOP;
END $$;

-- 2) Revoga privilégios do role anon no schema public.
-- O cadastro cria o profile via trigger handle_new_user() (SECURITY DEFINER),
-- e login/signup usam o schema auth — nada em public precisa do anon.
-- A proteção real continua sendo o RLS; isto é defesa em profundidade.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Novos objetos criados no futuro também não concedem nada ao anon.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;

