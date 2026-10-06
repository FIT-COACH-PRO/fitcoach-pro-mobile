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



-- ============================================================
-- ARQUIVO: 006_weekend_features.sql
-- ============================================================
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
